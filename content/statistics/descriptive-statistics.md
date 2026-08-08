---
title: Descriptive Statistics for Business Data
description: Mean, median, spread, skew and percentiles — which summary to trust for messy business data, and why the average is so often the wrong answer.
order: 1
difficulty: Beginner
tags: [statistics, fundamentals, distributions]
---

Descriptive statistics compress many numbers into a few. The compression always loses information; the skill is losing the *unimportant* information. Business data is skewed, bounded at zero and full of outliers, which is exactly the situation where the default choice — the mean — performs worst.

## Measures of centre

### Mean

The arithmetic average: $x̄ = Σxᵢ / n$.

Uses every observation, which makes it efficient and also **completely non-robust**. One enterprise deal can drag the average order value away from anything a typical customer experiences.

### Median

The middle value when sorted. Half the observations lie below it.

Robust: change the largest value to a billion and the median does not move. For revenue, order value, session duration, salary, time-to-resolution — anything skewed — the median describes the typical case far better.

### Mode

The most frequent value. The only measure of centre available for nominal data. Also worth reporting for discrete business data: knowing that the modal basket size is 1 item is more actionable than knowing the mean is 2.4.

> [!EXAMPLE]
> Ten orders, in rupees:
> `450, 520, 610, 640, 700, 720, 800, 850, 900, 48,000`
>
> - **Mean** = ₹5,419 — higher than nine of the ten orders.
> - **Median** = ₹710 — describes the typical order.
> - **Trimmed mean** (drop top and bottom 10%) = ₹718.
>
> If you tell the merchandising team the average order is ₹5,419, they will plan for a business that does not exist.

**Rule of thumb:** if mean and median differ by more than ~10–15%, the distribution is skewed enough that you should report both, or the median alone.

## Measures of spread

Centre without spread is half a picture. Two regions can both average ₹700 per order — one steady, one wildly volatile — and require completely different decisions.

### Range and IQR

**Range** = max − min. Trivially affected by one outlier.

**Interquartile range (IQR)** = Q3 − Q1, the width of the middle 50%. Robust, and the basis of the box plot.

### Variance and standard deviation

Variance is the average squared deviation from the mean. Standard deviation is its square root, which returns the units to something interpretable.

$s = \sqrt{Σ(xᵢ - x̄)² / (n-1)}$

The $n-1$ (Bessel's correction) applies when estimating a population from a sample; it corrects the downward bias you get from measuring deviations against the sample's own mean.

Standard deviation is in the same units as the data, so it is directly comparable to the mean. That gives:

### Coefficient of variation

$CV = s / x̄$

A unitless relative spread, which is what you need to compare volatility across different scales. Daily revenue of a ₹10 lakh store and a ₹10 crore store cannot be compared by standard deviation, but their CVs can.

> [!EXAMPLE]
> Two sales regions, both averaging ₹700 per order:
>
> | | Region A | Region B |
> | --- | --- | --- |
> | Mean | ₹700 | ₹700 |
> | Std dev | ₹90 | ₹410 |
> | CV | 0.13 | 0.59 |
>
> Region B's revenue is far less predictable. That changes inventory planning, staffing and how much you should trust *any* single month from Region B.

## Percentiles

The pth percentile is the value below which p% of observations fall. They are the most under-used summary in business analytics, and often the most decision-relevant.

- **p50** = median.
- **p90 / p95 / p99** — the tail. For page-load time, support resolution time or delivery time, the tail *is* the customer experience. A mean load time of 1.2s with a p95 of 14s means one in twenty visitors is having a terrible time.
- **p10** — the floor. Useful for capacity and worst-case planning.

```sql
-- Percentiles of delivery time by city
SELECT city,
       count(*)                                                           AS deliveries,
       round(avg(minutes_to_deliver), 1)                                  AS mean,
       percentile_cont(0.5)  WITHIN GROUP (ORDER BY minutes_to_deliver)   AS p50,
       percentile_cont(0.9)  WITHIN GROUP (ORDER BY minutes_to_deliver)   AS p90,
       percentile_cont(0.99) WITHIN GROUP (ORDER BY minutes_to_deliver)   AS p99
FROM   deliveries
WHERE  delivered_at >= current_date - interval '30 days'
GROUP  BY 1
ORDER  BY p90 DESC;
```

> [!TIP]
> Service-level targets should almost always be stated as percentiles, not averages. "95% of orders delivered within 40 minutes" is a promise you can be held to. "Average delivery 32 minutes" is compatible with 10% of orders taking two hours.

## Shape: skew and kurtosis

**Right (positive) skew** — a long tail of large values. Mean > median. This is the default shape of business data: revenue per customer, session length, order value, company size.

**Left (negative) skew** — a long tail of small values. Mean < median. Less common; shows up in bounded scores like exam results or satisfaction ratings clustered at the top.

**Kurtosis** describes tail heaviness — how often extreme values occur relative to a normal distribution. High kurtosis means rare-but-huge events matter, which is exactly the regime where averages mislead and risk gets underestimated.

Because right skew is so common, a standard move is to analyse the **logarithm** of the variable. Log revenue is much closer to symmetric, which makes means meaningful and linear models better behaved.

## Outliers

An outlier is an observation far from the rest. The critical question is **why**, and there are three answers with three different responses:

1. **Data error** — a misplaced decimal, a test transaction, a default value like 9999. *Fix or remove, and document it.*
2. **A different population** — one B2B order in a B2C dataset. *Segment it out and analyse separately.*
3. **A genuine rare event** — a real, very large order. *Keep it. It is the business.*

Common detection rules:

- **IQR rule**: outside `Q1 − 1.5×IQR` to `Q3 + 1.5×IQR`. Robust, the basis of box-plot whiskers.
- **Z-score**: |z| > 3. Assumes roughly normal data, and is itself distorted by the outliers it is looking for.
- **Domain rules**: negative revenue, delivery time over 24 hours, age above 120. Usually the most reliable of the three.

> [!WARNING]
> Never delete outliers because they are inconvenient. Removing the top 1% of customers from a revenue analysis can silently remove 30% of the revenue. Segment, do not silently truncate.

## A practical summary routine

For any new numeric column, compute all of this before drawing any conclusion:

| Statistic | Tells you |
| --- | --- |
| count, count distinct | Grain and duplication |
| null count | Coverage |
| min, max | Impossible values |
| mean, median | Centre and skew (compare them) |
| std dev, CV | Volatility |
| p10, p25, p75, p90, p99 | Shape and tails |
| top 5 by frequency | Placeholder values and defaults |

## Key takeaways

- Business data is usually right-skewed; the median describes the typical case better than the mean.
- Always pair a centre with a spread; CV lets you compare volatility across scales.
- Percentiles, not averages, should define service-level targets.
- Compare mean and median as a quick skew test — a large gap means report both.
- Classify outliers as errors, different populations, or real rare events before touching them.

```quiz
[
  {
    "q": "Average order value is ₹5,419 but the median is ₹710. What is the most likely explanation?",
    "options": [
      "A calculation error",
      "The distribution is strongly right-skewed, with a few very large orders",
      "The data is normally distributed",
      "The median was computed on a different sample"
    ],
    "answer": 1,
    "explain": "Mean far above median is the signature of right skew — a long tail of large values pulling the average up."
  },
  {
    "q": "Which metric best compares revenue volatility between a ₹10 lakh store and a ₹10 crore store?",
    "options": ["Standard deviation", "Range", "Coefficient of variation", "Interquartile range"],
    "answer": 2,
    "explain": "CV = std dev / mean is unitless and scale-free, so it compares relative volatility across businesses of very different sizes."
  },
  {
    "q": "Your delivery service has a mean delivery time of 32 minutes and a p95 of 118 minutes. What should the SLA be based on?",
    "options": [
      "The mean, because it uses all the data",
      "A percentile, because the tail is what customers actually experience as failure",
      "The minimum observed time",
      "The mode"
    ],
    "answer": 1,
    "explain": "The mean hides the tail. One in twenty customers waits nearly two hours — a percentile-based SLA makes that visible and accountable."
  }
]
```
