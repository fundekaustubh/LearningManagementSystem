# AnalyticsAdda

A GeeksforGeeks-style learning website where students can learn **business analytics** concepts — built as a dependency-free static site.

**36 tutorials · 6 learning tracks · 108 practice questions · 102 glossary terms · 4 cheat sheets**

---

## Quick start

```bash
npm run build     # generate the site into docs/
npm run serve     # build and serve at http://localhost:4173
```

Node 18+ is the only requirement. There are **no npm dependencies** — `node build.js` is the entire toolchain.

## What's in it

### Learning tracks

| # | Track | Tutorials | Covers |
|---|-------|-----------|--------|
| 1 | 🧭 Analytics Foundations | 6 | What analytics is, the four analytics types, CRISP-DM, measurement scales, KPI design, problem framing |
| 2 | 📊 Statistics & Probability | 8 | Descriptive stats, probability, distributions, sampling & CLT, confidence intervals, hypothesis testing, A/B testing, correlation vs causation |
| 3 | 🗄️ SQL & Data Wrangling | 6 | Query fundamentals, joins, aggregation, window functions, cohort/retention analysis, data cleaning |
| 4 | 📈 Visualization & Storytelling | 4 | Visualization principles, chart selection, dashboard design, data storytelling |
| 5 | 🤖 Predictive Analytics | 6 | Linear & logistic regression, trees and ensembles, clustering, forecasting, evaluation metrics |
| 6 | 💼 Applied Business Analytics | 6 | Marketing, CLV, RFM, finance, supply chain, people analytics |

Every tutorial follows the same structure: concept in plain English → formula or syntax → a worked example on realistic business data → the mistakes people actually make → key takeaways → an interactive quiz.

### Site features

- **Client-side full-text search** — `/` or `⌘K` to open, keyboard navigable, relevance-ranked across titles, headings, tags and body text
- **Interactive quizzes** — inline in every tutorial, plus a consolidated practice page with track filters and a randomised 10-question set
- **Progress tracking** — mark tutorials complete; per-track progress bars, saved in `localStorage`
- **Dark mode** — system-aware with a manual toggle, applied before first paint so there is no flash
- **Per-article table of contents** with scroll-spy, prev/next pagination, and related-tutorial links
- **Cheat sheets** for statistics, SQL, chart selection and business metrics
- **Glossary** of 102 terms, filterable, each linking to the tutorial that explains it
- **Responsive** down to 390px, with a print stylesheet for PDF export
- **Accessible** — skip link, semantic landmarks, keyboard support, visible focus rings, no colour-only encoding

No tracking, no cookies, no analytics scripts, no external requests. The site works offline once loaded.

## Project structure

```
├── build.js              # static site generator (~800 lines, no deps)
├── site.config.js        # site metadata, track definitions, navigation
├── lib/
│   ├── markdown.js       # Markdown renderer + callout/quiz extensions
│   ├── highlight.js      # syntax highlighter (SQL, Python, R, bash)
│   └── templates.js      # HTML layout and shared partials
├── content/
│   ├── foundations/      # one Markdown file per tutorial
│   ├── statistics/
│   ├── sql/
│   ├── visualization/
│   ├── predictive/
│   ├── domains/
│   ├── cheatsheets/
│   ├── _data/glossary.json
│   └── _pages/           # about, contribute
├── assets/
│   ├── css/style.css     # single stylesheet, CSS custom properties for theming
│   └── js/site.js        # search, quizzes, theme, progress, filters
├── scripts/serve.js      # local preview server
└── docs/                 # generated output (GitHub Pages serves this)
```

`docs/` is committed so the site can be served without a build step.

## Adding a tutorial

Drop a Markdown file into the right `content/<track>/` folder. The build picks it up automatically and adds it to the navigation, prev/next links, search index, and practice question bank.

```markdown
---
title: Window Functions
description: One sentence used in cards, search results and meta tags.
order: 4
difficulty: Intermediate
tags: [sql, window-functions, growth]
---

Body content in Markdown…
```

Two extensions beyond standard Markdown:

**Callouts** — `> [!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!EXAMPLE]`, `[!INTERVIEW]`

**Quizzes** — a fenced ` ```quiz ` block of JSON, rendered as an interactive widget and added to the practice bank:

```json
[
  {
    "q": "The question text.",
    "options": ["First", "Second", "Third", "Fourth"],
    "answer": 1,
    "explain": "Why that answer is right."
  }
]
```

See [`content/_pages/contribute.md`](content/_pages/contribute.md) for the full authoring guide.

## Deployment

The site is published to GitHub Pages automatically. **Merge into `main` and the live site updates** — no manual step, no build run locally.

### One-time setup

**Settings → Pages → Source: `GitHub Actions`**

That is the only thing that has to be done by hand; GitHub does not allow a workflow to enable Pages on its own. The site then goes live at:

```
https://<your-username>.github.io/LearningManagementSystem/
```

Free, and no custom domain required.

### How the pipeline works

| Workflow | Runs on | Does |
|---|---|---|
| `.github/workflows/build.yml` | every branch and PR | Builds, verifies committed `docs/` is current, runs the link checker. Gates merges. |
| `.github/workflows/deploy.yml` | pushes to `main` | Rebuilds from source, validates, publishes to Pages. |

The deploy workflow rebuilds from the Markdown sources rather than serving the committed `docs/` folder, so what goes live always matches the source in the merge commit. Validation runs *before* publishing, so a broken build fails the workflow instead of replacing a working site with a broken one.

Typical merge-to-live time is under a minute. You can also re-publish by hand from **Actions → Deploy to GitHub Pages → Run workflow**.

### Why it works on a project sub-path

Project Pages sites are served from `/RepoName/`, not the domain root, which breaks any site using absolute paths. Every internal link here is generated relative to the page it appears on, so no base-path configuration is needed. This is verified by serving the build under a simulated `/LearningManagementSystem/` prefix and exercising navigation, search, and asset loading in a browser.

## Design notes

**Why no dependencies?** The content is authored in this repo, so the Markdown subset needed is known and small. A ~250-line renderer covers it, the build runs in ~100ms, and there is no supply chain to audit or upgrade.

**Why relative links?** Absolute paths break when a site is served from a sub-path. Every page computes its own prefix from its depth, so the same output works from `file://`, a sub-directory, or a custom domain.

**Why is the search index a `.js` file rather than JSON?** It loads with a plain `<script>` tag, which works without `fetch` and therefore without a server — the generated site is fully browsable from the filesystem.

## Licence

MIT for the code. Educational content is free to read, share and adapt with attribution.
