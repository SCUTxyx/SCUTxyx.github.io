# Yuxuan Xue's Academic Homepage

Personal academic homepage of **Yuxuan Xue (薛宇轩)** — undergraduate in Artificial Intelligence at South China University of Technology (SCUT), working on **Embodied AI** and **Reinforcement Learning**.

Live site: [scutxyx.github.io](https://scutxyx.github.io)

## Site Map

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | About, news, education, research experience, projects, awards, skills, hobbies |
| Knowledge Space | `/blog.html` | Research notes and paper reading reports |
| Daily arXiv Papers | `/daily.html` | Daily fresh arXiv feed (embodied AI / RL / CV), auto-updated by GitHub Action |
| Guestbook | `/guestbook.html` | Leave messages & suggestions, collaboration invitations |
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
bundle install
bundle exec jekyll serve
# then open http://localhost:4000
```
