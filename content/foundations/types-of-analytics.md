---
title: The Four Types of Analytics
description: Descriptive, diagnostic, predictive and prescriptive analytics — what each one answers, when to use it, and why skipping levels usually backfires.
order: 2
difficulty: Beginner
tags: [fundamentals, framework, definitions]
---

Analytics maturity is usually drawn as a ladder with four rungs. The ladder is a useful mental model as long as you remember one thing: **higher is not automatically better**. A correct descriptive answer delivered on Tuesday beats a sophisticated forecast delivered in March.

## 1. Descriptive analytics — what happened?

Descriptive analytics summarises the past. Counts, sums, averages, rates, trends, breakdowns.

- Monthly active users by platform
- Average order value by region
- Conversion rate by traffic source, last 90 days

This is the foundation everything else is built on, and it is where most companies have the most unfixed problems — usually because two systems disagree about the same number.

```sql
-- Descriptive: monthly orders and revenue
SELECT date_trunc('month', order_date) AS month,
       count(*)                        AS orders,
       sum(order_value)                AS revenue,
       avg(order_value)                AS avg_order_value
FROM   orders
WHERE  status = 'completed'
GROUP  BY 1
ORDER  BY 1;
```

**The hard part is not the SQL.** It is agreeing on definitions: does a cancelled-then-reinstated subscription count as churn? Is revenue booked at order or at delivery? Descriptive analytics is where those arguments get settled.

## 2. Diagnostic analytics — why did it happen?

Diagnostic work takes a change and decomposes it until the cause is isolated. The core technique is **segmentation**: keep splitting the metric until the movement concentrates in one slice.

> [!EXAMPLE]
> Overall conversion rate fell from 3.4% to 2.9%.
>
> - By device: desktop steady at 4.1%, mobile fell 3.0% → 2.2%. **The drop is mobile.**
> - By mobile OS: iOS steady, Android fell 2.9% → 1.6%. **It is Android.**
> - By app version: the drop starts exactly with release 8.2.0.
> - Conclusion: a checkout bug shipped in the Android 8.2.0 build. Ship a hotfix.
>
> Four splits took a vague "conversion is down" into a specific engineering ticket.

Other diagnostic tools:

- **Time decomposition.** Did the metric step-change on a date (a release, a price change) or drift gradually (a mix shift)?
- **Mix effects.** The overall average can move even when every segment is flat, if the *proportion* of segments changed. This is Simpson's paradox territory and it catches everyone once.
- **Correlation analysis.** Useful for generating hypotheses, dangerous as evidence. See [Correlation vs Causation](../../statistics/correlation-vs-causation/).

## 3. Predictive analytics — what is likely to happen?

Predictive analytics uses historical patterns to estimate something unknown: a future value, or a label you do not yet have.

| Question | Model family |
| --- | --- |
| How many units will we sell next month? | Time-series forecasting |
| Which customers will churn in 30 days? | Classification |
| What will this customer be worth over three years? | Regression / CLV models |
| Which of these transactions is fraudulent? | Classification, anomaly detection |

Two honest caveats:

1. A prediction is only useful if there is **time to act** on it. A churn model that flags customers the day they leave is worthless; one that flags them 30 days early is a retention programme.
2. Predictions assume the future resembles the past. Every forecast built before a pricing change, a competitor launch or a pandemic learned this the hard way.

## 4. Prescriptive analytics — what should we do?

Prescriptive analytics recommends an action, usually by combining a prediction with constraints and an objective.

- **Optimisation.** Given a ₹50 lakh marketing budget, which channel allocation maximises expected new customers? (Linear programming.)
- **Simulation.** If demand is uncertain, what inventory level minimises expected total cost of stockouts plus holding?
- **Decision rules.** If churn probability > 0.6 **and** customer lifetime value > ₹40,000, assign to the retention team. Otherwise send an automated offer.

That last pattern — a threshold rule over a model score — is the most common form of prescriptive analytics in practice, and it needs no optimisation solver at all. Note that choosing the threshold is a **business** decision about the relative cost of a false positive versus a false negative, not a statistical one.

## Putting the ladder together

One scenario, all four rungs:

| Rung | Output |
| --- | --- |
| Descriptive | Churn rose from 3.1% to 4.6% last quarter. |
| Diagnostic | The rise is concentrated in customers acquired on the discounted annual plan. |
| Predictive | A model flags 1,840 current customers with >60% probability of churning in 30 days. |
| Prescriptive | Of those, target the 620 with CLV above ₹40,000 with a success call; the expected value of the call exceeds its cost only for that group. |

Notice that each rung depends on the one below it. If the churn definition in step one is wrong, the model in step three is confidently wrong, and step four wastes the team's time at scale. **Errors do not stay small as you climb the ladder — they get automated.**

> [!WARNING]
> The most common failure in analytics teams is jumping to rung three because it is more interesting, on top of rung-one definitions nobody has audited. Fix the plumbing first.

## When each type is the right choice

- Recurring operational question, needs to be fast and consistent → **descriptive**, in a dashboard.
- Something moved and nobody knows why → **diagnostic**, as a one-off analysis.
- The action needs lead time and there are more cases than humans can review → **predictive**.
- There is a resource to allocate under a constraint → **prescriptive**.

## Key takeaways

- The four types answer: what happened, why, what next, and what to do.
- Higher rungs are not better — they are more expensive and depend on the lower rungs being right.
- Diagnostic work is mostly disciplined segmentation.
- Predictions are only valuable when there is time and a mechanism to act.
- Prescriptive analytics usually means a threshold rule, and the threshold is a business decision.

```quiz
[
  {
    "q": "Sales dropped 15% last week. You split the drop by region, channel and product line to find where it is concentrated. Which type of analytics is this?",
    "options": ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"],
    "answer": 1,
    "explain": "Segmenting a change to isolate its cause is the core diagnostic technique."
  },
  {
    "q": "A churn model is 92% accurate but only flags customers on the day they cancel. What is the main problem?",
    "options": [
      "The accuracy is too low",
      "There is no lead time, so no action is possible",
      "Churn cannot be predicted",
      "The model should be prescriptive instead"
    ],
    "answer": 1,
    "explain": "A prediction is only valuable if there is time and a mechanism to act on it. Same-day flags leave no room for intervention."
  },
  {
    "q": "Why is it risky to build predictive models before auditing descriptive definitions?",
    "options": [
      "Models require more data than reports",
      "Errors in the underlying definitions get scaled and automated by the model",
      "Predictive models cannot use SQL",
      "Descriptive analytics is always more accurate"
    ],
    "answer": 1,
    "explain": "Each rung depends on the one below. A wrong churn definition produces a confidently wrong model that then drives automated actions."
  }
]
```
