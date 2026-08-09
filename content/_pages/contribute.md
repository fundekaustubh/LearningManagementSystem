---
title: Contribute a Tutorial
description: How the content is structured and what makes a good addition to the site.
---

## Adding or editing content

Every tutorial is a single Markdown file under `content/<track>/`. The build script turns it into a page, adds it to the navigation, the search index and the practice bank automatically. There is nothing else to register.

```text
content/
├── foundations/
├── statistics/
├── sql/
├── visualization/
├── predictive/
├── domains/
├── cheatsheets/
├── _data/glossary.json
└── _pages/
```

## Front matter

```text
---
title: Window Functions
description: One sentence that appears in cards, search results and meta tags.
order: 4
difficulty: Intermediate
tags: [sql, window-functions, growth]
---
```

`order` controls position within the track and therefore the prev/next links. `difficulty` is one of Beginner, Intermediate or Advanced.

## Available Markdown

Standard Markdown, plus two extensions.

**Callouts** — blockquotes with a type marker:

```text
> [!NOTE]      informational aside
> [!TIP]       practical advice
> [!WARNING]   a trap worth avoiding
> [!EXAMPLE]   a worked example
> [!INTERVIEW] how the topic comes up in interviews
```

**Quizzes** — a fenced block of JSON, rendered as an interactive widget and added to the practice bank:

````text
```quiz
[
  {
    "q": "The question text.",
    "options": ["First", "Second", "Third", "Fourth"],
    "answer": 1,
    "explain": "Why that answer is right, and why the tempting wrong one is wrong."
  }
]
```
````

`answer` is a zero-based index. Two to four questions per tutorial works well.

**Formulas** — wrap them in `$...$`. A LaTeX subset is rendered to HTML:

| Syntax | Result |
| --- | --- |
| `\frac{a}{b}` | stacked fraction |
| `\sqrt{x}`, `\sqrt[3]{x}` | radical, with optional index |
| `x^2`, `e^{-x}` | superscript |
| `β_0`, `z_{α/2}` | subscript |
| `\left( … \right)` | parentheses sized to their contents |
| `\times \cdot \pm \approx \le \ge \sum \infty` | symbols |
| `\alpha \beta \sigma \mu \Sigma` | Greek letters |
| `\ ` | a space between words inside a formula |

Unicode is fine directly too — `Σ`, `√`, `²`, `x̄`, `α` all pass through. An
unrecognised command degrades to readable text rather than breaking the page,
and a `$` inside backticks is never treated as a formula.

Code fences support `sql`, `python`, `r`, `bash` and `text` highlighting.

## What makes a good tutorial

- **One topic, done thoroughly.** Better to cover window functions properly than to survey ten SQL features shallowly.
- **A realistic business example** with concrete numbers. Abstract examples are forgotten immediately.
- **The failure modes.** What goes wrong in practice is usually the most valuable part of the page, and the part missing from most other material.
- **Honest caveats.** If a technique is commonly misused, say so.
- **Links to related tutorials**, using relative paths like `../../sql/window-functions/`.
- **Key takeaways** as a short bulleted list before the quiz.

## Building locally

```bash
npm run build     # generate docs/
npm run serve     # build and serve at http://localhost:4173
```

The build has no dependencies — Node 18 or later is all that is required. It regenerates `docs/` from scratch each time, so any change to content or templates is reflected immediately.

## Style notes

- Write in the second person, plainly, and avoid hype.
- Define every term the first time it appears.
- Prefer a table to a long list when comparing options.
- Round numbers in prose; full precision belongs in code.
- Keep code examples runnable and commented where the intent is not obvious.
