# Yuxuan Xue's Academic Homepage

Personal academic homepage of **Yuxuan Xue (薛宇轩)** — undergraduate in Artificial Intelligence at South China University of Technology (SCUT), working on **Embodied AI** and **Reinforcement Learning**.

Live site: [scutxyx.github.io](https://scutxyx.github.io)

## Site Map

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | About, news, education, research experience, projects, awards, skills, hobbies |
| Knowledge Space | `/blog.html` | Research notes and paper reading reports |
| Daily arXiv Papers | `/daily.html` | Daily fresh arXiv feed (embodied AI / RL / CV), auto-updated by GitHub Action |
| Publications | `/publications.html` | Paper shelf — submissions under review and future publications |
| Guestbook | `/guestbook.html` | Leave messages & suggestions, collaboration invitations |
| Diary | `/diary.html` | Daily growth log — one petal a day 🌸 (calendar + streaks) |
| Writing Studio | `/studio.html` | **Private** in-browser blog studio (hidden, GitHub-token gated) |

## Publishing blog posts

No local toolchain needed — open `/studio.html`, paste your GitHub token once
(fine-grained, this repo only, Contents read/write), write markdown with live
preview, paste screenshots, and hit publish. New posts land in `_posts/` and
appear on `/blog.html` automatically after the site rebuilds (~1–2 min).

Prefer markdown files? Drop `_posts/YYYY-MM-DD-title.md` into the repo and push —
same result.
| RL Token report | `/report/rl_token.html` | Paper reading report (VLA + online RL) |
| Research roadmap | `/posts/embodied_ai_roadmap.html` | Embodied AI & RL research roadmap |
| Learning Resources | `/resources.html` | Study notes archive |
| CV Resources | `/subject_vision.html` | Computer vision study notes |
| CV / Resume | `/files/CV_Yuxuan_Xue.pdf` | Printable resume |

## Theme

The site uses a **handwritten / anime-pastel** style:

- **Fonts**: [Caveat](https://fonts.google.com/specimen/Caveat) for headings, [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) for body text, [Kalam](https://fonts.google.com/specimen/Kalam) for accents — all Google Fonts.
- **Background**: dreamy sakura-pastel gradient with falling sakura petals (canvas animation, disabled for `prefers-reduced-motion` users).
- All theme styling lives in `assets/css/anime.css`; petal animation in `assets/js/sakura.js`.

## Tech

Built with [Jekyll](https://jekyllrb.com/) on the [WowPage](https://github.com/WD7ang/WowPage) template (adapted from the Academic Pages theme). Compatible with GitHub Pages.

## Local Development

```bash
./serve.sh        # builds and serves at http://localhost:4000
```

Requirements: Homebrew Ruby (`brew install ruby`) — the script handles the rest.
