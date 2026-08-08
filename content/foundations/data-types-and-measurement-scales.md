---
title: Data Types and Measurement Scales
description: Nominal, ordinal, interval and ratio scales — and why the scale of a variable decides which statistics and charts are legitimate.
order: 4
difficulty: Beginner
tags: [fundamentals, statistics, data-types]
---

Before you compute anything, you need to know what kind of thing you are computing on. The **measurement scale** of a variable determines which operations are meaningful. Averaging a set of postal codes is arithmetically possible and completely meaningless — the scale is what tells you so.

## The two families

**Categorical (qualitative)** data places observations into groups. **Numerical (quantitative)** data measures quantity.

Numerical splits further:

- **Discrete** — countable values. Number of orders, seats sold. You cannot have 2.5 orders.
- **Continuous** — any value in a range. Revenue, time on page, weight. Precision is limited only by measurement.

## The four measurement scales

Stanley Stevens' classification is the standard, and each level supports everything the level below it supports, plus more.

| Scale | Distinct values | Ordered | Equal intervals | True zero | Example |
| --- | :---: | :---: | :---: | :---: | --- |
| Nominal | ✓ | ✗ | ✗ | ✗ | Region, payment method |
| Ordinal | ✓ | ✓ | ✗ | ✗ | Satisfaction 1–5, T-shirt size |
| Interval | ✓ | ✓ | ✓ | ✗ | Temperature °C, calendar year |
| Ratio | ✓ | ✓ | ✓ | ✓ | Revenue, age, units sold |

### Nominal — labels with no order

Categories that cannot be ranked: `payment_method` ∈ {card, UPI, netbanking, COD}, customer segment, country.

Legitimate: counts, proportions, mode, chi-square tests, bar charts.
Not legitimate: mean, median, "average payment method".

> [!WARNING]
> Nominal data is frequently stored as integers — region coded 1, 2, 3. Nothing stops your tool from averaging it. Region 2.4 is not a place. Convert codes to labels early, or at least never let them into a numeric aggregation.

### Ordinal — ordered, but the gaps are unknown

Satisfaction ratings, seniority levels, "Low / Medium / High" risk bands. You know Very Satisfied > Satisfied, but you do not know that the gap equals the gap between Satisfied and Neutral.

Legitimate: median, percentiles, min/max, rank correlation (Spearman), stacked bars.
Contested: the mean. Reporting "average satisfaction 4.2" is universally done and technically assumes equal spacing between rating points. It is usually acceptable for tracking a trend on a consistent scale, and misleading when comparing across differently-worded scales.

> [!TIP]
> For Likert-scale survey data, reporting **top-two-box percentage** ("% rating 4 or 5") is often more robust and far easier for stakeholders to interpret than an average of ordinal codes.

### Interval — equal gaps, arbitrary zero

Temperature in Celsius, calendar years, standardised test scores. The difference between 20°C and 30°C equals that between 30°C and 40°C, but 0°C is a convention, not an absence of temperature.

Legitimate: mean, standard deviation, differences.
Not legitimate: **ratios**. 40°C is not "twice as hot" as 20°C. Neither is the year 2000 twice the year 1000.

### Ratio — equal gaps and a meaningful zero

Revenue, units, count of sessions, duration, age. Zero means none of it.

Everything is legitimate here, including ratios and percentage change: ₹200 really is twice ₹100. Most business metrics are ratio-scale, which is why growth rates and multiples are so natural in business analytics.

## Why this decides your chart and your statistic

The scale narrows your options before taste ever enters the picture:

| Variable(s) | Sensible summary | Sensible chart |
| --- | --- | --- |
| One nominal | Counts, proportions | Bar chart |
| One ordinal | Median, distribution of levels | Ordered bar, stacked bar |
| One continuous | Mean or median, spread | Histogram, box plot |
| Two continuous | Correlation, regression | Scatter plot |
| Continuous by nominal | Group means or medians | Grouped bar, box plot by group |
| Continuous over time | Change, growth rate | Line chart |

See [Choosing the Right Chart](../../visualization/choosing-the-right-chart/) for the full decision path.

## Practical complications

**Binary variables** (churned yes/no) are nominal with two levels, but coded 0/1 their mean is the proportion — which is genuinely meaningful. `avg(is_churned)` = churn rate. This is a legitimate and very common trick.

**Counts** are ratio-scale but often heavily skewed and bounded at zero, so the mean can be misleading. Report median and a percentile alongside it.

**Dates** are interval-scale. Differences between them (durations) are ratio-scale. This is why "average signup date" is nonsense but "average days to first purchase" is fine.

**Currency across time** is ratio-scale but not comparable across periods without adjusting for inflation or exchange rates. Nominal ₹100 in 2015 and 2025 are different quantities.

> [!EXAMPLE]
> A retail dataset column by column:
>
> | Column | Type | Scale | Valid summary |
> | --- | --- | --- | --- |
> | `order_id` | Categorical | Nominal | Count (never sum) |
> | `store_region` | Categorical | Nominal | Mode, counts |
> | `csat_rating` | Categorical | Ordinal | Median, top-two-box |
> | `order_date` | Date | Interval | Range, differences |
> | `items_in_basket` | Numeric discrete | Ratio | Mean, median |
> | `order_value` | Numeric continuous | Ratio | Mean, median, growth % |
> | `is_returned` | Binary | Nominal | Proportion (`avg()` of 0/1) |
>
> The single most common mistake in this table is summing `order_id` because it happens to be an integer.

## Key takeaways

- Scale determines which operations are meaningful, regardless of what the data type allows.
- Nominal: counts only. Ordinal: medians and percentiles. Interval: means and differences. Ratio: everything including ratios.
- Numeric-looking IDs and category codes are nominal — never aggregate them arithmetically.
- Binary 0/1 variables are the exception where a mean is a rate and is genuinely useful.
- Choose the summary statistic and the chart from the scale before considering anything else.

```quiz
[
  {
    "q": "Customer satisfaction is recorded on a 1-5 scale. Which summary is most defensible?",
    "options": [
      "The mean, because it uses all the information",
      "The median or a top-two-box percentage, because the scale is ordinal",
      "The sum of all ratings",
      "The geometric mean"
    ],
    "answer": 1,
    "explain": "The gaps between ordinal levels are not known to be equal, so median or top-two-box is more defensible. Means of Likert data are common but rest on an assumption of equal spacing."
  },
  {
    "q": "Why is it wrong to say 40 degrees Celsius is twice as hot as 20 degrees?",
    "options": [
      "Celsius is an ordinal scale",
      "Celsius is interval-scaled with an arbitrary zero, so ratios are meaningless",
      "Temperature is categorical",
      "It is correct"
    ],
    "answer": 1,
    "explain": "Interval scales have equal intervals but no true zero, so differences are meaningful while ratios are not."
  },
  {
    "q": "A column `is_returned` holds 0 or 1. What does avg(is_returned) give you?",
    "options": [
      "A meaningless number, since the variable is nominal",
      "The proportion of orders that were returned",
      "The median return status",
      "The total number of returns"
    ],
    "answer": 1,
    "explain": "Averaging a 0/1 indicator yields the proportion of 1s — the return rate. This is the standard exception to 'never average a categorical variable'."
  }
]
```
