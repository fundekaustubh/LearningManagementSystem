---
title: Window Functions
description: Running totals, month-over-month growth, rankings and moving averages — the SQL feature that separates intermediate analysts from beginners.
order: 4
difficulty: Intermediate
tags: [sql, window-functions, advanced, growth]
---

A window function computes a value across a set of rows **related to the current row, without collapsing them**. That is the entire idea, and it is what makes running totals, growth rates and rankings possible in a single readable query.

Contrast with GROUP BY: aggregation returns one row per group; a window function returns every original row, with the group calculation attached.

## Anatomy

```sql
function() OVER (
    PARTITION BY  column      -- optional: reset the calculation per group
    ORDER BY      column      -- optional: define row order within the partition
    ROWS BETWEEN ... AND ...  -- optional: the frame of rows to include
)
```

```sql
SELECT order_id,
       customer_id,
       order_value,
       sum(order_value) OVER (PARTITION BY customer_id ORDER BY order_date)
           AS running_customer_total,
       avg(order_value) OVER (PARTITION BY customer_id)
           AS customer_avg_order
FROM   orders;
```

Note that the two windows differ only by `ORDER BY` — and that changes one from a *cumulative* sum to a *whole-partition* average. That is the most important detail in the entire topic.

## Ranking functions

```sql
SELECT product_name,
       category,
       revenue,
       row_number() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn,
       rank()       OVER (PARTITION BY category ORDER BY revenue DESC) AS rnk,
       dense_rank() OVER (PARTITION BY category ORDER BY revenue DESC) AS dense_rnk,
       ntile(4)     OVER (PARTITION BY category ORDER BY revenue DESC) AS quartile
FROM   product_revenue;
```

With revenue values 100, 90, 90, 80:

| Function | Result | Behaviour on ties |
| --- | --- | --- |
| `row_number()` | 1, 2, 3, 4 | Arbitrary tie-break; always unique |
| `rank()` | 1, 2, 2, 4 | Ties share a rank, then skip |
| `dense_rank()` | 1, 2, 2, 3 | Ties share a rank, no gap |
| `ntile(4)` | 1, 2, 3, 4 | Splits into equal-sized buckets |

**Top-N per group** is the classic application, and one of the most common SQL interview questions:

```sql
WITH ranked AS (
    SELECT category, product_name, revenue,
           row_number() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn
    FROM   product_revenue
)
SELECT category, product_name, revenue
FROM   ranked
WHERE  rn <= 3
ORDER  BY category, rn;
```

The CTE is required because window functions are computed *after* WHERE in the logical execution order, so you cannot filter on `rn` in the same query block.

## LAG and LEAD: period-over-period growth

```sql
SELECT month,
       revenue,
       lag(revenue)    OVER (ORDER BY month)                AS prev_month,
       revenue - lag(revenue) OVER (ORDER BY month)         AS mom_change,
       round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
                   / nullif(lag(revenue) OVER (ORDER BY month), 0), 1) AS mom_growth_pct,
       lag(revenue, 12) OVER (ORDER BY month)               AS same_month_last_year
FROM   monthly_revenue
ORDER  BY month;
```

`lag(col, n, default)` looks n rows back; `lead()` looks forward. This replaces the awkward self-join on `month = month - 1`, and — importantly — handles missing months correctly only if your data has no gaps. **Generate a complete date scaffold first** if months can be missing, otherwise "previous row" silently means "two months ago".

```sql
-- Date scaffold so gaps do not corrupt period comparisons
WITH months AS (
    SELECT generate_series('2025-01-01'::date, '2026-12-01'::date, '1 month')::date AS month
)
SELECT m.month, coalesce(r.revenue, 0) AS revenue
FROM   months m
LEFT   JOIN monthly_revenue r ON r.month = m.month;
```

> [!TIP]
> Year-over-year comparison via `lag(revenue, 12)` is more robust than month-over-month for seasonal businesses. December always beats November; the useful question is whether this December beats last December.

## Frames: running totals and moving averages

The frame clause defines which rows around the current row are included.

```sql
SELECT order_date,
       daily_revenue,

       -- Cumulative total from the start of the partition
       sum(daily_revenue) OVER (
           ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total,

       -- 7-day moving average (smooths weekday seasonality)
       round(avg(daily_revenue) OVER (
           ORDER BY order_date
           ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ), 0) AS ma_7d,

       -- Centred 7-day average
       round(avg(daily_revenue) OVER (
           ORDER BY order_date
           ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
       ), 0) AS ma_7d_centred
FROM   daily_sales
ORDER  BY order_date;
```

**Default frames are a genuine trap:**

- With `ORDER BY` and no explicit frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — a running total.
- Without `ORDER BY`, the frame is the whole partition — a total.

> [!WARNING]
> The default is `RANGE`, not `ROWS`. They differ when the ORDER BY column has ties: `RANGE` includes **all peer rows with the same value**, so a running total over a date column with several rows per date jumps to include the entire day at once. When you mean "the previous N rows", always write `ROWS` explicitly.

## Cumulative distribution and percentiles

```sql
SELECT customer_id,
       lifetime_value,
       percent_rank() OVER (ORDER BY lifetime_value)                AS pct_rank,
       cume_dist()    OVER (ORDER BY lifetime_value)                AS cumulative_dist,
       ntile(100)     OVER (ORDER BY lifetime_value)                AS percentile,
       sum(lifetime_value) OVER (ORDER BY lifetime_value DESC
                                 ROWS UNBOUNDED PRECEDING)
           / sum(lifetime_value) OVER ()                            AS cum_revenue_share
FROM   customer_ltv;
```

That last column answers "what share of revenue comes from the top N customers?" — the Pareto curve, straight out of SQL. It is a one-query answer to a question that usually gets exported to a spreadsheet.

## A complete worked example

Monthly revenue with growth, cumulative total, moving average and rank — the kind of query that backs an executive dashboard:

```sql
WITH monthly AS (
    SELECT date_trunc('month', order_date) AS month,
           sum(order_value)                AS revenue,
           count(DISTINCT customer_id)     AS customers
    FROM   orders
    WHERE  status = 'completed'
    GROUP  BY 1
)
SELECT month,
       revenue,
       customers,
       round(revenue / nullif(customers, 0), 0)              AS revenue_per_customer,

       lag(revenue) OVER (ORDER BY month)                    AS prev_month_revenue,
       round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
                   / nullif(lag(revenue) OVER (ORDER BY month), 0), 1) AS mom_pct,
       round(100.0 * (revenue - lag(revenue, 12) OVER (ORDER BY month))
                   / nullif(lag(revenue, 12) OVER (ORDER BY month), 0), 1) AS yoy_pct,

       sum(revenue) OVER (ORDER BY month
                          ROWS UNBOUNDED PRECEDING)          AS cumulative_revenue,
       round(avg(revenue) OVER (ORDER BY month
                                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 0) AS ma_3m,

       rank() OVER (ORDER BY revenue DESC)                   AS revenue_rank
FROM   monthly
ORDER  BY month;
```

## Performance notes

- Window functions require sorting. A `PARTITION BY x ORDER BY y` benefits enormously from an index on `(x, y)`.
- Reusing the same window several times? Name it once with a `WINDOW` clause:

```sql
SELECT month, revenue,
       lag(revenue)  OVER w AS prev,
       lead(revenue) OVER w AS next,
       sum(revenue)  OVER w AS running
FROM   monthly
WINDOW w AS (ORDER BY month);
```

- Window functions run after WHERE/GROUP BY/HAVING but before ORDER BY and LIMIT — hence the CTE requirement for filtering on their output.

## Key takeaways

- Window functions add group-level calculations without collapsing rows.
- Adding `ORDER BY` to a window turns a partition-wide aggregate into a cumulative one.
- `row_number`/`rank`/`dense_rank` differ only in tie handling; use a CTE to filter on them.
- `lag`/`lead` give period-over-period growth — build a date scaffold so gaps do not corrupt them.
- Always write `ROWS` explicitly for moving windows; the `RANGE` default includes tied peers.
- Cumulative share of a sorted total gives you the Pareto curve in one query.

```quiz
[
  {
    "q": "What is the difference between `sum(x) OVER (PARTITION BY c)` and `sum(x) OVER (PARTITION BY c ORDER BY d)`?",
    "options": [
      "No difference, ORDER BY only affects display order",
      "The first is a partition-wide total on every row; the second is a running total up to each row",
      "The second is faster",
      "The first requires a GROUP BY"
    ],
    "answer": 1,
    "explain": "Adding ORDER BY introduces a default frame of UNBOUNDED PRECEDING to CURRENT ROW, converting the total into a cumulative sum."
  },
  {
    "q": "You want the top 3 products per category. Why can't you filter with `WHERE row_number() OVER (...) <= 3`?",
    "options": [
      "row_number() is not a valid function",
      "Window functions are evaluated after WHERE, so the alias does not exist yet — wrap it in a CTE",
      "You need HAVING instead",
      "It only works with rank()"
    ],
    "answer": 1,
    "explain": "In logical execution order, WHERE runs before window functions are computed. Compute the row number in a CTE or subquery, then filter on it in the outer query."
  },
  {
    "q": "Why should you write `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` rather than relying on the default frame?",
    "options": [
      "ROWS is faster to type",
      "The default is RANGE, which includes all rows tied on the ORDER BY value rather than a fixed row count",
      "The default frame excludes the current row",
      "ROWS is required by the SQL standard"
    ],
    "answer": 1,
    "explain": "RANGE treats ties as peers and includes all of them, so with duplicate dates the window size varies unexpectedly. ROWS counts physical rows, which is what a moving average needs."
  }
]
```
