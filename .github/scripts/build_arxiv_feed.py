#!/usr/bin/env python3
"""Build the daily arXiv feed for Yuxuan Xue's homepage.

Fetches the newest submissions in robotics / CV / ML / AI from the arXiv API,
scores them toward the site owner's research interests (embodied AI, RL, CV),
and writes a compact JSON feed consumed by /daily.html.

Usage: python3 build_arxiv_feed.py [output_path]   (default: daily_papers.json)
Standard library only — runs anywhere, including GitHub Actions.
"""

import json
import re
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

ARXIV_API = "https://export.arxiv.org/api/query"
QUERY = "(cat:cs.RO OR cat:cs.CV OR cat:cs.LG OR cat:cs.AI)"
MAX_RESULTS = 100
WINDOW_DAYS = 4  # keep papers submitted in the last few days

# (label, emoji, weight, keywords) — higher weight = stronger interest
SCORERS = [
    ("Embodied AI & Robotics", "🤖", 3.0, [
        "embodied", "vision-language-action", "vla", "robot", "robotic",
        "manipulation", "locomotion", "dexterous", "humanoid", "grasp",
        "grasping", "navigation", "embodied agent", "sim-to-real", "world model",
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


def fetch() -> str:
    params = urllib.parse.urlencode({
        "search_query": QUERY,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": MAX_RESULTS,
    })
    url = f"{ARXIV_API}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "scutxyx-homepage-feed/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8")


def flat(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def parse(atom_xml: str):
    ns = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    root = ET.fromstring(atom_xml)
    papers = []
    for entry in root.findall("a:entry", ns):
        abs_url = (entry.findtext("a:id", default="", namespaces=ns) or "").strip()
        pdf_url = ""
        for link in entry.findall("a:link", ns):
            if link.get("title") == "pdf":
                pdf_url = link.get("href", "")
        authors = [flat(a.findtext("a:name", default="", namespaces=ns))
                   for a in entry.findall("a:author", ns)]
        cats = [c.get("term", "") for c in entry.findall("a:category", ns)]
        primary = entry.find("arxiv:primary_category", ns)
        papers.append({
            "id": abs_url.split("/abs/")[-1],
            "url": abs_url,
            "pdf": pdf_url,
            "title": flat(entry.findtext("a:title", default="", namespaces=ns)),
            "summary": flat(entry.findtext("a:summary", default="", namespaces=ns))[:600],
            "authors": authors,
            "published": (entry.findtext("a:published", default="", namespaces=ns) or "")[:10],
            "primary_category": primary.get("term", "") if primary is not None else (cats[0] if cats else ""),
            "categories": cats,
        })
    return papers


def score(paper: dict):
    text = (paper["title"] + " " + paper["summary"]).lower()
    best = ("✨", "AI & LLM", 0.0)
    total = 0.0
    for label, emoji, weight, keywords in SCORERS:
        hits = sum(1 for k in keywords if k in text)
        s = hits * weight
        total += s
        if s > best[2]:
            best = (emoji, label, s)
    paper["score"] = round(total, 2)
    paper["pick"] = best[1]
    paper["pick_emoji"] = best[0]
    return paper


def main(out_path: str):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)).date()
    raw = fetch()
    papers = [p for p in parse(raw)
              if datetime.strptime(p["published"], "%Y-%m-%d").date() >= cutoff]
    papers = [score(p) for p in papers]
    papers.sort(key=lambda p: (-p["score"], p["published"]), reverse=False)
    papers.sort(key=lambda p: -p["score"])
    feed = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "query_categories": ["cs.RO", "cs.CV", "cs.LG", "cs.AI"],
        "count": len(papers),
        "papers": papers[:24],
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)
    print(f"wrote {feed['count']} papers (fetched {len(papers)} in window) -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "daily_papers.json")
