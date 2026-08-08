---
title: Aggregation and Grouping
description: GROUP BY, the grain of your result, conditional aggregation, GROUPING SETS and the aggregate NULL behaviour that quietly changes your averages.
order: 3
difficulty: Beginner
tags: [sql, aggregation, group-by]
---

Aggregation collapses many rows into summary rows. The whole skill is controlling **what one output row represents** — the grain — and knowing exactly what each aggregate function does with NULLs and duplicates.

## GROUP BY and grain

Every column in SELECT must either appear in GROUP BY or be inside an aggregate function. This is not an arbitrary rule: the database cannot know which of many `city` values to show for a group defined only by `segment`.

```sql
-- Grain: one row per (month, channel)
SELECT date_trunc('month', order_date)  AS month,
       channel,
       count(*)                          AS orders,
       count(DISTINCT customer_id)       AS customers,
       sum(order_value)                  AS revenue,
       avg(order_value)                  AS avg_order_value
FROM   orders
WHERE  status = 'completed'
GROUP  BY 1, 2
ORDER  BY 1, 2;
```

> [!TIP]
> Write the grain as a comment above every aggregate query. "One row per customer per month" makes a wrong join or a duplicated key immediately obvious to whoever reads it next — including you.

## Aggregate functions and NULLs

**All aggregates except `count(*)` ignore NULLs.** This one rule explains most confusing aggregate results.

| Function | NULL behaviour | Note |
| --- | --- | --- |
| `count(*)` | Counts all rows | The only aggregate that counts NULLs |
| `count(col)` | Ignores NULLs | Use to count non-missing values |
| `count(DISTINCT col)` | Ignores NULLs | Expensive on large tables |
| `sum(col)` | Ignores NULLs | Returns NULL if *all* values are NULL |
| `avg(col)` | Ignores NULLs | **Denominator excludes NULLs** |
| `min` / `max` | Ignore NULLs | Work on text and dates too |

> [!WARNING]
> `avg()` divides by the count of **non-NULL** values, not by the number of rows.
>
> Ten customers, six with a rating and four with none: `avg(rating)` divides by 6. If missing ratings should count as zero, write `avg(coalesce(rating, 0))` — which divides by 10. These give very different answers, and neither is universally correct. Decide deliberately, and say which you used.

The same trap applies to `sum()`: summing a column that is entirely NULL gives NULL, not 0. Wrap it in `coalesce(sum(x), 0)` when a zero is the sensible business answer.

## Conditional aggregation

The most valuable aggregation idiom for analysts: compute several different measures in a single pass over the data.

```sql
SELECT date_trunc('month', order_date)                          AS month,

       count(*)                                                  AS all_orders,
       count(*) FILTER (WHERE channel = 'mobile')                AS mobile_orders,
       count(*) FILTER (WHERE channel = 'web')                   AS web_orders,

       sum(order_value)                                          AS revenue,
       sum(order_value) FILTER (WHERE is_first_order)            AS new_customer_revenue,

       round(100.0 * count(*) FILTER (WHERE status = 'returned')
                   / nullif(count(*), 0), 2)                     AS return_rate_pct
FROM   orders
GROUP  BY 1
ORDER  BY 1;
```

Portable equivalent for engines without `FILTER`:

```sql
sum(CASE WHEN channel = 'mobile' THEN 1 ELSE 0 END)          AS mobile_orders,
sum(CASE WHEN channel = 'mobile' THEN order_value ELSE 0 END) AS mobile_revenue
```

> [!TIP]
> `nullif(x, 0)` in a denominator prevents division-by-zero errors. `x / nullif(y, 0)` returns NULL rather than erroring, and NULL is usually the honest answer for "rate with no denominator".

## Integer division

A classic silent bug in Postgres, SQL Server and other strongly-typed engines:

```sql
SELECT count(*) FILTER (WHERE status = 'returned') / count(*) AS return_rate
FROM   orders;
-- Returns 0. Integer / integer = integer, so 340/10000 truncates to 0.

-- Fix: force floating point
SELECT 1.0 * count(*) FILTER (WHERE status = 'returned') / count(*) AS return_rate
FROM   orders;
```

## Percent of total

Comparing each group to the whole is a constant need. Three approaches, in increasing order of elegance:

```sql
-- 1. Window function (preferred — one pass)
SELECT category,
       sum(revenue)                                        AS revenue,
       round(100.0 * sum(revenue) / sum(sum(revenue)) OVER (), 2) AS pct_of_total
FROM   sales
GROUP  BY category
ORDER  BY revenue DESC;

-- 2. CTE with a cross join to the total
WITH by_category AS (
    SELECT category, sum(revenue) AS revenue FROM sales GROUP BY category
), total AS (
    SELECT sum(revenue) AS grand_total FROM sales
)
SELECT b.category, b.revenue,
       round(100.0 * b.revenue / t.grand_total, 2) AS pct_of_total
FROM   by_category b CROSS JOIN total t;
```

The nested `sum(sum(revenue)) OVER ()` in the first version looks strange but is correct and standard: the inner `sum` aggregates within the group, and the window `sum` totals those group results. See [Window Functions](../window-functions/).

## GROUPING SETS, ROLLUP and CUBE

Produce subtotals at multiple levels in one query instead of UNIONing several.

```sql
-- Revenue by region, by region+category, and grand total — one pass
SELECT coalesce(region, 'ALL REGIONS')     AS region,
       coalesce(category, 'ALL CATEGORIES') AS category,
       sum(revenue)                         AS revenue
FROM   sales
GROUP  BY GROUPING SETS ((region, category), (region), ())
ORDER  BY region, category;
```

- `ROLLUP(a, b)` → (a,b), (a), () — hierarchical subtotals.
- `CUBE(a, b)` → (a,b), (a), (b), () — every combination.
- `GROUPING SETS` → exactly the combinations you list.

Use `grouping(col)` to distinguish a subtotal row's NULL from a genuine NULL in the data.

## DISTINCT vs GROUP BY

```sql
SELECT DISTINCT city FROM customers;         -- these two are
SELECT city FROM customers GROUP BY city;    -- equivalent
```

Use `DISTINCT` for simple deduplication, `GROUP BY` when you are also aggregating. Both are expensive on large tables because they require sorting or hashing.

`count(DISTINCT x)` is particularly costly at scale. Warehouses offer approximate alternatives — `approx_count_distinct` (BigQuery/Spark), `HLL` functions (Postgres extensions) — which trade ~1% error for an enormous speed-up. For dashboard-level user counts that is almost always a good trade.

## Aggregating at multiple grains

A frequent requirement: per-customer statistics summarised by segment. Do it in two stages, never in one.

```sql
-- Stage 1: one row per customer
WITH customer_stats AS (
    SELECT o.customer_id,
           count(*)                             AS order_count,
           sum(o.order_value)                   AS total_spend,
           min(o.order_date)                    AS first_order,
           max(o.order_date)                    AS last_order
    FROM   orders o
    WHERE  o.status = 'completed'
    GROUP  BY o.customer_id
)
-- Stage 2: one row per segment
SELECT c.segment,
       count(*)                                  AS customers,
       round(avg(s.order_count), 2)              AS avg_orders_per_customer,
       round(avg(s.total_spend), 0)              AS avg_spend,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY s.total_spend) AS median_spend
FROM   customer_stats s
JOIN   customers c ON c.customer_id = s.customer_id
GROUP  BY c.segment
ORDER  BY avg_spend DESC;
```

> [!WARNING]
> Averaging in one step gives the wrong answer. `avg(order_value)` over all orders is the average *order* value; `avg(total_spend)` over customers is the average *customer* value. Customers with many orders dominate the first and are weighted equally in the second. Know which one the question asked for.

This is the single most common analytical error in aggregation work, and it never produces an error message.

## Key takeaways

- State the grain of every aggregate query; most bugs are grain bugs.
- All aggregates except `count(*)` skip NULLs — including `avg()`'s denominator.
- Conditional aggregation with `FILTER`/`CASE` computes many measures in one pass.
- Guard denominators with `nullif(x, 0)` and force float division with `1.0 *`.
- Use GROUPING SETS/ROLLUP for subtotals rather than UNIONing queries.
- Aggregate per-entity first, then across entities — averaging in one step weights by activity.

```quiz
[
  {
    "q": "A table has 10 customers; 6 have a satisfaction rating and 4 are NULL. What does avg(rating) divide by?",
    "options": ["10", "6", "4", "It returns NULL"],
    "answer": 1,
    "explain": "avg() ignores NULLs entirely, including in its denominator. Use avg(coalesce(rating, 0)) if missing ratings should count as zero."
  },
  {
    "q": "You need 'average revenue per customer' by segment. What is the correct approach?",
    "options": [
      "avg(order_value) grouped by segment",
      "Aggregate to one row per customer first, then average those totals by segment",
      "sum(order_value) / count(*) grouped by segment",
      "avg(DISTINCT order_value) grouped by segment"
    ],
    "answer": 1,
    "explain": "Averaging order rows gives average order value, weighted toward frequent buyers. Average revenue per customer requires aggregating per customer first, then averaging across customers."
  },
  {
    "q": "In PostgreSQL, `count(*) FILTER (WHERE status = 'returned') / count(*)` returns 0. Why?",
    "options": [
      "The FILTER clause is invalid",
      "Integer division truncates the fractional result to 0",
      "There are no returned orders",
      "count(*) cannot be used in division"
    ],
    "answer": 1,
    "explain": "Both operands are integers, so the result is integer-divided and truncated. Multiply by 1.0 to force floating-point division."
  }
]
```
