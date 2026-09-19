#!/usr/bin/env python3
"""Build the daily arXiv feed for Yuxuan Xue's homepage.

Primary source: the official arXiv announcement RSS feeds (rss.arxiv.org),
which tolerate polling far better than the REST API. Fallback: the Atom API
(export.arxiv.org), which arXiv rate-limits aggressively on cloud IPs.

Entries are scored toward the site owner's research interests (embodied AI,
RL, CV) and the top ones are written as the JSON feed consumed by /daily.html.

Usage: python3 build_arxiv_feed.py [output_path]   (default: daily_papers.json)
Standard library only — runs anywhere, including GitHub Actions.
"""

import email.utils
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

RSS_BASE = "https://rss.arxiv.org/rss/"
ARXIV_API = "https://export.arxiv.org/api/query"
CATEGORIES = ["cs.RO", "cs.CV", "cs.LG", "cs.AI"]
WINDOW_DAYS = 4

# (label, emoji, weight, keywords) — higher weight = stronger interest
SCORERS = [
    ("Embodied AI & Robotics", "🤖", 3.0, [
        "embodied", "vision-language-action", "vla", "robot", "robotic",
        "manipulation", "locomotion", "dexterous", "humanoid", "grasp",
        "grasping", "navigation", "sim-to-real", "world model",
    ]),
    ("Reinforcement Learning", "🎮", 2.5, [
        "reinforcement learning", "rl ", " rl", "policy", "reward",
        "rlhf", "offline rl", "online rl", "q-learning", "actor-critic",
        "sample efficiency", "exploration",
    ]),
    ("Computer Vision", "👁", 1.5, [
        "vision", "visual", "image", "detection", "segmentation",
        "3d ", "3d-", "video", "diffusion", "generation", "depth", "point cloud",
    ]),
    ("AI & LLM", "✨", 1.0, [
        "language model", "llm", "multimodal", "foundation model",
        "large model", "agent", "reasoning",
    ]),
]

RSS_NS = "{http://purl.org/rss/1.0/}"


# ---- trending signals ----
STAR_AUTHORS = [
    "sergey levine", "chelsea finn", "pieter abbeel", "yuke zhu", "anima anandkumar",
    "russ tedrake", "dieter fox", "jitendra malik", "kaiming he", "fei-fei li",
    "andy zeng", "karol hausman", "brian ichter", "ted xiao", "anthonyBrohan",
    "lerrel pinto", "vincent vanhoucke", "dorsa sadigh", "emma brunskill",
    "hao su", "huazhe xu", "jiafei", "chenfeng xu", "xiaolong wang",
]
STAR_ORGS = [
    "stanford", "berkeley", "mit", "cmu", "carnegie mellon", "deepmind",
    "openai", "nvidia", "tsinghua", "peking university", "sjtu", "pku",
    "hugging face", "eth zurich", "oxford", "princeton", "caltech", "meta ai",
    "google deepmind", "ucsd", "umich", "georgia tech",
]
HOT_TERMS = [
    "vla", "vision-language-action", "world model", "humanoid", "dexterous",
    "sim-to-real", "foundation model", "diffusion policy", "flow matching",
    "open-source", "benchmark", "state-of-the-art",
]


def http_get(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "scutxyx-homepage-feed/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def flat(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def clean_abstract(desc: str) -> str:
    """RSS descriptions look like 'arXiv:2609.13224v1 Announce Type: new
    Abstract: <text>' — strip the wrapper and keep the abstract text."""
    text = html.unescape(desc or "")
    m = re.search(r"Abstract:\s*([\s\S]+)", text, re.I)
    if m:
        text = m.group(1)
    return re.sub(r"\s+", " ", text).strip()


def parse_rss_date(text: str) -> str:
    try:
        dt = email.utils.parsedate_to_datetime(text)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def fetch_rss(cat: str) -> str:
    url = RSS_BASE + "rss/" + cat
    last_err = None
    for attempt in range(1, 3):
        req = urllib.request.Request(url, headers={"User-Agent": "scutxyx-homepage-feed/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read().decode("utf-8")
        except Exception as e:
            last_err = e
            print(f"rss {cat} attempt {attempt}/2 failed: {e}", file=sys.stderr)
            time.sleep(15)
    raise RuntimeError(f"rss.arxiv.org unreachable: {last_err}")



# ---- tier 3: OpenAlex (CC0, extremely reliable, different infrastructure) ----
OPENALEX = "https://api.openalex.org/works"
OPENALEX_MAILTO = "1120135876@qq.com"
OPENALEX_QUERIES = [
    "robot OR manipulation OR embodied OR vision-language-action OR humanoid",
    "reinforcement learning OR policy learning OR reward",
    "computer vision OR image OR video OR diffusion",
]

def rebuild_abstract(inv: dict) -> str:
    if not inv:
        return ""
    pos = {}
    for word, idxs in inv.items():
        for i in idxs:
            pos[i] = word
    return " ".join(pos[i] for i in sorted(pos))


def fetch_openalex(day_from: str, day_to: str) -> list:
    out = []
    for q in OPENALEX_QUERIES:
        params = urllib.parse.urlencode({
            "filter": f"publication_date:{day_from}|{day_to},title_and_abstract.search:{q}",
            "sort": "publication_date:desc",
            "per-page": 50,
            "mailto": OPENALEX_MAILTO,
        })
        req = urllib.request.Request(f"{OPENALEX}?{params}",
                                     headers={"User-Agent": "scutxyx-homepage-feed/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"openalex '{q[:30]}…' failed: {e}", file=sys.stderr)
            continue
        for w in data.get("results", []):
            aid = (w.get("ids", {}) or {}).get("openalex", "") or w.get("id", "")
            pdf = None
            oa = w.get("open_access", {}) or {}
            pdf = oa.get("oa_url") or ""
            authors = [a.get("author", {}).get("display_name", "")
                       for a in w.get("authorships", [])]
            out.append({
                "id": aid.split("/")[-1],
                "url": w.get("doi") or w.get("id", ""),
                "pdf": pdf,
                "title": flat(w.get("title", "")),
                "summary": flat(rebuild_abstract(w.get("abstract_inverted_index")))[:600],
                "authors": authors,
                "published": w.get("publication_date", ""),
                "primary_category": "openalex",
                "categories": ["openalex"],
            })
    return out

def trend_score(paper: dict) -> float:
    """Heuristic 'is this paper likely to matter?' score: known authors,
    famous labs and hot-topic keywords in title+abstract."""
    text = (paper["title"] + " " + paper["summary"]).lower()
    score = 0.0
    for a in paper.get("authors", []):
        al = a.lower()
        if any(s == al or s in al for s in STAR_AUTHORS):
            score += 2.0
        if any(o in al for o in STAR_ORGS):
            score += 1.0
    score += 1.5 * sum(1 for k in HOT_TERMS if k in text)
    if paper.get("cited_by_count"):
        score += min(3.0, paper["cited_by_count"] / 5.0)
    return round(score, 2)


def enrich_with_openalex(papers: list):
    """Best-effort: attach cited_by_count from OpenAlex by title lookup.
    Purely optional — enrichment failures never break the feed."""
    if len(papers) > 20:
        return
    for p in papers[:20]:
        try:
            q = urllib.parse.urlencode({
                "filter": "title.search:" + p["title"][:80],
                "per-page": 1, "mailto": "1120135876@qq.com",
            })
            req = urllib.request.Request(f"{OPENALEX}?{q}",
                                         headers={"User-Agent": "scutxyx-homepage-feed/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            res = data.get("results", [])
            if res:
                p["cited_by_count"] = res[0].get("cited_by_count", 0)
        except Exception as e:
            print(f"openalex enrich skipped ({e})", file=sys.stderr)
            return


def score(paper: dict) -> dict:
    text = (paper["title"] + " " + paper["summary"]).lower()
    best = ("✨", "AI & LLM", 0.0)
    for label, emoji, weight, keywords in SCORERS:
        hits = sum(1 for k in keywords if k in text)
        s = hits * weight
        if s > best[2]:
            best = (emoji, label, s)
    paper["score"] = round(best[2], 2)
    paper["pick"] = best[1]
    paper["pick_emoji"] = best[0]
    return paper


def parse_rss(xml_text: str) -> list:
    """arXiv RSS items are plain-namespaced <item> elements."""
    root = ET.fromstring(xml_text)
    out = []
    for item in root.iter():
        if item.tag != "item":
            continue
        t_el = item.find("title")
        l_el = item.find("link")
        d_el = item.find("description")
        title = flat(t_el.text if t_el is not None and t_el.text else "")
        link = flat(l_el.text if l_el is not None and l_el.text else "")
        if not title or not link:
            continue
        aid = link.split("/abs/")[-1].split("v")[0]
        desc = clean_abstract(d_el.text if d_el is not None and d_el.text else "")
        creators = [flat(c.text or "") for c in item.findall("dc:creator")]
        cat_el = item.find("category")
        cat = cat_el.text.strip() if cat_el is not None and cat_el.text else "cs.RO"
        pub = item.find("pubDate")
        published = parse_rss_date(pub.text) if pub is not None and pub.text \
            else datetime.now(timezone.utc).strftime("%Y-%m-%d")
        out.append({
            "id": aid,
            "url": "https://arxiv.org/abs/" + aid,
            "pdf": "https://arxiv.org/pdf/" + aid,
            "title": title,
            "summary": desc[:600],
            "authors": creators,
            "published": published,
            "primary_category": cat,
            "categories": [cat],
        })
    return out


def main(out_path: str):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)).date()
    by_id = {}

    for cat in CATEGORIES:
        try:
            xml_text = fetch_rss(cat)
        except Exception as e:
            print(f"rss {cat} failed: {e}", file=sys.stderr)
            continue
        for p in parse_rss(xml_text):
            if p["id"] in by_id:
                continue
            by_id[p["id"]] = p

    papers = []
    for p in by_id.values():
        try:
            if datetime.strptime(p["published"], "%Y-%m-%d").date() >= cutoff - timedelta(days=1):
                papers.append(score(p))
        except Exception:
            papers.append(score(p))

    # tier 3: if arXiv sources came up empty today, fall back to OpenAlex
    if len(papers) < 10:
        day_from = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")
        day_to = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for p in fetch_openalex(day_from, day_to):
            if p["id"] not in {q["id"] for q in papers}:
                papers.append(score(p))

    papers.sort(key=lambda p: -p["score"])
    papers = papers[:24]
    enrich_with_openalex(papers)
    for p in papers:
        p["trending"] = trend_score(p)

    feed = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "query_categories": CATEGORIES,
        "count": len(papers),
        "papers": papers,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)
    print(f"wrote {feed['count']} papers ({len(by_id)} unique fetched) -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "daily_papers.json")
