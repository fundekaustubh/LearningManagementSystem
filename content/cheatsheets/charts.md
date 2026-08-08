---
title: Chart Selection
description: Question-to-chart mapping, encoding accuracy and the rules that keep a chart honest.
order: 3
---

## Question → chart

| Question | Chart |
| --- | --- |
| How has it changed over time? | Line; column for few periods |
| How do categories compare? | Sorted horizontal bar; dot plot for two values |
| How does the whole break down? | Stacked bar (≤4 parts), treemap (many), waterfall (change) |
| How is it distributed? | Histogram, box plot, violin, strip plot |
| How do two variables relate? | Scatter; hexbin when overplotted |
| Where is it happening? | Choropleth, symbol map |
| How do items flow? | Sankey, funnel, cohort heatmap |
| Actual vs target? | Bullet chart |

## Encoding accuracy (most → least)

1. Position on a common scale
2. Position on non-aligned scales
3. Length
4. Angle / slope
5. Area
6. Volume, curvature
7. Colour saturation and hue

Put the most important comparison on the most accurate encoding available.

## Non-negotiable rules

- **Bars start at zero.** Lines need not.
- **Sort unordered categories by value**, not alphabetically.
- **One message per chart**, stated in the title.
- **Never a line chart for unordered categories.**
- **Avoid dual y-axes** — index both series to 100 instead.
- **Cap categorical colours at ~6**; group the rest as "Other".
- **Label units and time period.**

## Colour

| Data | Palette |
| --- | --- |
| Categorical | Qualitative, distinct hues |
| Sequential | Single hue, light → dark |
| Diverging | Two hues meeting at a neutral midpoint |

Avoid red/green as the only distinction (~8% of men have colour vision deficiency). Check the chart in greyscale.

## Titles

| Weak | Strong |
| --- | --- |
| "Revenue by Region" | "North drove all of Q2's growth" |
| "Churn Over Time" | "Churn doubled after the March price rise" |

## Avoid

| Chart | Instead |
| --- | --- |
| 3D anything | The 2D version |
| Pie with >4 slices | Sorted bar |
| Radar / spider | Grouped bar, small multiples |
| Gauge | Bullet chart or a big number |
| Word cloud | Sorted bar of counts |
| Many-series stacked area | Line chart or small multiples |

## Dashboard checklist

- Most important number top-left
- Everything for the primary decision above the fold
- Every KPI has a comparison, a target or a trend
- Data timestamp always visible
- Failures show "data unavailable", never stale numbers
- Definitions documented on the page
