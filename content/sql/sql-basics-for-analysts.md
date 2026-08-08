---
title: SQL Basics for Analysts
description: SELECT, WHERE, ORDER BY, CASE and the logical order of execution — the query fundamentals that everything else in analytics is built on.
order: 1
difficulty: Beginner
tags: [sql, fundamentals, querying]
---

SQL is how analysts get data. Every BI tool, every notebook, every dashboard eventually issues SQL. It is also the highest-leverage skill to learn first, because it is stable — the SQL you learn today will still work in fifteen years.

## The dataset used throughout this track

```sql
customers  (customer_id, name, email, city, segment, signup_date, is_active)
orders     (order_id, customer_id, order_date, status, order_value, channel)
order_items(order_item_id, order_id, product_id, quantity, unit_price)
products   (product_id, product_name, category, cost_price)
```

## The anatomy of a query

```sql
SELECT   c.city,
         count(*)          AS order_count,
         sum(o.order_value) AS revenue
FROM     orders o
JOIN     customers c ON c.customer_id = o.customer_id
WHERE    o.order_date >= '2026-01-01'
  AND    o.status = 'completed'
GROUP BY c.city
HAVING   sum(o.order_value) > 100000
ORDER BY revenue DESC
LIMIT    10;
```

## Logical order of execution

You write a query in one order; the database evaluates it in another. Internalising this order explains nearly every beginner error.

```text
1. FROM / JOIN     →  assemble the rows
2. WHERE           →  filter individual rows
3. GROUP BY        →  collapse rows into groups
4. HAVING          →  filter the groups
5. SELECT          →  compute output columns
6. DISTINCT        →  remove duplicate output rows
7. ORDER BY        →  sort
8. LIMIT / OFFSET  →  truncate
```

Three consequences that answer the most common questions:

- **You cannot use a SELECT alias in WHERE.** WHERE runs before SELECT, so the alias does not exist yet. You *can* use it in ORDER BY, which runs after.
- **WHERE filters rows, HAVING filters groups.** `WHERE order_value > 1000` keeps large orders; `HAVING sum(order_value) > 1000` keeps customers with large totals. These are completely different questions.
- **Filter early.** Conditions in WHERE reduce the rows that ever reach the aggregation, which is both faster and usually what you meant.

> [!TIP]
> When a query returns something surprising, mentally walk the eight steps in order. The bug is almost always a step happening earlier or later than you assumed.

## Filtering

```sql
-- Comparison and logic
WHERE order_value > 1000
  AND status IN ('completed', 'shipped')
  AND order_date BETWEEN '2026-01-01' AND '2026-03-31'
  AND channel <> 'internal'

-- Pattern matching
WHERE email LIKE '%@gmail.com'        -- ends with
  AND name ILIKE 'a%'                 -- starts with a, case-insensitive (Postgres)

-- NULL handling
WHERE discount_code IS NULL           -- never "= NULL"
  AND coalesce(refund_amount, 0) = 0  -- treat NULL as zero
```

### NULL is the number one source of silent bugs

NULL means *unknown*, not zero and not empty string. Any comparison with NULL yields NULL, which is not true, so the row is filtered out.

```sql
-- Given: 1000 orders, 200 of which have channel = NULL
SELECT count(*) FROM orders WHERE channel <> 'email';
-- Returns 600, not 800. The 200 NULL rows are excluded,
-- because NULL <> 'email' evaluates to NULL, not TRUE.

-- What you almost certainly meant:
SELECT count(*) FROM orders
WHERE channel IS DISTINCT FROM 'email';   -- Postgres
-- or
WHERE coalesce(channel, '(none)') <> 'email';
```

> [!WARNING]
> This bug does not error. It silently returns a smaller number, and the analysis based on it looks perfectly reasonable. Whenever you write a `<>` or `NOT IN` filter, ask yourself what happens to NULLs in that column.

`NOT IN` with a subquery that can return NULL is even worse — it returns *no rows at all*. Use `NOT EXISTS` instead.

## CASE expressions

CASE is how you build business logic inside SQL: bucketing, pivoting and conditional aggregation.

```sql
-- Bucketing a continuous variable
SELECT CASE WHEN order_value < 500              THEN 'small'
            WHEN order_value < 2000             THEN 'medium'
            WHEN order_value < 10000            THEN 'large'
            ELSE 'enterprise'
       END                AS order_size,
       count(*)           AS orders,
       sum(order_value)   AS revenue
FROM   orders
WHERE  status = 'completed'
GROUP  BY 1
ORDER  BY min(order_value);
```

**Conditional aggregation** is the single most useful SQL idiom for analysts — it turns rows into columns and replaces most self-joins:

```sql
SELECT date_trunc('month', order_date)                              AS month,
       count(*)                                                      AS all_orders,
       count(*) FILTER (WHERE channel = 'mobile')                    AS mobile_orders,
       sum(order_value) FILTER (WHERE channel = 'mobile')            AS mobile_revenue,
       avg(CASE WHEN status = 'returned' THEN 1.0 ELSE 0.0 END)      AS return_rate
FROM   orders
GROUP  BY 1
ORDER  BY 1;
```

`FILTER (WHERE ...)` is standard SQL and supported by Postgres, DuckDB and SQLite. In MySQL, BigQuery or older engines, use `sum(CASE WHEN cond THEN 1 ELSE 0 END)`, which is equivalent.

## Aliasing and readability

An analytics query is read many more times than it is written — often by you, six months later, trying to work out why a number is wrong.

```sql
-- Hard to review
select c.city, count(*), sum(o.order_value) from orders o, customers c
where o.customer_id=c.customer_id and o.status='completed' group by 1;

-- Reviewable
SELECT   c.city,
         count(*)           AS order_count,
         sum(o.order_value) AS revenue
FROM     orders    o
JOIN     customers c ON c.customer_id = o.customer_id
WHERE    o.status = 'completed'
GROUP BY c.city;
```

Conventions worth adopting: keywords uppercase, one column per line, meaningful aliases (`o`, `c`), explicit `JOIN ... ON` rather than comma joins, and every aggregate given an alias.

## Common table expressions (CTEs)

`WITH` clauses let you name intermediate steps. They turn an unreadable nested query into a sequence you can reason about — and debug one step at a time.

```sql
WITH completed_orders AS (
    SELECT *
    FROM   orders
    WHERE  status = 'completed'
      AND  order_date >= '2026-01-01'
),
customer_totals AS (
    SELECT customer_id,
           count(*)           AS orders,
           sum(order_value)   AS lifetime_value
    FROM   completed_orders
    GROUP  BY customer_id
)
SELECT c.segment,
       count(*)                       AS customers,
       round(avg(t.lifetime_value), 0) AS avg_ltv,
       round(avg(t.orders), 2)         AS avg_orders
FROM   customer_totals t
JOIN   customers c ON c.customer_id = t.customer_id
GROUP  BY c.segment
ORDER  BY avg_ltv DESC;
```

> [!TIP]
> Build long queries CTE by CTE. Write the first block, run it, check the row count and a few rows, then add the next. Debugging a 60-line query written all at once is far slower than building it in verified steps.

## Dates

Date handling is the most dialect-specific part of SQL, and where most portability problems appear.

```sql
-- PostgreSQL
date_trunc('month', order_date)                 -- first day of the month
order_date >= current_date - interval '30 days' -- rolling window
extract(dow FROM order_date)                    -- day of week
age(current_date, signup_date)                  -- interval between

-- BigQuery
DATE_TRUNC(order_date, MONTH)
order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)

-- MySQL
DATE_FORMAT(order_date, '%Y-%m-01')
order_date >= CURDATE() - INTERVAL 30 DAY
```

> [!WARNING]
> `WHERE date_trunc('month', order_date) = '2026-03-01'` prevents the database from using an index on `order_date`, because the column is wrapped in a function. On a large table this turns a fast lookup into a full scan. Write a range instead: `WHERE order_date >= '2026-03-01' AND order_date < '2026-04-01'`.

## A checklist before you trust a query result

1. Does the row count make sense? Compare against a simple `count(*)` on the base table.
2. Did any join multiply rows? Check `count(*)` before and after each join.
3. Are NULLs handled explicitly in every filter and aggregate?
4. Does the date range include the boundaries you intended? (`BETWEEN` is inclusive.)
5. Does one row of the output represent what you think it does — the grain?
6. Does a total tie out against a known number from another source?

## Key takeaways

- Learn the logical execution order; it explains most surprising query behaviour.
- WHERE filters rows, HAVING filters groups — they answer different questions.
- NULL comparisons are silently false, which shrinks results without erroring.
- Conditional aggregation (`FILTER` / `CASE`) replaces most self-joins.
- Build long queries as CTEs, verifying each step.
- Never wrap an indexed date column in a function inside WHERE; use a range.

```quiz
[
  {
    "q": "A table has 1,000 orders, 200 with channel = NULL. What does `SELECT count(*) FROM orders WHERE channel <> 'email'` return if 200 rows have channel = 'email'?",
    "options": ["800", "600", "1000", "200"],
    "answer": 1,
    "explain": "The 200 NULL rows evaluate to NULL (not TRUE) and are excluded along with the 200 'email' rows, giving 600. This is the most common silent SQL bug."
  },
  {
    "q": "Which clause would you use to keep only customers whose total spend exceeds ₹1,00,000?",
    "options": [
      "WHERE order_value > 100000",
      "HAVING sum(order_value) > 100000",
      "WHERE sum(order_value) > 100000",
      "ORDER BY sum(order_value)"
    ],
    "answer": 1,
    "explain": "The condition applies to a group aggregate, so it belongs in HAVING. WHERE runs before grouping and cannot see aggregates."
  },
  {
    "q": "Why should you avoid `WHERE date_trunc('month', order_date) = '2026-03-01'` on a large table?",
    "options": [
      "It returns incorrect results",
      "Wrapping the column in a function prevents index use, forcing a full scan",
      "date_trunc is not valid SQL",
      "It only works in MySQL"
    ],
    "answer": 1,
    "explain": "A function applied to the column makes the predicate non-sargable, so the index on order_date cannot be used. A range condition preserves index access."
  }
]
```
