---
title: RFM Analysis
description: Segmenting customers by recency, frequency and monetary value — a technique you can implement in one SQL query that outperforms most clustering projects.
order: 3
difficulty: Beginner
tags: [segmentation, rfm, retail, applied, sql]
---

RFM scores every customer on three behavioural dimensions:

- **Recency** — how long since their last purchase. The strongest single predictor of future purchase.
- **Frequency** — how many times they have purchased.
- **Monetary** — how much they have spent.

It is decades old, requires only transaction data, runs in one SQL query, and routinely outperforms elaborate clustering projects because the dimensions are chosen for their known relationship to future behaviour rather than discovered from noise.

## Why these three

Recency dominates. A customer who bought last week is far more likely to buy again than one who bought a year ago, regardless of how much they once spent. Direct marketers established this empirically long before it had a statistical justification.

Frequency captures habit. Monetary captures value. Together they separate a customer who bought once for ₹50,000 from one who buys ₹5,000 every month — very different relationships, identical annual revenue.

## Building RFM in SQL

```sql
WITH customer_rfm AS (
    SELECT customer_id,
           current_date - max(order_date)::date AS recency_days,
           count(*)                             AS frequency,
           sum(order_value)                     AS monetary
    FROM   orders
    WHERE  status = 'completed'
      AND  order_date >= current_date - interval '2 years'
    GROUP  BY customer_id
),
scored AS (
    SELECT *,
           -- Recency: fewer days is better, so reverse the ordering
           ntile(5) OVER (ORDER BY recency_days DESC) AS r_score,
           ntile(5) OVER (ORDER BY frequency ASC)     AS f_score,
           ntile(5) OVER (ORDER BY monetary ASC)      AS m_score
    FROM   customer_rfm
)
SELECT customer_id,
       recency_days, frequency, monetary,
       r_score, f_score, m_score,
       r_score::text || f_score::text || m_score::text AS rfm_cell,
       CASE
         WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
         WHEN r_score >= 3 AND f_score >= 4                  THEN 'Loyal customers'
         WHEN r_score >= 4 AND f_score <= 2                  THEN 'New customers'
         WHEN r_score >= 3 AND f_score <= 2 AND m_score >= 3  THEN 'Promising'
         WHEN r_score = 3  AND f_score = 3                    THEN 'Need attention'
         WHEN r_score <= 2 AND f_score >= 4 AND m_score >= 4  THEN 'At risk — high value'
         WHEN r_score <= 2 AND f_score >= 3                   THEN 'At risk'
         WHEN r_score <= 2 AND f_score <= 2 AND m_score >= 4  THEN 'Cannot lose them'
         WHEN r_score = 1  AND f_score <= 2                   THEN 'Lost'
         ELSE 'Hibernating'
       END AS segment
FROM   scored;
```

`ntile(5)` splits customers into five equal-sized groups per dimension. The `DESC` on recency is essential — fewer days since purchase should score higher, and getting this backwards inverts the entire analysis while still producing plausible-looking output.

## The standard segments

| Segment | R | F | M | Meaning | Action |
| --- | :---: | :---: | :---: | --- | --- |
| Champions | 5 | 5 | 5 | Recent, frequent, high spend | Reward; recruit as advocates |
| Loyal | 3–5 | 4–5 | 3–5 | Regular buyers | Upsell; loyalty programme |
| Potential loyalist | 4–5 | 2–3 | 2–3 | Recent, building habit | Encourage the next purchase |
| New customers | 4–5 | 1 | 1–2 | Just bought first time | Onboarding; second-purchase push |
| Promising | 3–4 | 1–2 | 1–2 | Recent, low frequency | Build engagement |
| Need attention | 3 | 3 | 3 | Middling on everything | Time-limited offer |
| At risk | 1–2 | 3–5 | 3–5 | Were good, gone quiet | Reactivation; personal outreach |
| Cannot lose them | 1–2 | 1–2 | 4–5 | High spend, long absent | Priority win-back |
| Hibernating | 1–2 | 1–2 | 1–2 | Low on everything | Low-cost automated campaigns |
| Lost | 1 | 1 | 1 | Gone | Minimal spend, or exclude |

> [!TIP]
> **"At risk — high value" and "Cannot lose them" are where the money is.** These customers have already proven they will spend; the only obstacle is their absence. Reactivation campaigns targeting these two cells consistently return more than broad-based promotions, and they are trivially identifiable from the query above.

## Reading the RFM matrix

Cross-tabulate R against F, with cell sizes and revenue:

```sql
SELECT r_score,
       f_score,
       count(*)                          AS customers,
       round(sum(monetary))              AS revenue,
       round(avg(monetary))              AS avg_value
FROM   scored
GROUP  BY r_score, f_score
ORDER  BY r_score DESC, f_score DESC;
```

Displayed as a heatmap, the shape tells you a great deal:

- **Mass in the top-right (high R, high F)** — a healthy repeat business.
- **Mass in the bottom-right (low R, high F)** — you had loyal customers and lost them. Something changed; find out what.
- **Mass in the top-left (high R, low F)** — plenty of acquisition, no repeat habit. An onboarding and second-purchase problem.
- **Mass along the bottom** — a mostly-lapsed base propped up by new acquisition.

## Adapting RFM to your business

The quintile cut-points must reflect your purchase cadence. For a grocery business, 30 days without a purchase is alarming; for furniture, it is meaningless.

**Set recency bands from the observed inter-purchase interval:**

```sql
-- Median days between consecutive purchases — the natural cadence
WITH gaps AS (
    SELECT customer_id,
           order_date - lag(order_date) OVER (PARTITION BY customer_id
                                              ORDER BY order_date) AS gap_days
    FROM   orders
    WHERE  status = 'completed'
)
SELECT percentile_cont(0.5)  WITHIN GROUP (ORDER BY gap_days) AS median_gap,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY gap_days) AS p75_gap,
       percentile_cont(0.9)  WITHIN GROUP (ORDER BY gap_days) AS p90_gap
FROM   gaps
WHERE  gap_days IS NOT NULL;
```

A customer beyond the 90th percentile of the typical gap is genuinely lapsing, not just quiet.

**Other adaptations worth making:**

- **Use margin instead of revenue** for the M dimension if product margins vary widely.
- **Add a fourth dimension** where relevant: tenure, product-category breadth, or channel.
- **Score within cohorts** so a customer who joined last month is not scored against three-year veterans on frequency.

## Limitations

1. **Backward-looking.** RFM describes past behaviour. A customer about to churn for reasons invisible in transactions still looks like a champion.
2. **No causal content.** It tells you who to contact, not what will work.
3. **Ignores everything non-transactional** — support tickets, engagement, NPS.
4. **Quintiles are relative.** If the whole base lapses, you still have a "top" quintile. Absolute thresholds catch this; relative scores do not.
5. **Ignores product mix.** Two customers with identical RFM may buy entirely different categories with different margins and repurchase cycles.

RFM is a strong baseline, not a ceiling. Once it is running, the natural next step is a churn model ([Logistic Regression](../../predictive/logistic-regression-and-classification/)) and predictive [CLV](../customer-lifetime-value/) — but many companies capture most of the available value from RFM alone.

## Measuring whether it worked

Do not skip this. Run reactivation on a random half of the "At risk" segment and hold out the other half. Compare 90-day revenue between the two.

Without a holdout you will measure that "70% of contacted at-risk customers purchased again" — many of whom would have returned anyway. The holdout is what turns an activity report into a measured result.

## Key takeaways

- Recency, frequency and monetary value predict future purchasing better than most learned models.
- One SQL query with `ntile(5)` produces the full segmentation.
- Reverse the ordering for recency — lower days must score higher.
- "At risk — high value" and "Cannot lose them" carry the highest expected return.
- Calibrate recency bands to your observed inter-purchase interval.
- Always hold out a control group when measuring campaign lift.

```quiz
[
  {
    "q": "Which RFM dimension is generally the strongest single predictor of a future purchase?",
    "options": ["Monetary value", "Frequency", "Recency", "All three equally"],
    "answer": 2,
    "explain": "Recency dominates empirically. A customer who bought recently is far more likely to buy again than one who spent heavily long ago."
  },
  {
    "q": "In the RFM query, why is recency scored with `ntile(5) OVER (ORDER BY recency_days DESC)`?",
    "options": [
      "To sort the output for readability",
      "Because fewer days since purchase is better, so the ordering must be reversed for high scores to mean recent",
      "DESC is required by ntile",
      "To handle NULL values"
    ],
    "answer": 1,
    "explain": "Recency is measured in days, where smaller is better. Without DESC, the least recent customers would receive the highest score, inverting the whole segmentation."
  },
  {
    "q": "Which RFM segment typically offers the highest return on a reactivation campaign?",
    "options": [
      "Lost (R=1, F=1, M=1)",
      "New customers (R=5, F=1, M=1)",
      "At risk — high value (R=1-2, F=4-5, M=4-5)",
      "Hibernating (R=2, F=2, M=2)"
    ],
    "answer": 2,
    "explain": "These customers have already demonstrated high frequency and spend; the only barrier is recent absence, which makes them far more responsive than low-value or never-loyal segments."
  }
]
```
