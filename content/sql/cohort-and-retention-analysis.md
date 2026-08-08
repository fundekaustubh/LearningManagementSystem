---
title: Cohort and Retention Analysis in SQL
description: Building a cohort retention table from raw events, reading the triangle correctly, and the difference between classic, rolling and unbounded retention.
order: 5
difficulty: Intermediate
tags: [sql, retention, cohort, growth]
---

Aggregate retention hides everything interesting. "Monthly retention is 78%" mixes users who joined three years ago with users who joined last week — two completely different populations. **Cohort analysis** fixes this by grouping users by when they started and tracking each group separately over time.

It is the single most informative analysis in a subscription or marketplace business, because it separates *"is the product improving?"* from *"are we acquiring more people?"*

## The shape of a cohort table

| Cohort | Size | M0 | M1 | M2 | M3 | M4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-01 | 1,240 | 100% | 42% | 34% | 30% | 29% |
| 2026-02 | 1,580 | 100% | 45% | 36% | 32% | |
| 2026-03 | 1,910 | 100% | 51% | 41% | | |
| 2026-04 | 2,240 | 100% | 53% | | | |

Read it three ways, and each answers a different question:

- **Across a row** — how one cohort decays. Note the curve flattening after M2: that plateau is your durable base.
- **Down a column** — whether newer cohorts behave better at the same age. M1 rising from 42% → 53% means onboarding improvements are working. **This is the column that tells you whether the product is getting better.**
- **The diagonal** — everyone in the same calendar month. Useful for spotting a site-wide incident that hit all cohorts at once.

## Building it in SQL

Three steps: assign each user to a cohort, compute their activity periods, then pivot.

```sql
WITH cohorts AS (
    -- Step 1: each user's cohort = the month of their first order
    SELECT customer_id,
           date_trunc('month', min(order_date)) AS cohort_month
    FROM   orders
    WHERE  status = 'completed'
    GROUP  BY customer_id
),
activity AS (
    -- Step 2: distinct months in which each user was active
    SELECT DISTINCT
           o.customer_id,
           c.cohort_month,
           date_trunc('month', o.order_date) AS activity_month
    FROM   orders o
    JOIN   cohorts c ON c.customer_id = o.customer_id
    WHERE  o.status = 'completed'
),
periods AS (
    -- Step 3: months elapsed since the cohort started
    SELECT cohort_month,
           customer_id,
           (extract(year FROM activity_month) - extract(year FROM cohort_month)) * 12
             + (extract(month FROM activity_month) - extract(month FROM cohort_month))
             AS period_number
    FROM   activity
),
sizes AS (
    SELECT cohort_month, count(*) AS cohort_size
    FROM   cohorts
    GROUP  BY cohort_month
)
SELECT p.cohort_month,
       s.cohort_size,
       p.period_number,
       count(DISTINCT p.customer_id)                                   AS active_users,
       round(100.0 * count(DISTINCT p.customer_id) / s.cohort_size, 1) AS retention_pct
FROM   periods p
JOIN   sizes s ON s.cohort_month = p.cohort_month
GROUP  BY p.cohort_month, s.cohort_size, p.period_number
ORDER  BY p.cohort_month, p.period_number;
```

> [!WARNING]
> Computing `period_number` as a difference in *days divided by 30* produces off-by-one errors that scramble the whole table. Compute it in whole months from the year and month components, as above.

## Pivoting into the triangle

The long format above is correct and easiest to chart. For a table people can read, pivot with conditional aggregation:

```sql
SELECT cohort_month,
       max(cohort_size)                                            AS size,
       max(retention_pct) FILTER (WHERE period_number = 0)         AS m0,
       max(retention_pct) FILTER (WHERE period_number = 1)         AS m1,
       max(retention_pct) FILTER (WHERE period_number = 2)         AS m2,
       max(retention_pct) FILTER (WHERE period_number = 3)         AS m3,
       max(retention_pct) FILTER (WHERE period_number = 6)         AS m6,
       max(retention_pct) FILTER (WHERE period_number = 12)        AS m12
FROM   cohort_retention
GROUP  BY cohort_month
ORDER  BY cohort_month;
```

> [!WARNING]
> **The incomplete-cohort trap.** The April cohort cannot have an M3 number if only one month has passed. If your query returns 0% instead of NULL for those cells, every chart and average built on it is wrong — and the error always makes recent cohorts look terrible.
>
> Filter explicitly: only include cohort-period combinations where `cohort_month + period_number months <= current_month`.

## Three definitions of retention

They give very different numbers, and the mismatch is a frequent source of arguments between teams.

**Classic (bounded).** Active specifically in period N. Strictest. Suits products with an expected regular cadence, like a weekly grocery order.

**Rolling (unbounded).** Active in period N *or any period after*. Higher numbers, and more forgiving of irregular usage. Suits products used sporadically — travel booking, tax software.

```sql
-- Rolling retention: active in period N or later
SELECT c.cohort_month, p.period_number,
       count(DISTINCT CASE WHEN a.max_period >= p.period_number
                           THEN a.customer_id END) AS retained
FROM   ...
```

**Range retention.** Active at any point within a window (e.g. days 7–13). The standard for products used a few times a week, and less noisy than single-day retention.

Pick one, define it in writing, and use it consistently. Comparing your rolling retention to a competitor's classic retention is meaningless.

## Revenue retention

For subscription businesses, revenue retention matters more than user retention, because expansion from existing customers can outweigh churn.

- **Gross revenue retention (GRR)** — revenue from a cohort this period ÷ its original revenue, **capped at 100%**. Measures leakage only.
- **Net revenue retention (NRR)** — the same but allowing upgrades to push above 100%.

NRR above 100% means the company grows from its existing base even with zero new customers. It is the metric SaaS investors care about most.

```sql
WITH cohort_revenue AS (
    SELECT c.cohort_month,
           date_trunc('month', s.billing_month) AS revenue_month,
           sum(s.mrr)                           AS mrr
    FROM   subscriptions s
    JOIN   cohorts c ON c.customer_id = s.customer_id
    GROUP  BY 1, 2
),
base AS (
    SELECT cohort_month, mrr AS initial_mrr
    FROM   cohort_revenue
    WHERE  revenue_month = cohort_month
)
SELECT r.cohort_month,
       r.revenue_month,
       round(100.0 * r.mrr / b.initial_mrr, 1) AS net_revenue_retention_pct
FROM   cohort_revenue r
JOIN   base b ON b.cohort_month = r.cohort_month
ORDER  BY 1, 2;
```

## Reading a retention curve

A healthy curve **flattens**. The plateau level is what matters — a product that stabilises at 30% has a durable base of a third of every cohort; one that keeps declining toward zero has no product-market fit no matter how good the M1 number is.

| Pattern | Interpretation |
| --- | --- |
| Steep drop then flat plateau | Normal. Plateau height = durable base |
| Continuous decline toward zero | No retained base; growth requires ever more acquisition |
| Smile curve (dips then rises) | Users return after a natural gap — check the cadence assumption |
| Newer cohorts strictly above older | Product improvements are working |
| Newer cohorts below older | Acquisition quality is degrading — check channel mix |

> [!TIP]
> That last row is the most common real finding. When a paid acquisition channel scales up, later cohorts often retain worse simply because the channel reaches less-qualified users. Always cut cohort retention **by acquisition channel** before concluding the product got worse.

## Common mistakes

1. **Zero instead of NULL for incomplete periods** — makes recent cohorts look catastrophic.
2. **Mixing cohort definitions** — first order vs signup vs first payment give different tables.
3. **Ignoring cohort size** — a 90% retention on a 12-user cohort is noise.
4. **Only reporting the average across cohorts** — that is exactly the aggregation cohort analysis exists to avoid.
5. **Wrong period granularity** — daily for a monthly product, monthly for a daily product. Match the natural usage cadence.
6. **Not segmenting** — the aggregate curve is a mix of very different behaviours by channel, plan and geography.

## Key takeaways

- Cohorts separate product quality from acquisition volume; aggregate retention conflates them.
- Read rows for decay, columns for improvement, diagonals for incidents.
- Compute period numbers in whole months, and leave incomplete cells NULL.
- Classic, rolling and range retention are different metrics — define which you use.
- NRR above 100% means growth without new customers; GRR is capped and measures leakage.
- A flattening curve is healthy; the plateau height is the number that matters.

```quiz
[
  {
    "q": "Your cohort table shows the April cohort at 0% for month 3, but April was only two months ago. What is wrong?",
    "options": [
      "The April cohort churned completely",
      "Incomplete periods are being reported as 0% instead of NULL",
      "The cohort definition is wrong",
      "The retention formula has a division error"
    ],
    "answer": 1,
    "explain": "That period has not happened yet. Reporting 0% instead of NULL makes recent cohorts appear to collapse and corrupts any average computed over the column."
  },
  {
    "q": "Reading down the M1 column, retention rises from 42% to 53% across successive cohorts. What does this indicate?",
    "options": [
      "Older cohorts are churning faster",
      "Newer cohorts retain better at the same age — likely onboarding or product improvements",
      "The cohort sizes are increasing",
      "Seasonality"
    ],
    "answer": 1,
    "explain": "Comparing the same age across cohorts controls for cohort maturity, so an improving column indicates genuine product or onboarding improvement."
  },
  {
    "q": "Net revenue retention is 112%. What does that mean?",
    "options": [
      "12% of customers churned",
      "The existing customer base generates more revenue than it did originally, so the company grows without new customers",
      "Revenue was miscalculated — NRR cannot exceed 100%",
      "Gross retention is also 112%"
    ],
    "answer": 1,
    "explain": "NRR includes expansion revenue and is uncapped. Above 100% means upgrades from existing customers more than offset churn and downgrades."
  }
]
```
