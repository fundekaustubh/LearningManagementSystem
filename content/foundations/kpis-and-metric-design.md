---
title: Designing KPIs and Metrics That Work
description: How to pick a north-star metric, build a metric tree, avoid vanity metrics, and write a definition precise enough that two analysts get the same number.
order: 5
difficulty: Beginner
tags: [metrics, kpi, fundamentals, business]
---

A metric is a number that measures something. A **KPI** — key performance indicator — is a metric a team has agreed to be judged on. The difference is accountability, and it is why KPI selection is a political act as much as an analytical one.

Get this wrong and you do not just measure badly; you actively steer the company somewhere you did not intend. People optimise what they are measured on. That is the point, and the danger.

## Properties of a good metric

1. **Actionable.** Someone can change it through their own decisions. "Market sentiment" is not actionable for a support team; "first response time" is.
2. **Unambiguous.** Two analysts working independently produce the same number. This is much rarer than you would expect.
3. **Timely.** It updates fast enough to inform the decision cycle. An annual metric cannot steer a weekly sprint.
4. **Comparable.** Meaningful across periods and segments — usually meaning it is a rate or ratio, not a raw count that grows with the business.
5. **Hard to game in destructive ways.** Every metric can be gamed; you want the cheapest way to move it to also be genuinely good for the business.

## Vanity metrics

A vanity metric goes up regardless of whether things are going well, and implies no action.

| Vanity metric | Better replacement |
| --- | --- |
| Cumulative registered users | Weekly active users; 30-day retention |
| Total page views | Conversion rate; qualified sessions |
| Number of features shipped | Feature adoption rate |
| Social media followers | Referral traffic that converts |
| Total revenue (fast-growing co.) | Revenue per customer; gross margin |

The tell: **cumulative counters**. They can only go up, so they carry no signal about the current period.

> [!TIP]
> A quick test for any proposed KPI: "if this number doubled next month, would we know what we did right?" If not, it is describing the weather rather than measuring the team.

## The metric tree

Rather than a flat list of thirty numbers, decompose one top-level metric into its drivers. Each level should be arithmetically linked to the one above.

For an e-commerce business:

```text
                          Revenue
                             |
        +--------------------+--------------------+
     Traffic          Conversion Rate      Average Order Value
        |                    |                     |
  +-----+-----+       +------+------+        +-----+-----+
Paid  Organic  Direct  Add-to-cart  Checkout  Items/  Price/
                        rate        completion  order   item
```

Revenue = Traffic × Conversion Rate × Average Order Value. Because the relationship is multiplicative, a 10% improvement anywhere in the tree has the same effect on revenue — which is a genuinely useful thing to know when prioritising work.

The tree also makes diagnosis mechanical. When revenue falls, you walk down the tree until the drop localises. That is [diagnostic analytics](../types-of-analytics/) with a map.

## North star, input and guardrail metrics

- **North star metric**: the single number that best captures the value your product delivers. Spotify: time spent listening. Airbnb: nights booked. It should move only when customers are genuinely better served.
- **Input metrics**: the levers teams actually work on, which feed the north star. They must be movable within a sprint or a quarter.
- **Guardrail metrics**: things that must *not* degrade while you push the north star. This is the crucial and most-often-skipped category.

> [!EXAMPLE]
> A food delivery app sets its north star as **weekly completed orders**.
>
> - Input metrics: restaurants live per city, median delivery time, app crash rate, promo redemption rate.
> - Guardrails: contribution margin per order, customer rating, courier earnings per hour, refund rate.
>
> Without the guardrails, the fastest route to more orders is unlimited discounting — orders soar, the company loses money on every one. The guardrail metric is what makes the KPI safe to optimise.

## Goodhart's Law

> "When a measure becomes a target, it ceases to be a good measure."

Real examples worth internalising:

- Support measured on **tickets closed per hour** → agents close tickets prematurely; repeat contacts rise.
- Sales measured on **bookings** with no retention component → aggressive discounting to customers who churn in month two.
- Call centres measured on **average handling time** → customers transferred rather than helped.

Two defences: **pair every KPI with a guardrail** that captures the quality being sacrificed, and **review the KPI set periodically**, because gaming behaviour evolves.

## Writing a metric definition

Most metric disputes are definitional. A usable definition specifies six things:

1. **Name** — Monthly Active User (MAU)
2. **Plain-English intent** — a person who got value from the product this month
3. **Precise rule** — a distinct `user_id` with ≥1 `session_start` event where `session_duration ≥ 10s`, in the calendar month, `Asia/Kolkata`
4. **Exclusions** — internal accounts, bots, users deleted for GDPR
5. **Source of truth** — `analytics.fct_sessions`, refreshed daily at 03:00 IST
6. **Known caveats** — logged-out users are counted per device, so MAU slightly overstates people

```sql
-- MAU, matching the definition above exactly
SELECT date_trunc('month', session_start_at)  AS month,
       count(DISTINCT user_id)                AS mau
FROM   analytics.fct_sessions
WHERE  session_duration_seconds >= 10
  AND  is_internal_account = false
  AND  is_bot = false
GROUP  BY 1
ORDER  BY 1;
```

The value of writing this down is that the next argument about the number becomes an argument about the definition — which is a solvable problem — instead of an argument about who queried it correctly.

## Leading vs lagging indicators

**Lagging** indicators confirm outcomes: revenue, churn rate, NPS. They are accurate and arrive too late to change.

**Leading** indicators predict outcomes: trial-to-paid activation rate, week-one feature adoption, support ticket volume per 100 accounts. They are noisier and arrive in time to act.

Track both. A dashboard of purely lagging indicators is a rear-view mirror; one of purely leading indicators has no accountability.

## Key takeaways

- A good metric is actionable, unambiguous, timely, comparable and hard to game destructively.
- Cumulative counters are usually vanity metrics — prefer rates and per-period measures.
- Build a metric tree so drivers are arithmetically linked and diagnosis is mechanical.
- Pair every north-star metric with guardrails; Goodhart's Law is not optional.
- Write six-part definitions; most metric disputes are definitional, not analytical.
- Balance leading indicators (actionable, noisy) with lagging ones (reliable, late).

```quiz
[
  {
    "q": "Which of these is most clearly a vanity metric?",
    "options": [
      "30-day retention rate",
      "Cumulative total registered accounts since launch",
      "Weekly active users",
      "Average revenue per user"
    ],
    "answer": 1,
    "explain": "A cumulative counter can only rise, so it carries no information about current performance and suggests no action."
  },
  {
    "q": "A team's KPI is 'weekly completed orders'. Which guardrail metric best protects against destructive gaming?",
    "options": [
      "Total app downloads",
      "Contribution margin per order",
      "Number of push notifications sent",
      "Cumulative orders since launch"
    ],
    "answer": 1,
    "explain": "The cheapest way to inflate orders is heavy discounting. Contribution margin per order catches exactly that failure mode."
  },
  {
    "q": "Revenue = Traffic x Conversion Rate x Average Order Value. What does this multiplicative structure imply?",
    "options": [
      "Only traffic improvements matter",
      "A 10% improvement in any of the three factors has the same effect on revenue",
      "The factors must be independent",
      "Conversion rate should always be prioritised"
    ],
    "answer": 1,
    "explain": "In a multiplicative tree a proportional gain anywhere multiplies through identically, which is useful when prioritising where to invest effort."
  }
]
```
