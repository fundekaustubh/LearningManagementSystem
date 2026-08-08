---
title: Principles of Data Visualization
description: Why some charts are instantly readable and others are not — perceptual accuracy, data-ink, colour discipline and the ethics of the y-axis.
order: 1
difficulty: Beginner
tags: [visualization, design, perception]
---

A chart is a machine for turning numbers into a perception. Some encodings — position, length — are decoded by the visual system quickly and accurately. Others — area, angle, colour intensity — are decoded slowly and badly. Good visualization is mostly the discipline of using the accurate ones for the important comparisons.

## The accuracy ranking of visual encodings

Cleveland and McGill established this order experimentally, and it has held up. From most to least accurately perceived:

1. **Position along a common scale** — a bar chart, a dot plot
2. **Position along non-aligned scales** — small multiples
3. **Length** — stacked bar segments
4. **Angle / slope** — pie charts, line steepness
5. **Area** — bubble charts, treemaps
6. **Volume, curvature**
7. **Colour saturation and hue** — heatmaps, choropleths

**The practical rule:** put your most important comparison on the most accurate encoding available. If precise comparison matters, use position. Use area or colour only for showing rough patterns and structure.

> [!EXAMPLE]
> This ranking is why the pie chart is so often criticised. With five similar slices, ordering them by size is genuinely hard — you are comparing angles, rank 4. The same data as a sorted bar chart is comparing positions, rank 1, and takes a fraction of a second.
>
> Pie charts do have a legitimate use: **one part against the whole**, when the fraction is roughly a quarter, a half or three quarters. "38% of revenue comes from mobile" reads fine as a two-slice pie. Six slices does not.

## Data-ink and chartjunk

Edward Tufte's principle: maximise the ratio of ink that encodes data to total ink. Every non-data element must earn its place.

**Remove by default:**

- 3D effects on 2D data — they add distortion, never information
- Heavy gridlines, borders and background fills
- Redundant legends when direct labels fit
- Decorative icons, drop shadows, gradients
- Axis labels that repeat the title

**Keep, because they aid reading:**

- Light gridlines when readers must estimate values
- Direct labels on the lines or bars that matter
- A reference line for target, budget or previous period
- Annotation explaining an anomaly

> [!TIP]
> The best annotation on a business chart is a sentence, not a label. "Q3 dip reflects the Diwali shutdown at the Pune plant" prevents the same question in every meeting the chart appears in.

## The title should state the finding

The single highest-leverage improvement to most business charts.

| Weak (describes) | Strong (concludes) |
| --- | --- |
| "Monthly Revenue by Region" | "North region drove all of Q2's growth" |
| "Customer Churn Over Time" | "Churn doubled after the March price increase" |
| "Conversion by Device" | "Mobile converts at half the rate of desktop" |

The descriptive title makes the reader work out the point. The conclusive title tells them, then lets the chart serve as evidence. If you cannot write a conclusive title, you may not have a finding worth a chart.

## Colour discipline

Colour is the most abused channel in business dashboards. Three rules cover most cases.

**1. Use colour to encode, never to decorate.** If every bar is a different colour but they all represent the same measure, the colour is noise. One colour, sorted by value.

**2. Match the palette type to the data type.**

| Data | Palette | Example |
| --- | --- | --- |
| Categorical (unordered) | Qualitative — distinct hues | Product lines, regions |
| Ordered / sequential | Single hue, light → dark | Density, magnitude |
| Diverging around a midpoint | Two hues meeting at neutral | Change vs target, sentiment |

**3. Design for the 8% of men with colour vision deficiency.** Avoid red/green as the only distinction — a red-green "good/bad" chart is unreadable for a substantial part of any audience. Use blue/orange, add a shape or pattern, or label directly. And verify contrast: light grey text on white fails accessibility standards and looks weak on a projector.

Limit categorical colours to about **six**. Beyond that, nobody can hold the legend in memory — group the remainder into "Other".

## The y-axis and honest scaling

**Bar charts must start at zero.** Bars encode value by length; truncating the axis makes a 3% difference look like 300%. This is not a stylistic preference — it breaks the encoding.

**Line charts may start elsewhere**, because they encode change through slope rather than magnitude. Forcing a zero baseline on a chart tracking a rate between 94% and 96% flattens the entire signal.

> [!WARNING]
> The truncated bar chart is the most common form of unintentional dishonesty in business reporting. If someone asks you to "make the difference clearer" by adjusting the axis on a bar chart, the correct response is to switch to a chart of the *difference* itself, which shows the same information without distortion.

**Dual y-axes deserve their bad reputation.** Two series on different scales can be made to appear correlated or divergent purely by choosing the scales — the visual relationship is an artefact of your choice. Prefer two stacked charts sharing an x-axis, or index both series to 100 at a common starting point.

## Ordering

Unordered categories should be sorted by value, not alphabetically. Sorting turns "read every label and compare" into "look at the shape".

Exceptions where the natural order must be preserved:

- Time — always chronological
- Ordinal categories — Strongly Disagree → Strongly Agree
- A category readers will look up by name — a long list of countries
- Comparing across small multiples — keep the order consistent so shapes are comparable

## Small multiples

Repeating a small chart across categories, with identical axes and scales, is the most under-used technique in business visualization. Twelve small line charts — one per region, same axes — beat one line chart with twelve overlapping lines every time.

The eye compares shapes across panels extremely well. It cannot untangle twelve lines in the same space, no matter how carefully you colour them.

## Density and audience

Match the chart's complexity to how the reader will consume it:

| Context | Guideline |
| --- | --- |
| Executive slide | One chart, one message, 5 seconds to understand |
| Team dashboard | 4–8 charts, scannable, consistent layout |
| Analysis document | Denser charts are fine; readers can dwell |
| Exploration (yours) | Anything goes — no need to polish |

## A pre-publication checklist

1. Does the title state the finding?
2. Is the most important comparison on position or length?
3. Do bar charts start at zero?
4. Are categories sorted meaningfully?
5. Are units and time period labelled?
6. Does colour encode something, and does it survive greyscale?
7. Is any element removable without losing information?
8. Would someone with no context understand it unaided?
9. Are anomalies annotated rather than left to be asked about?
10. What is the honest caveat, and is it visible?

## Key takeaways

- Position and length are perceived accurately; area and colour are not — encode accordingly.
- Remove any ink that does not carry information, but keep aids to reading.
- Write conclusive titles that state the finding, not descriptive ones.
- Bars require a zero baseline; lines do not. Avoid dual y-axes.
- Sort unordered categories by value; use small multiples instead of many overlapping lines.
- Design colour for accessibility and cap categorical palettes at about six.

```quiz
[
  {
    "q": "Which encoding is perceived most accurately by the human visual system?",
    "options": ["Colour saturation", "Area", "Angle", "Position along a common scale"],
    "answer": 3,
    "explain": "Cleveland and McGill's ranking places position along a common scale first — which is why sorted bar and dot plots outperform pies and bubble charts for precise comparison."
  },
  {
    "q": "Why must bar charts start at zero while line charts need not?",
    "options": [
      "Convention only",
      "Bars encode value through length, so truncating the axis distorts the ratio; lines encode change through slope",
      "Line charts always contain negative values",
      "Bar charts cannot display small differences"
    ],
    "answer": 1,
    "explain": "Length is the encoding in a bar chart, so a truncated baseline literally misrepresents the magnitudes. Lines communicate change via slope, which survives a non-zero baseline."
  },
  {
    "q": "You need to compare a metric's trend across 12 regions. What is usually the best approach?",
    "options": [
      "One line chart with 12 coloured lines",
      "Small multiples — 12 small charts with identical axes",
      "A stacked area chart",
      "A pie chart per region"
    ],
    "answer": 1,
    "explain": "Twelve overlapping lines are impossible to disentangle. Small multiples with shared scales let the eye compare shapes across panels, which it does very well."
  }
]
```
