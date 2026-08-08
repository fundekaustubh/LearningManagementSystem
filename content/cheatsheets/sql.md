---
title: SQL
description: Query patterns analysts reach for weekly, plus the traps worth memorising.
order: 2
---

## Logical execution order

```text
FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

Consequences: no SELECT aliases in WHERE (but yes in ORDER BY); WHERE filters rows, HAVING filters groups; window functions run after HAVING, so filter on them in an outer query.

## NULL traps

```sql
channel <> 'email'                  -- excludes NULL rows silently
channel IS DISTINCT FROM 'email'    -- includes them (Postgres)
coalesce(channel, '') <> 'email'    -- portable equivalent

NOT IN (SELECT x FROM t)            -- returns ZERO rows if any x is NULL
NOT EXISTS (SELECT 1 FROM t ...)    -- always safe; use this
```

All aggregates except `count(*)` ignore NULLs — including `avg()`'s denominator.

## Conditional aggregation

```sql
count(*) FILTER (WHERE channel = 'mobile')                     -- Postgres/DuckDB
sum(CASE WHEN channel = 'mobile' THEN 1 ELSE 0 END)            -- portable
1.0 * count(*) FILTER (WHERE returned) / nullif(count(*), 0)   -- safe rate
```

## Window functions

```sql
row_number() OVER (PARTITION BY g ORDER BY x DESC)   -- unique, arbitrary ties
rank()       OVER (...)                              -- ties share, then skip
dense_rank() OVER (...)                              -- ties share, no gap
ntile(5)     OVER (...)                              -- equal-sized buckets

lag(x)      OVER (ORDER BY d)                        -- previous row
lag(x, 12)  OVER (ORDER BY d)                        -- same month last year
lead(x)     OVER (ORDER BY d)                        -- next row

sum(x) OVER (ORDER BY d ROWS UNBOUNDED PRECEDING)              -- running total
avg(x) OVER (ORDER BY d ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) -- 7-period MA
sum(x) OVER ()                                                 -- grand total
100.0 * sum(x) / sum(sum(x)) OVER ()                           -- percent of total
```

**Always write `ROWS`** for moving windows — the `RANGE` default includes tied peers.

## Top N per group

```sql
WITH ranked AS (
    SELECT *, row_number() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn
    FROM   products
)
SELECT * FROM ranked WHERE rn <= 3;
```

## Anti-join

```sql
SELECT c.* FROM customers c
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

## Fan-out check

```sql
SELECT (SELECT count(*) FROM orders) AS before,
       (SELECT count(*) FROM orders o JOIN items i ON i.order_id = o.order_id) AS after;
```

If they differ unexpectedly, aggregate the many-side first, then join.

## LEFT JOIN rules

- Right-table conditions go in `ON`; putting them in `WHERE` makes it an INNER JOIN.
- Use `count(o.id)` not `count(*)` — the latter counts non-matching rows as 1.

## Dates (PostgreSQL)

```sql
date_trunc('month', d)                       -- first of month
d >= current_date - interval '30 days'       -- rolling window
extract(dow FROM d)                          -- 0 = Sunday
generate_series('2026-01-01'::date, '2026-12-01'::date, '1 month')

-- Index-friendly range (never wrap the column in a function)
WHERE d >= '2026-03-01' AND d < '2026-04-01'
```

## Percentiles

```sql
percentile_cont(0.5)  WITHIN GROUP (ORDER BY x)   -- interpolated median
percentile_disc(0.9)  WITHIN GROUP (ORDER BY x)   -- actual data value
```

## Profiling a new table

```sql
SELECT count(*), count(DISTINCT id), min(d), max(d),
       count(*) - count(col)                    AS nulls,
       count(*) FILTER (WHERE val < 0)          AS negatives,
       avg(val), percentile_cont(0.5) WITHIN GROUP (ORDER BY val)
FROM   t;
```
