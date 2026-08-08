---
title: Joins and Table Relationships
description: Inner, left, full and anti joins, the fan-out trap that silently doubles your revenue numbers, and how to pick a join key you can trust.
order: 2
difficulty: Beginner
tags: [sql, joins, data-modelling]
---

Joins combine rows from multiple tables. They are also where the most expensive analytics errors happen, because a wrong join does not throw an error — it returns a plausible-looking number that is 40% too high.

## The join types

```sql
-- INNER: only rows matching in both tables
SELECT o.order_id, c.name
FROM   orders o
INNER  JOIN customers c ON c.customer_id = o.customer_id;

-- LEFT: all rows from the left table; NULLs where no match
SELECT c.name, o.order_id
FROM   customers c
LEFT   JOIN orders o ON o.customer_id = c.customer_id;

-- FULL OUTER: everything from both sides
SELECT coalesce(a.id, b.id) AS id, a.value, b.value
FROM   system_a a
FULL   OUTER JOIN system_b b ON b.id = a.id;

-- CROSS: every combination (use deliberately, e.g. date x category scaffolds)
SELECT d.date, c.category
FROM   dates d
CROSS  JOIN categories c;
```

| Join | Keeps | Typical analyst use |
| --- | --- | --- |
| INNER | Matches only | Orders with valid customers |
| LEFT | All left rows | All customers, including those who never ordered |
| RIGHT | All right rows | Rare — rewrite as LEFT with the tables swapped |
| FULL OUTER | Everything | Reconciling two systems |
| CROSS | All combinations | Building complete date × dimension grids |

## LEFT JOIN is the analyst's default

Analysts usually want "all of X, with Y where it exists". An INNER JOIN silently drops the interesting cases — customers with no orders are exactly the ones a retention analysis needs.

```sql
-- Customers and their order counts, INCLUDING those who never ordered
SELECT c.customer_id,
       c.name,
       count(o.order_id)                  AS order_count,
       coalesce(sum(o.order_value), 0)    AS lifetime_value
FROM   customers c
LEFT   JOIN orders o
       ON  o.customer_id = c.customer_id
       AND o.status = 'completed'         -- note: in ON, not WHERE
GROUP  BY c.customer_id, c.name;
```

Two subtleties in that query, both of which people get wrong:

**1. `count(o.order_id)` not `count(*)`.** With a LEFT JOIN, a customer with no orders still produces one row with NULLs. `count(*)` counts that row and returns 1; `count(o.order_id)` ignores NULLs and correctly returns 0.

**2. The status filter is in the `ON` clause, not `WHERE`.**

> [!WARNING]
> Putting a right-table condition in WHERE silently converts a LEFT JOIN into an INNER JOIN:
>
> ```sql
> FROM  customers c
> LEFT  JOIN orders o ON o.customer_id = c.customer_id
> WHERE o.status = 'completed'   -- ← kills the LEFT JOIN
> ```
>
> Customers with no orders get NULL for `o.status`, and `NULL = 'completed'` is not true, so those rows are removed by WHERE. Conditions on the right-hand table belong in `ON`; conditions on the left table belong in `WHERE`.

## Fan-out: the silent revenue inflator

When the join key is not unique on the right-hand side, each left row is duplicated once per match. If you then aggregate a left-table column, you multiply it.

> [!EXAMPLE]
> Order #1001 is worth ₹5,000 and has 3 line items.
>
> ```sql
> SELECT sum(o.order_value)
> FROM   orders o
> JOIN   order_items i ON i.order_id = o.order_id;
> ```
>
> The join produces 3 rows for order #1001, each carrying `order_value = 5000`. The sum reports **₹15,000** for a ₹5,000 order.
>
> Multiply this across a whole table and you report triple revenue with no error message anywhere.

**Detecting fan-out:** compare row counts before and after the join.

```sql
SELECT (SELECT count(*) FROM orders)                    AS before_join,
       (SELECT count(*) FROM orders o
        JOIN order_items i ON i.order_id = o.order_id)  AS after_join;
```

If they differ and you did not intend a one-to-many expansion, stop.

**Three fixes:**

```sql
-- 1. Aggregate the many-side FIRST, then join one-to-one
WITH item_totals AS (
    SELECT order_id,
           sum(quantity * unit_price) AS items_value,
           count(*)                   AS item_count
    FROM   order_items
    GROUP  BY order_id
)
SELECT o.order_id, o.order_value, t.items_value, t.item_count
FROM   orders o
LEFT   JOIN item_totals t ON t.order_id = o.order_id;

-- 2. Deduplicate the header value when you must join first
SELECT sum(DISTINCT o.order_value)  -- fragile: breaks on equal values
FROM   orders o JOIN order_items i ON i.order_id = o.order_id;

-- 3. Aggregate at the correct grain in one pass
SELECT o.order_id,
       max(o.order_value)               AS order_value,   -- constant per order
       sum(i.quantity * i.unit_price)   AS items_value
FROM   orders o
JOIN   order_items i ON i.order_id = o.order_id
GROUP  BY o.order_id;
```

Option 1 is the safest and the one to reach for by default. Option 2 is included because you will see it — and it breaks the moment two orders have identical values.

## Cardinality: know it before you join

| Relationship | Example | Fan-out risk |
| --- | --- | --- |
| One-to-one | order → shipment | None |
| One-to-many | customer → orders | Multiplies the "one" side |
| Many-to-many | products ↔ campaigns | Multiplies both sides |

Verify uniqueness rather than assuming it:

```sql
-- Is customer_id actually unique in customers?
SELECT count(*) AS rows, count(DISTINCT customer_id) AS distinct_ids
FROM   customers;
-- If these differ, every join on customer_id will fan out.
```

Duplicate "unique" keys are extremely common in real warehouses — a slowly-changing dimension with history rows, a botched backfill, a source system that soft-deletes.

## Anti-joins: finding what is missing

Often the analytical question is about absence: customers who never ordered, orders with no matching payment, products never sold.

```sql
-- Preferred: NOT EXISTS (NULL-safe, usually the fastest plan)
SELECT c.customer_id, c.name
FROM   customers c
WHERE  NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);

-- Equivalent: LEFT JOIN ... IS NULL
SELECT c.customer_id, c.name
FROM   customers c
LEFT   JOIN orders o ON o.customer_id = c.customer_id
WHERE  o.customer_id IS NULL;
```

> [!WARNING]
> Avoid `NOT IN (SELECT ...)` when the subquery column can contain NULL. If even one NULL is returned, `NOT IN` evaluates to NULL for every row and the query returns **zero rows** — with no error. `NOT EXISTS` does not have this behaviour.

## Self-joins

A table joined to itself — for hierarchies, or comparing rows within a table.

```sql
-- Employees and their managers
SELECT e.name AS employee, m.name AS manager
FROM   employees e
LEFT   JOIN employees m ON m.employee_id = e.manager_id;
```

For comparing a row to the previous row in a sequence, [window functions](../window-functions/) are almost always clearer and faster than a self-join.

## Choosing join keys

- **Prefer surrogate IDs** over natural keys. Emails change; `customer_id` does not.
- **Beware type mismatches.** Joining `varchar` to `int` may silently cast, or match nothing.
- **Watch whitespace and case.** `'ACME '` ≠ `'acme'`. Normalise with `lower(trim(x))` when joining on text.
- **Composite keys need all parts.** Joining a store-and-date table on date alone fans out across every store.

## Key takeaways

- Default to LEFT JOIN so the absent cases — which are usually the interesting ones — survive.
- Right-table conditions go in `ON`; putting them in `WHERE` turns a LEFT JOIN into an INNER JOIN.
- Use `count(column)` not `count(*)` after a LEFT JOIN.
- Fan-out multiplies aggregates silently; compare row counts before and after every join.
- Aggregate the many-side to the right grain *before* joining.
- Use `NOT EXISTS` for anti-joins; `NOT IN` breaks on NULLs by returning nothing.

```quiz
[
  {
    "q": "You join orders (10,000 rows) to order_items and then sum order_value. The total is triple what finance reports. What happened?",
    "options": [
      "The status filter is missing",
      "Fan-out — each order matched multiple line items, duplicating order_value per row",
      "A LEFT JOIN should have been used",
      "The order_value column is corrupted"
    ],
    "answer": 1,
    "explain": "Joining a one-to-many relationship repeats the parent row once per child. Summing the parent's value then multiplies it. Aggregate the item side first, then join."
  },
  {
    "q": "You write a LEFT JOIN from customers to orders, then add `WHERE o.status = 'completed'`. What is the effect?",
    "options": [
      "Nothing changes",
      "Customers with no orders are dropped, converting it to an INNER JOIN",
      "All orders are included regardless of status",
      "The query errors"
    ],
    "answer": 1,
    "explain": "Non-matching rows have NULL status, and NULL = 'completed' is not true, so WHERE removes them. Right-table conditions belong in the ON clause."
  },
  {
    "q": "Why prefer NOT EXISTS over NOT IN for anti-joins?",
    "options": [
      "NOT IN is not standard SQL",
      "If the subquery returns any NULL, NOT IN returns zero rows with no error",
      "NOT EXISTS supports more join types",
      "NOT IN cannot use indexes"
    ],
    "answer": 1,
    "explain": "A single NULL in the subquery makes every NOT IN comparison evaluate to NULL, silently returning an empty result set. NOT EXISTS handles NULLs correctly."
  }
]
```
