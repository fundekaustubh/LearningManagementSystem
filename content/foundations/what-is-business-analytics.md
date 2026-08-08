---
title: What is Business Analytics?
description: A working definition of business analytics, how it differs from data science and business intelligence, and what an analyst actually does all day.
order: 1
difficulty: Beginner
tags: [fundamentals, career, definitions]
---

Business analytics is the practice of **using data to make better business decisions**. That is the whole definition. Everything else — the SQL, the dashboards, the regression models — is machinery in service of that sentence.

The emphasis matters. A number that nobody acts on is trivia. Analytics only earns its keep when it changes what somebody does: which campaign gets the budget, which SKU gets reordered, which customers get a retention call.

## A concrete example

A subscription business notices revenue growth has flattened. Three people look at the same data.

- The **accountant** reports the number: revenue was ₹4.2 crore last quarter, flat versus the previous quarter.
- The **business analyst** decomposes it: new customer acquisition is actually up 12%, but monthly churn rose from 3.1% to 4.6%, and the increase is concentrated entirely in customers acquired through a discounted annual plan.
- The **decision** that follows: stop the discount campaign, and add an onboarding call for the cohort already acquired through it.

The analyst did not produce a bigger number. They produced a **cause and a lever**. That is the job.

> [!NOTE]
> A useful test for any analysis: finish the sentence "therefore we should ___". If you cannot, you have produced a report, not an analysis.

## How business analytics relates to neighbouring fields

These titles overlap heavily and vary by company, but the centre of gravity of each is genuinely different.

| Field | Core question | Typical output | Typical tools |
| --- | --- | --- | --- |
| Business Intelligence | What happened? | Dashboards, scheduled reports | SQL, Power BI, Tableau |
| Business Analytics | Why did it happen, and what should we do? | Analyses, recommendations, models | SQL, Excel, Python/R, statistics |
| Data Science | Can we predict or automate this at scale? | Production models, algorithms | Python, ML frameworks, engineering |
| Data Engineering | Can we get reliable data to everyone? | Pipelines, warehouses, data models | SQL, Spark, orchestration tools |
| Data Analyst | Overlaps with all of the above | Varies enormously by company | SQL, spreadsheets, BI tools |

In practice a business analyst sits closest to the decision-maker. The distinguishing skill is not statistical depth — it is **translation**: turning a vague business worry into a question data can answer, and turning the answer back into something a non-technical stakeholder will act on.

## The four questions analytics answers

Every analytics request is one of four types, in increasing order of difficulty and value:

1. **Descriptive** — What happened? *Revenue fell 8% in June.*
2. **Diagnostic** — Why did it happen? *Because the Bengaluru region lost two enterprise accounts.*
3. **Predictive** — What is likely to happen next? *Two more accounts show the same usage decline pattern.*
4. **Prescriptive** — What should we do about it? *Assign a success manager to those two accounts this week.*

The next tutorial covers these in depth. The key idea for now: most analysts spend most of their time on descriptive and diagnostic work, and most of their *impact* comes from doing that work fast and correctly rather than from building sophisticated models.

## What an analyst's week actually looks like

Job descriptions oversell the modelling. A realistic breakdown for a working business analyst:

- **~40% data wrangling.** Finding the right table, reconciling two systems that disagree, handling the six ways "customer" is defined across the company.
- **~25% analysis.** Aggregating, segmenting, comparing, testing.
- **~20% communication.** Slides, dashboards, writing, arguing about what the number means.
- **~15% everything else.** Ad-hoc requests, meetings, maintenance of things you built.

If you are learning, budget your practice the same way. Being excellent at SQL and clear writing will take you further than being adequate at ten machine learning algorithms.

## The skills that matter

**Technical.** SQL is non-negotiable — it is how you get data in almost every company. Spreadsheets remain the universal interchange format. Add Python or R once SQL is comfortable. Statistics to the level of confidence intervals and hypothesis testing.

**Analytical.** Structuring a problem, choosing a comparison, knowing what would falsify your conclusion, sizing an opportunity with rough numbers.

**Business.** Understanding how your company makes money. An analyst who knows that gross margin on hardware is 18% and on services is 62% will ask completely different questions than one who does not.

**Communication.** One well-chosen chart with one sentence beats twelve slides. This is a skill you practise, not a personality trait.

> [!TIP]
> The fastest way to become useful in a new company is to learn the revenue model and the definition of the top five metrics before you write a single query. Ask "how is 'active user' defined in our system?" — the answer is often surprising and always important.

## A warning about the word "insight"

"Insight" gets used for anything unexpected. A better bar: an insight is a finding that is **true, non-obvious, and actionable**. Drop any one of those and it fails.

- True but obvious: *sales are higher in December.*
- Non-obvious but not actionable: *customers whose surname begins with M churn 0.3pp more.*
- Actionable but not true: anything from a query with a broken join.

Hold your work to all three and you will be in the top quartile of analysts by output.

## Key takeaways

- Business analytics is using data to change decisions, not to produce numbers.
- Its edge over neighbouring fields is translation between business questions and data.
- Analytics answers four escalating questions: what, why, what next, so what.
- Most real work is wrangling and communication; invest your learning accordingly.
- Hold findings to three tests: true, non-obvious, actionable.

```quiz
[
  {
    "q": "A stakeholder asks for 'last quarter's revenue by region'. Which type of analytics is this request?",
    "options": ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"],
    "answer": 0,
    "explain": "It reports what happened with no attempt to explain causes or forecast. That is descriptive analytics."
  },
  {
    "q": "Which of these findings best meets the bar of 'true, non-obvious and actionable'?",
    "options": [
      "Website traffic peaks on weekdays.",
      "Customers who use the mobile app in week one renew at 2x the rate of those who do not.",
      "Revenue was 4.2 crore last quarter.",
      "Customers in the north-east have longer names on average."
    ],
    "answer": 1,
    "explain": "It is non-obvious, verifiable, and suggests a clear lever: drive mobile app adoption during onboarding."
  },
  {
    "q": "What most distinguishes a business analyst from a data scientist in a typical company?",
    "options": [
      "Business analysts write more production code",
      "Business analysts focus on translating business questions into data questions and back",
      "Data scientists never use SQL",
      "Business analysts do not use statistics"
    ],
    "answer": 1,
    "explain": "The analyst's centre of gravity is translation and decision support; the data scientist's is predictive modelling and automation at scale."
  }
]
```
