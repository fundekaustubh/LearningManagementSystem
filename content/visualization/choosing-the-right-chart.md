---
title: Choosing the Right Chart
description: A decision path from the question you are answering to the chart that answers it, with the situations where each common chart type fails.
order: 2
difficulty: Beginner
tags: [visualization, charts, design]
---

Choose the chart from the **question**, not from the data type and never from the chart menu. Nearly every business question is one of seven relationships, and each has a small set of appropriate charts.

## The decision path

```text
What is the question?
│
├── How has it changed over time?        → Line, area, column (few periods)
├── How do categories compare?           → Sorted bar, dot plot, lollipop
├── How does the whole break down?       → Stacked bar, treemap, waterfall
├── How are values distributed?          → Histogram, box plot, violin, strip
├── How do two variables relate?         → Scatter, bubble, hexbin
├── Where is it happening (geography)?   → Choropleth, symbol map
└── How do items flow between states?    → Sankey, funnel, cohort heatmap
```

## Change over time

**Line chart.** The default. Works for many periods, multiple series (up to ~5), and any y-axis baseline.

**Column chart.** Better for few periods (under ~12) or when discrete periods matter more than the trend — quarterly results, for instance.

**Area chart.** Only when the cumulative total is genuinely the message. Stacked areas are hard to read for any series above the bottom one, because those segments no longer sit on a common baseline.

> [!WARNING]
> **Never use a line chart for unordered categories.** A line implies continuity between adjacent points. Connecting "North, South, East, West" suggests the space between North and South means something. Use bars.

For seasonal data, add a comparison: prior year on the same axes, or a 7/12-period moving average to expose the underlying trend. See [Window Functions](../../sql/window-functions/) for computing these.

## Comparison across categories

**Sorted horizontal bar chart** is the workhorse and is under-used. Horizontal handles long category names without rotated labels; sorting turns comparison into shape-reading.

**Dot plot** works better when comparing two values per category — this year vs last year — since two bars per category doubles the clutter while a dot pair is instantly readable.

**Bullet chart** for actual-vs-target with qualitative bands. Denser and more informative than a gauge, which uses a large area to convey a single number.

> [!TIP]
> If you have more than ~15 categories, do not shrink the bars — cut to the top 10 and group the rest as "Other", or switch to a distribution view. A bar chart of 60 categories is a table with extra steps.

## Part-to-whole

**Stacked bar.** Fine for 2–4 segments. Only the bottom segment sits on a common baseline, so comparing middle segments across bars is unreliable.

**100% stacked bar.** For composition when the total does not matter — share of revenue by segment over time.

**Treemap.** For many parts, or a hierarchy. Area encoding, so precise comparison is out; structure and dominance are the point.

**Waterfall.** For decomposing a change into contributions. The best chart in business analytics for explaining "why did revenue move from ₹4.2cr to ₹4.8cr" — it shows starting value, each positive and negative contribution, and the ending value.

**Pie.** One share against the whole, ideally two or three slices, and only when the fraction is near a recognisable landmark. Never for comparing several similar slices, and never as a trend across periods.

## Distribution

The most under-used chart family in business reporting, and often the most revealing.

**Histogram.** The shape of one variable. Bin width matters enormously — try several. Too few bins hides structure; too many turns it into noise.

**Box plot.** Median, quartiles and outliers, compact enough to compare many groups side by side. Hides multimodality, which is a real limitation.

**Violin / beeswarm.** Shows the full shape, so bimodality is visible. Better with moderate sample sizes.

**Strip / jitter plot.** Every observation as a point. Ideal for small n, where a box plot over 8 points is misleading precision.

> [!EXAMPLE]
> A support team reports mean resolution time of 4.2 hours, steady for six months. A histogram reveals two distinct peaks: 30 minutes and 9 hours. There are two populations — simple password resets and complex technical escalations — and the "average ticket" describes neither of them.
>
> The mean was hiding the entire structure of the problem. This is why distribution charts belong in operational reviews, not just in exploratory analysis.

## Relationship between variables

**Scatter plot.** Two continuous variables. Add a trend line only when a linear relationship is plausible, and be careful not to imply causation. See [Correlation vs Causation](../../statistics/correlation-vs-causation/).

**Bubble chart.** A third variable via size. Size scales by **area**, not radius — otherwise you exaggerate large values by the square. Most tools get this right; verify when hand-rolling.

**Hexbin or 2D density.** When the scatter has so many points it becomes a solid blob. Overplotting hides where the mass actually is.

**Correlation heatmap.** Many variable pairs at once. Useful for exploration, rarely appropriate for a stakeholder audience.

## Flow and process

**Funnel chart.** Stage-by-stage conversion. Report both step conversion and cumulative conversion — they answer different questions, and mixing them up is a common reporting error.

**Sankey diagram.** Flows between states — channel to product, plan upgrades and downgrades. Visually striking, and hard to read precisely; use for structure, not for numbers.

**Cohort heatmap.** The retention triangle, coloured by value. Colour intensity is a low-accuracy encoding, so the numbers should be printed in the cells too.

## Charts to avoid, and what to use instead

| Avoid | Why | Instead |
| --- | --- | --- |
| 3D anything | Distorts, occludes, adds nothing | The 2D version |
| Dual y-axes | Implied correlation is an artefact of scaling | Two stacked charts, or index both to 100 |
| Pie with >4 slices | Angle comparison is unreliable | Sorted bar |
| Radar/spider chart | Area depends on axis order | Grouped bar or small multiples |
| Gauge | Enormous area for one number | Bullet chart or a large number |
| Word cloud | Size encodes frequency, not importance | Sorted bar of term counts |
| Stacked area with many series | Only the bottom band is readable | Line chart or small multiples |

## Matching chart to audience

The same finding needs different treatment by context:

- **Executive.** One chart, conclusive title, annotated. They should not need to interpret anything.
- **Operational team.** Consistent layout, thresholds marked, updated on a schedule.
- **Analytical peers.** Distributions, uncertainty bands, sample sizes — the detail that lets them challenge you.

> [!TIP]
> Before finalising any chart, show it to someone with no context and ask: "what does this tell you?" If their answer is not your intended message, the chart is not finished. This takes two minutes and catches more problems than any checklist.

## Key takeaways

- Pick the chart from the question, not from the data or the tool's menu.
- Lines for time, sorted bars for categories, histograms and box plots for distributions, scatter for relationships.
- Never use a line for unordered categories, or a pie for more than a few slices.
- Waterfall charts are the best tool for explaining why a total moved.
- Distribution charts routinely reveal multiple populations hidden inside an average.
- Test the chart on someone without context before publishing it.

```quiz
[
  {
    "q": "You need to explain why quarterly revenue moved from ₹4.2 crore to ₹4.8 crore, broken into contributing factors. Which chart is best?",
    "options": ["Pie chart", "Waterfall chart", "Stacked area chart", "Scatter plot"],
    "answer": 1,
    "explain": "A waterfall shows a starting value, each positive and negative contribution, and the ending value — exactly the structure of a decomposition question."
  },
  {
    "q": "Mean ticket resolution time is stable at 4.2 hours, but a histogram shows peaks at 30 minutes and 9 hours. What does this indicate?",
    "options": [
      "The mean was calculated incorrectly",
      "Two distinct populations are mixed together, and the average describes neither",
      "The data needs more cleaning",
      "The histogram bins are wrong"
    ],
    "answer": 1,
    "explain": "Bimodality signals two different processes — simple and complex tickets here. The average sits in an empty valley between them and describes no actual ticket."
  },
  {
    "q": "Why are dual y-axis charts generally discouraged?",
    "options": [
      "They are hard to build in most tools",
      "The apparent relationship between the two series depends entirely on the arbitrary scaling chosen",
      "They cannot show time series",
      "They require too much colour"
    ],
    "answer": 1,
    "explain": "By adjusting either axis you can make the series appear correlated or divergent at will, so the visual relationship is an artefact rather than a finding."
  }
]
```
