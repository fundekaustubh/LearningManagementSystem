# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

AnalyticsAdda — a GeeksforGeeks-style static learning site for business analytics.
Markdown in `content/` is compiled by `build.js` into `docs/`, which GitHub Pages
serves. **No npm dependencies**; `node build.js` is the entire toolchain.

## Workflow — do not ask the user to do things by hand

For any bug fix or change, drive it all the way to production without handing
the user manual steps:

1. Branch from the latest `main`.
2. Make the change, plus a test that fails without it.
3. `npm run check` (build + validate) and exercise the result in a browser.
4. Open a PR with a description of the cause, not just the symptom.
5. Review it, apply your own findings.
6. Merge it to `main` once CI is green.

Merging `main` publishes automatically — the deploy takes about a minute.
Only stop and ask when a change is genuinely ambiguous, architecturally
significant, or destructive. Repository *settings* are the one thing that can't
be automated (see Deployment below), but those are all configured now.

## Commands

```bash
npm run build     # generate docs/
npm run check     # build + validate links, anchors, quizzes, search index
npm run serve     # build and serve at http://localhost:4173
```

`docs/` is committed. CI fails if it does not match a fresh build, so **always
rebuild and commit `docs/` in the same commit** as any change to `content/`,
`assets/`, `lib/` or `build.js`.

## Invariants that have caused real bugs

Each of these shipped a defect once. Check them when touching related code.

**`localStorage` reader/writer symmetry.** The theme is read by an inline boot
script in `<head>` (`lib/templates.js`) with a plain `getItem`, so it must be
written as a **bare string**. `store.get`/`store.set` in `site.js` JSON-encode,
and are only for keys read back through the same helper (`aa-completed`,
`aa-score`). Mixing the two stored `"dark"` with quotes, which matched neither
`[data-theme="dark"]` nor `[data-theme="light"]` — dropping dark mode *and*
showing both toggle icons at once.

**Internal links must be relative.** Pages are served from a repository
sub-path (`/LearningManagementSystem/`). Every link is generated relative to
its own page via `linker(depth)` in `lib/templates.js`. Absolute paths like
`/tracks/` break in production but work locally — verify sub-path behaviour,
not just root behaviour.

**`[hidden]` needs the `!important` reset.** `.card` is `display: flex` and
`.glossary-item` is `display: grid`; author rules outrank the user-agent
`[hidden]` rule, so filtering silently does nothing without the reset in the
tokens block of `style.css`.

**CSS state should fail safe.** Key visibility off one state and hide by
default (as the theme icons do), so an unexpected attribute value degrades to
one sensible rendering rather than a broken one.

**Tests must exercise the real path.** Setting state with `page.evaluate` and
then asserting on it bypasses the code under test — that is exactly how the
theme bug survived a browser test. Toggle through the UI, then *navigate*, and
assert on the rendered result.

## Content authoring

One Markdown file per tutorial under `content/<track>/`. The build discovers it
and wires up navigation, prev/next, the search index and the practice bank
automatically. Front matter: `title`, `description`, `order`, `difficulty`,
`tags`.

Two extensions beyond standard Markdown:

- **Callouts** — `> [!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!EXAMPLE]`, `[!INTERVIEW]`
- **Quizzes** — a fenced ```` ```quiz ```` block of JSON (`q`, `options`,
  `answer` as a zero-based index, `explain`), lifted into both the article and
  `/practice/`

Use ```` ```` ```` (four backticks) to show a three-backtick fence verbatim.

House style: concept in plain English → formula or syntax → worked example on
realistic business data → the mistakes people actually make → key takeaways →
quiz. Business context in every example; state limitations honestly.

## Deployment

`.github/workflows/deploy.yml` rebuilds from source and publishes on every push
to `main`. `build.yml` validates every branch and PR.

Settings already configured — do not re-derive these:

- Pages source: **GitHub Actions** (not branch deploy)
- Default branch: `main`
- `github-pages` environment: deployment from `main` permitted

The site is at https://fundekaustubh.github.io/LearningManagementSystem/.
Note that `*.github.io` is blocked by the sandbox egress proxy, so the live page
cannot be fetched from here — verify via the workflow run and the GitHub
deployment status (`state: success`) instead, and say plainly that the page
itself was not loaded.
