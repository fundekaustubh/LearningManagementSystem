---
title: The Analytics Project Lifecycle (CRISP-DM)
description: The six phases of a real analytics project, what goes wrong in each, and the checklist that keeps a project from dying in the handover.
order: 3
difficulty: Beginner
tags: [process, crisp-dm, project-management]
---

Most failed analytics projects do not fail at the modelling step. They fail because the question was never pinned down, or because nobody owned the decision at the end. A lifecycle framework exists to force those conversations early.

The most widely used one is **CRISP-DM** (Cross-Industry Standard Process for Data Mining). It has six phases and, crucially, it is a **loop**, not a line.

## Phase 1 — Business understanding

Goal: convert a business concern into a question with a measurable answer and a named decision.

Ask these before touching data:

1. **What decision will this change?** If the answer is "none", stop.
2. **Who makes that decision, and when?** A deadline changes the whole design.
3. **What does success look like numerically?** "Reduce churn" → "reduce 90-day churn from 4.6% to under 3.5% by Q3".
4. **What is the current approach?** Any model must beat the status quo, which is often a simple rule that works surprisingly well.
5. **What would change your mind?** Agreeing on falsifying evidence up front prevents post-hoc goalpost-moving.

> [!TIP]
> Write the headline of the final slide before you start. If you cannot imagine any version of that headline being interesting, redesign the project now rather than in six weeks.

## Phase 2 — Data understanding

Get the data, then attack it sceptically before you trust it.

- **Row counts over time.** A pipeline that silently dropped a source shows up as a step change in daily volume.
- **Missingness by column and by period.** Missing data is rarely random; ask *why* it is missing.
- **Distributions.** Min, max, quartiles. Negative ages, orders in 1970, revenue of exactly 9999999.
- **Uniqueness.** Is `customer_id` actually unique in the customer table? Test it, do not assume it.
- **Join fan-out.** Does joining orders to order_items multiply your row count? It should — make sure you noticed.

```sql
-- A five-minute data sanity check on any new table
SELECT count(*)                                      AS rows,
       count(DISTINCT customer_id)                   AS customers,
       min(order_date)                               AS first_order,
       max(order_date)                               AS last_order,
       sum(CASE WHEN order_value IS NULL THEN 1 END) AS null_values,
       sum(CASE WHEN order_value < 0 THEN 1 END)     AS negative_values
FROM   orders;
```

## Phase 3 — Data preparation

The longest phase, typically 60–80% of project time. It covers joining sources, deduplicating, handling missing values, deriving features and aggregating to the right grain.

**Grain is the concept people get wrong most often.** Decide explicitly what one row of your analysis table represents — one customer? one customer-month? one order line? — and enforce it. Most silently wrong analyses are grain errors: a customer with 40 orders quietly getting 40× the weight of a customer with one.

> [!WARNING]
> Never clean data destructively in place. Keep the raw extract, and express every cleaning step as code that can be re-run. When someone asks in three months "why does this number differ from the finance report?", the answer is in that code.

## Phase 4 — Modelling

"Modelling" covers everything from a weighted average to a gradient-boosted ensemble.

- **Always build a baseline first.** For forecasting: last month's value. For classification: predict the majority class. If your sophisticated model cannot beat the baseline by a margin worth the complexity, ship the baseline.
- **Split data before you look at it.** Train/validation/test, and for anything time-dependent, split *by time* rather than randomly — otherwise you leak the future into the past.
- **Watch for leakage.** If a feature would not be available at prediction time, it cannot be in the model. A churn model containing `cancellation_reason` will be 99% accurate and completely useless.

## Phase 5 — Evaluation

Two distinct questions, and teams routinely answer only the first:

1. **Is the model statistically sound?** Appropriate metric, honest test set, stable across segments.
2. **Does it solve the business problem?** Translate model output into money or hours. A churn model with 30% precision at 60% recall means: for every 100 customers you contact, 30 were really going to leave. At ₹500 per outreach and ₹8,000 of retained value per save, that is ₹50,000 spent to retain ₹240,000. **That** is the evaluation the business cares about.

Also check fairness and stability: does performance collapse for a segment that matters? A model that works for existing customers and fails for new ones may be worse than no model, because it will be trusted anyway.

## Phase 6 — Deployment

Deployment ranges from "a scheduled dashboard" to "an API scoring in real time". Whatever the form, it is not done until:

- Someone **owns** it, by name.
- It is **monitored** — input distributions, output distributions, and the business metric.
- It has a documented **retraining or review cadence**.
- Users know **what it does not do**. Undocumented limits become the reason a tool gets abandoned after its first visible mistake.

## The loop

Deployment feeds back into business understanding. Real projects revisit earlier phases constantly: data understanding reveals the question was unanswerable with the available data; evaluation reveals the metric was wrong. **Going backwards is the process working, not a failure.**

## A pre-flight checklist

Before starting any analytics project, you should be able to answer:

| Question | Why it matters |
| --- | --- |
| What decision does this inform? | No decision, no project |
| Who owns that decision? | Analysis without a customer is never used |
| What is the deadline? | Determines depth vs speed |
| What is the current baseline? | Defines what "better" means |
| What data exists, and how good is it? | Prevents week-four surprises |
| How will we know it worked? | Prevents unfalsifiable claims |

## Key takeaways

- CRISP-DM's six phases: business understanding, data understanding, preparation, modelling, evaluation, deployment.
- Most project risk lives in phase one, not in the modelling.
- Preparation takes most of the time; define the grain of your analysis table explicitly.
- Always compare against a trivial baseline, and split time-series data by time.
- Evaluate in money or hours, not only in model metrics.
- A deployed analysis needs an owner, monitoring and documented limits.

```quiz
[
  {
    "q": "A churn model achieves 99% accuracy. Investigation shows a feature called 'cancellation_reason' is in the training data. What has gone wrong?",
    "options": [
      "Overfitting to noise",
      "Target leakage — the feature is unavailable at prediction time",
      "The sample was too small",
      "Nothing, this is a good model"
    ],
    "answer": 1,
    "explain": "A cancellation reason only exists after the customer has churned, so it cannot exist when you need to predict. This is classic target leakage."
  },
  {
    "q": "Which phase of CRISP-DM typically consumes the most project time?",
    "options": ["Business understanding", "Data preparation", "Modelling", "Deployment"],
    "answer": 1,
    "explain": "Data preparation — joining, cleaning, deriving and aggregating to the right grain — is usually 60-80% of the effort."
  },
  {
    "q": "You are forecasting monthly demand. Why should you split train and test data by time rather than randomly?",
    "options": [
      "Random splits are computationally slower",
      "A random split lets future observations inform predictions about the past, inflating measured accuracy",
      "Time splits produce larger training sets",
      "It makes no difference for forecasting"
    ],
    "answer": 1,
    "explain": "Random splitting leaks future information into training, which is impossible at real prediction time and gives an over-optimistic estimate of accuracy."
  }
]
```
