---
title: Data Cleaning and Validation
description: Profiling a new table, handling duplicates and missing values, standardising messy text, and the validation checks that catch problems before your stakeholders do.
order: 6
difficulty: Intermediate
tags: [sql, data-quality, cleaning, validation]
---

The number one reason an analysis gets rejected in a meeting is that someone spots a figure they know is wrong. Cleaning and validating data is not preparatory drudgery — it is what makes the conclusion survive contact with the people who know the business.

## Profile before you analyse

Run this on any table you have not personally verified before:

```sql
SELECT count(*)                                              AS total_rows,
       count(DISTINCT customer_id)                           AS distinct_customers,
       count(*) - count(customer_id)                         AS null_customer_ids,
       count(*) - count(order_value)                         AS null_order_values,
       min(order_date)                                       AS earliest,
       max(order_date)                                       AS latest,
       min(order_value)                                      AS min_value,
       max(order_value)                                      AS max_value,
       round(avg(order_value), 2)                            AS mean_value,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY order_value) AS median_value,
       count(*) FILTER (WHERE order_value < 0)               AS negative_values,
       count(*) FILTER (WHERE order_date > current_date)     AS future_dates
FROM   orders;
```

Four things to look for immediately:

- `total_rows` vs `distinct_customer_ids` — tells you the grain.
- A large gap between mean and median — skew, so plan to use medians.
- Impossible values — negatives, future dates, zero-value completed orders.
- Null counts — and then, importantly, *why* those rows are null.

Also check volume over time. A pipeline that silently stopped ingesting one source shows up as a step change nowhere else:

```sql
SELECT date_trunc('day', created_at) AS day, count(*) AS rows
FROM   events
WHERE  created_at >= current_date - interval '60 days'
GROUP  BY 1 ORDER BY 1;
```

## Duplicates

Distinguish **exact duplicates** (identical rows, usually a pipeline re-run) from **business duplicates** (the same real-world entity recorded twice with different details).

```sql
-- Find them first: never delete before you have looked
SELECT customer_id, order_date, order_value, count(*) AS copies
FROM   orders
GROUP  BY 1, 2, 3
HAVING count(*) > 1
ORDER  BY copies DESC;

-- Keep the most recent record per business key
WITH ranked AS (
    SELECT *,
           row_number() OVER (PARTITION BY customer_id, order_date, order_value
                              ORDER BY ingested_at DESC) AS rn
    FROM   orders
)
SELECT * FROM ranked WHERE rn = 1;
```

`row_number()` with a well-chosen PARTITION BY and ORDER BY is the standard deduplication pattern, and it is far safer than `DISTINCT` because you control which copy survives.

Business duplicates are harder — the same customer as "Rajesh Kumar / rajesh@co.in" and "R. Kumar / rajesh@co.in". Fuzzy matching on normalised email or phone is the usual first pass:

```sql
SELECT lower(trim(email))            AS normalised_email,
       count(*)                      AS records,
       string_agg(DISTINCT name, ' | ') AS name_variants
FROM   customers
WHERE  email IS NOT NULL
GROUP  BY 1
HAVING count(*) > 1;
```

## Missing values

**Diagnose the mechanism before choosing a treatment.** The three cases behave very differently:

- **MCAR** (missing completely at random) — unrelated to anything. Dropping rows is safe but wasteful.
- **MAR** (missing at random) — relates to *observed* variables. Income missing more often for younger users. Imputation conditioned on those variables works.
- **MNAR** (missing not at random) — relates to the *unobserved value itself*. High earners decline to state income. **Any imputation biases the result**, and the missingness is itself informative.

MNAR is common in business data and routinely ignored.

| Strategy | When appropriate | Risk |
| --- | --- | --- |
| Drop rows | Few missing, MCAR | Bias if not MCAR; sample shrinks |
| Fill with 0 | Missing genuinely means none | Wrong when it means unknown |
| Mean/median fill | MAR, small share missing | Understates variance |
| Forward fill | Time series with carry-forward meaning | Hides gaps in collection |
| Model-based | MAR, missingness matters | Complexity, leakage risk |
| **Flag and keep** | Almost always worth doing | None |

```sql
-- Preserve the missingness as a signal, then treat the value
SELECT order_id,
       coalesce(discount_code, '(none)')      AS discount_code,
       discount_code IS NULL                  AS had_no_discount_code,
       coalesce(delivery_rating, 0)           AS delivery_rating,
       delivery_rating IS NULL                AS rating_missing
FROM   orders;
```

> [!TIP]
> A missing-value indicator is frequently one of the most predictive features in a model. "Did not provide a phone number" often predicts churn better than most fields that *were* provided. Never throw the information away by silently imputing.

## Standardising text

```sql
SELECT trim(city)                                       AS trimmed,
       lower(trim(city))                                AS normalised,
       initcap(lower(trim(city)))                       AS title_case,
       regexp_replace(phone, '[^0-9]', '', 'g')         AS digits_only,
       regexp_replace(trim(name), '\s+', ' ', 'g')      AS single_spaced
FROM   customers;
```

For categories that vary in spelling, a mapping table beats a chain of CASE statements — it can be maintained by the business team without changing SQL:

```sql
CREATE TABLE city_mapping (raw_value text PRIMARY KEY, clean_value text);
-- 'bangalore', 'Bengaluru', 'BLR', 'bangalore ' → 'Bengaluru'

SELECT coalesce(m.clean_value, initcap(lower(trim(c.city)))) AS city
FROM   customers c
LEFT   JOIN city_mapping m ON m.raw_value = lower(trim(c.city));
```

## Outliers and impossible values

Distinguish **impossible** (violates a rule of reality) from **implausible** (statistically extreme but real).

```sql
-- Impossible values: fix or exclude, and document
SELECT count(*) FILTER (WHERE order_value < 0)                   AS negative_orders,
       count(*) FILTER (WHERE order_date > current_date)         AS future_orders,
       count(*) FILTER (WHERE order_date < '2015-01-01')         AS pre_launch_orders,
       count(*) FILTER (WHERE quantity > 10000)                  AS absurd_quantity,
       count(*) FILTER (WHERE delivery_date < order_date)        AS delivered_before_ordered
FROM   orders;

-- Statistical outliers: investigate, do not auto-delete
WITH bounds AS (
    SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY order_value) AS q1,
           percentile_cont(0.75) WITHIN GROUP (ORDER BY order_value) AS q3
    FROM   orders
)
SELECT o.*
FROM   orders o, bounds b
WHERE  o.order_value > b.q3 + 1.5 * (b.q3 - b.q1)
    OR o.order_value < b.q1 - 1.5 * (b.q3 - b.q1);
```

Impossible values are bugs. Statistical outliers are usually the most valuable customers. Treating them the same way is how analyses quietly lose 30% of revenue.

## Referential integrity

Warehouses rarely enforce foreign keys, so orphaned records accumulate silently.

```sql
-- Orders whose customer no longer exists
SELECT count(*) AS orphaned_orders
FROM   orders o
WHERE  NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id);
```

Orphans usually mean a deletion cascade that did not cascade, or two systems syncing at different times. Either way, an INNER JOIN will silently drop that revenue from your totals.

## A reusable validation query

Run this as a single readable report before publishing any analysis:

```sql
WITH checks AS (
    SELECT 'Row count'         AS check_name,
           count(*)::text      AS value,
           count(*) > 0        AS passed          FROM orders
    UNION ALL
    SELECT 'No null customer_id', count(*)::text,
           count(*) = 0        FROM orders WHERE customer_id IS NULL
    UNION ALL
    SELECT 'No negative values', count(*)::text,
           count(*) = 0        FROM orders WHERE order_value < 0
    UNION ALL
    SELECT 'No future dates', count(*)::text,
           count(*) = 0        FROM orders WHERE order_date > current_date
    UNION ALL
    SELECT 'No duplicate order_ids',
           (count(*) - count(DISTINCT order_id))::text,
           count(*) = count(DISTINCT order_id) FROM orders
    UNION ALL
    SELECT 'Fresh data (< 2 days old)', max(order_date)::text,
           max(order_date) >= current_date - 2 FROM orders
)
SELECT check_name, value, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status
FROM   checks
ORDER  BY passed, check_name;
```

Scheduling this and alerting on failures is the cheapest data quality system that actually works. It catches the majority of real incidents — stopped pipelines, duplicated loads, schema changes — at a fraction of the cost of a data observability platform.

## Documenting your cleaning

Every cleaning decision must be reproducible and explainable, because someone will eventually ask why your number differs from theirs:

```sql
/* Cleaning applied to orders, 2026-08-01
   1. Excluded status = 'test' (412 rows, internal QA orders)
   2. Excluded order_value <= 0 (89 rows, refund adjustments booked as orders)
   3. Deduplicated on (customer_id, order_date, order_value), keeping the
      latest ingested_at (231 duplicate rows from the 2026-06-14 backfill)
   4. Normalised city via city_mapping (37 spelling variants → 12 cities)
   Net effect: 1,204,882 raw rows → 1,204,150 analysis rows (-0.06%)
*/
```

> [!TIP]
> Always report the net effect of cleaning as a percentage of rows and of revenue. If cleaning removed 0.06% of rows but 12% of revenue, you have deleted your biggest customers — and you need to know that before publishing, not after.

## Key takeaways

- Profile every unfamiliar table: grain, nulls, ranges, impossible values, volume over time.
- Deduplicate with `row_number()` so you control which copy survives.
- Diagnose *why* data is missing; MNAR cannot be safely imputed.
- Keep a missingness flag — it is often genuinely predictive.
- Separate impossible values (fix) from statistical outliers (investigate, usually keep).
- Automate a small validation query and alert on it; document cleaning and its effect on revenue.

```quiz
[
  {
    "q": "High earners systematically decline to state their income. What kind of missingness is this?",
    "options": [
      "MCAR — missing completely at random",
      "MAR — missing at random, explainable by observed variables",
      "MNAR — missing not at random, dependent on the unobserved value itself",
      "It is not missing data"
    ],
    "answer": 2,
    "explain": "The probability of missingness depends on the value that is missing. Any imputation will be biased downward, and the missingness itself carries information."
  },
  {
    "q": "Which is the safest way to remove duplicate order records?",
    "options": [
      "SELECT DISTINCT * FROM orders",
      "row_number() over a business key, ordered by ingestion time, keeping rn = 1",
      "DELETE every row that appears more than once",
      "GROUP BY every column"
    ],
    "answer": 1,
    "explain": "row_number() lets you define both the business key and which copy to keep, unlike DISTINCT which cannot resolve rows that differ in one irrelevant column."
  },
  {
    "q": "Your cleaning removed 0.06% of rows but 12% of total revenue. What should you do?",
    "options": [
      "Nothing — the row count impact is tiny",
      "Investigate immediately; you have likely excluded the largest customers",
      "Remove more rows to balance it out",
      "Report the row percentage only"
    ],
    "answer": 1,
    "explain": "A revenue impact vastly larger than the row impact means the excluded rows are large-value orders. Always report cleaning impact in both rows and revenue."
  }
]
```
