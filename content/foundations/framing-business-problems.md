---
title: Framing a Business Problem as an Analytics Question
description: The translation skill that separates good analysts from query-writers — turning "sales are down, look into it" into a scoped, answerable question.
order: 6
difficulty: Beginner
tags: [problem-solving, communication, structure, fundamentals]
---

The request an analyst receives is almost never the question they should answer. "Can you pull the numbers for the North region?" is a symptom. Somewhere behind it is a decision, and your job is to find it before you write SQL.

## Start with the decision, not the data

Three questions, asked early, save weeks:

1. **What decision are you trying to make?**
2. **What would you do differently depending on the answer?**
3. **When do you need to decide?**

If question two has no answer — if every result leads to the same action — the analysis has no value and you have just saved everyone a week. This happens more often than anyone admits.

> [!EXAMPLE]
> **Request:** "Can you send me last month's sales by region?"
>
> **After asking:** the VP is deciding whether to move two headcount from the West team to the North team before the quarter closes.
>
> **The real question:** which region has the highest incremental revenue per additional salesperson?
>
> That is a different analysis entirely — it needs current rep counts, pipeline coverage and quota attainment, not a regional revenue table. Answering the literal request would have been useless *and* would have looked responsive.

## Make the question answerable

A well-formed analytics question has five components:

| Component | Weak version | Strong version |
| --- | --- | --- |
| **Metric** | "performance" | 90-day repeat purchase rate |
| **Population** | "customers" | customers first ordering Jan–Mar 2026, excluding B2B |
| **Time frame** | "recently" | first 90 days after first order |
| **Comparison** | — | versus the Oct–Dec 2025 cohort |
| **Decision threshold** | — | a gap over 3pp triggers a review of the onboarding flow |

The comparison is what people forget. **A number alone means nothing.** A 2.8% conversion rate is good or bad only relative to last month, to another segment, to a competitor, or to a target. Pick the comparison deliberately — it determines the conclusion.

## Structuring the problem: issue trees

Break the question into mutually exclusive, collectively exhaustive (MECE) branches, so you can eliminate whole areas rather than wandering.

"Why did profit fall 12% last quarter?"

```text
Profit decline
├── Revenue down
│   ├── Volume down
│   │   ├── Fewer customers
│   │   └── Fewer orders per customer
│   └── Price/mix down
│       ├── More discounting
│       └── Shift to cheaper products
└── Costs up
    ├── COGS up (input prices, supplier mix)
    ├── Fulfilment cost per order up
    └── Fixed costs up (headcount, tooling)
```

Now the work is mechanical: quantify each branch, find which explains most of the gap, and go one level deeper only there. This is far faster than exploring at random, and it produces a defensible narrative — you can show that you ruled out the other branches rather than ignored them.

> [!TIP]
> Quantify branches roughly before drilling in. If costs explain 2pp of a 12pp decline, do not spend three days on supplier analysis. Rough sizing first, precision later, and only where it matters.

## Hypothesis-driven analysis

Rather than "explore the data and see what turns up", write down candidate explanations first, then design the cheapest test that could kill each one.

For "conversion rate dropped in June":

| Hypothesis | Cheapest test that could kill it | Result |
| --- | --- | --- |
| Traffic mix shifted to lower-intent channels | Conversion by channel, holding channel mix fixed | Mix explains 0.1pp — mostly rejected |
| A site change broke something | Conversion by device × browser × release date | Android post-8.2.0 collapsed — **supported** |
| Seasonality | Compare June vs June last year | Last June was flat — rejected |
| Competitor promotion | Branded search volume, price scrape | No change — rejected |

Two disciplines make this work: **write the hypotheses before looking**, so you are not just narrating whatever you happened to find; and **prefer tests that can disconfirm**, because a test that would look supportive under every scenario tells you nothing.

## Scoping: the 80/20 conversation

Almost every request can be answered at three levels of effort. Offer the choice explicitly:

- **2 hours** — directional answer from existing dashboards, with caveats.
- **2 days** — proper segmentation, sanity-checked data, a defensible recommendation.
- **2 weeks** — model, statistical validation, full sensitivity analysis.

Stakeholders will almost always pick the two-day version once they see the trade-off. Guessing on their behalf is how analysts end up over-engineering a question that had a same-day deadline.

## Common framing failures

- **Answering the literal question.** Fixed by asking about the decision.
- **No comparison.** A metric with no baseline cannot support a conclusion.
- **Confusing the population.** "Customer" means signed-up, active or paying — pick one and say which.
- **Ignoring the counterfactual.** "Users who saw the banner converted 3× better" — compared to whom? Users who saw it were probably already further along.
- **Boiling the ocean.** Six weeks of exploration with no hypothesis produces slides, not decisions.
- **Precision theatre.** Reporting ₹4,23,17,842.61 when the input data is ±5% signals carelessness, not rigour.

## A framing template

Fill this in before starting. It fits in a Slack message and prevents most rework.

```text
DECISION:    Whether to extend the free trial from 14 to 30 days.
OWNER:       Head of Growth · needs an answer by 20 August.
QUESTION:    Do users on longer trials convert to paid at a higher rate,
             net of the delayed revenue?
POPULATION:  Self-serve signups, Jan-Jun 2026, excluding enterprise.
COMPARISON:  Existing 14-day trials vs the 30-day pilot cohort.
THRESHOLD:   Extend if paid conversion improves by >2pp with no drop in
             90-day retention.
DATA:        fct_trials, fct_subscriptions. Known gap: trial source is
             null for ~8% of March signups.
EFFORT:      2 days.
```

## Key takeaways

- Find the decision behind the request before writing any query.
- If no result would change the action, say so and stop — that is a valid deliverable.
- A complete question names metric, population, time frame, comparison and threshold.
- Use MECE issue trees to eliminate branches, and size them roughly before drilling in.
- Write hypotheses before you look, and design tests that could disprove them.
- Offer explicit effort levels instead of silently choosing one.

```quiz
[
  {
    "q": "A stakeholder asks for 'last month's sales by region'. What should you do first?",
    "options": [
      "Write the query immediately — it is a simple request",
      "Ask what decision the numbers will inform and what would change based on the answer",
      "Build a dashboard covering every possible regional cut",
      "Escalate to your manager"
    ],
    "answer": 1,
    "explain": "The literal request is usually a symptom of an underlying decision. Finding that decision often changes the analysis entirely."
  },
  {
    "q": "Which element is missing from: 'What is our 90-day repeat purchase rate for customers acquired in Q1?'",
    "options": ["Metric", "Population", "Time frame", "Comparison"],
    "answer": 3,
    "explain": "Metric, population and time frame are all specified, but with no comparison — another cohort, a target, a prior period — the resulting number cannot support a conclusion."
  },
  {
    "q": "What is the main advantage of a MECE issue tree when diagnosing a profit decline?",
    "options": [
      "It guarantees a statistically significant result",
      "It lets you eliminate whole branches with rough sizing before drilling into the one that matters",
      "It removes the need for data validation",
      "It automatically identifies causation"
    ],
    "answer": 1,
    "explain": "Mutually exclusive, collectively exhaustive branches let you quantify roughly, rule areas out, and spend detailed effort only where the gap actually lives."
  }
]
```
