---
title: Storytelling with Data
description: Structuring an analysis so it changes a decision — the pyramid principle, handling uncertainty honestly, and presenting to people who disagree with you.
order: 4
difficulty: Intermediate
tags: [communication, storytelling, presentation, influence]
---

An analysis that nobody acts on has the same business value as one that was never done. The final step — turning a finding into a decision — is a skill, and it is the one that most distinguishes senior analysts from junior ones.

## Lead with the answer

Business audiences want the conclusion first, then the support. Academic structure — background, method, results, conclusion — fails in a meeting because the decision-maker leaves after ten minutes and the conclusion was on slide fourteen.

**The pyramid principle** (Barbara Minto):

```text
                    THE ANSWER
        "Cut the discounted annual plan"
                        │
        ┌───────────────┼───────────────┐
   Supporting       Supporting      Supporting
   argument 1       argument 2      argument 3
   Churn is 3x      They don't      Removing it
   higher           upgrade          costs ~2% of
                                     new revenue
        │               │               │
     evidence        evidence        evidence
```

Start at the top. Anyone who needs more detail descends; anyone who is convinced can leave. Your appendix carries the depth.

> [!TIP]
> Write the recommendation as a complete sentence containing a verb, before you build any slides. "Discontinue the discounted annual plan for new customers from Q4" is a recommendation. "Insights on the annual plan" is a title with no content.

## The SCQA opening

Situation, Complication, Question, Answer — a reliable structure for the first minute:

- **Situation:** shared context nobody disputes. *"We introduced a 30%-off annual plan in January to accelerate acquisition."*
- **Complication:** what changed or went wrong. *"Acquisition rose 12%, but quarterly churn went from 3.1% to 4.6%."*
- **Question:** the decision at hand. *"Is the plan a net positive?"*
- **Answer:** your recommendation. *"No. Discount customers are worth 40% less over three years. Discontinue it for new customers."*

Four sentences and the audience knows exactly what is being decided and what you think. Everything after that is evidence.

## One message per exhibit

Each chart or slide should make exactly one point, and say it in the title. If a chart supports two points, it is two charts.

The conclusive-title rule from [Principles of Data Visualization](../principles-of-data-visualization/) applies with even more force here: a slide titled "Churn by Plan Type" makes the reader work; "Discount-plan customers churn at 3× the standard rate" does not.

A useful test: read only the slide titles top to bottom. They should form a coherent argument on their own. If they do not, the deck has no structure — it has a sequence of charts.

## Know your audience's default

Different stakeholders need different framing for the same finding:

| Audience | Cares about | Lead with |
| --- | --- | --- |
| CEO / GM | Growth, margin, risk | Money and strategic implication |
| Finance | Accuracy, assumptions | Method, sensitivity, reconciliation |
| Product | Users, mechanism, roadmap | Behaviour and what to build |
| Engineering | Feasibility, systems | Data quality, implementation |
| Sales | Quota, territory, incentives | Impact on their targets |
| Marketing | Channels, segments, spend | CAC, ROI by channel |

Same analysis, different first slide. This is not spin — it is answering the question each person is actually holding.

## Quantify in their units

Always translate statistical results into business consequences.

| Analytical | Business |
| --- | --- |
| "Conversion lift of 0.4pp, p = 0.03" | "About ₹1.8 crore of incremental annual revenue" |
| "Churn is 1.5pp higher in this cohort" | "≈340 customers a year, ₹2.7 crore of ARR" |
| "R² of 0.62" | "The model explains roughly two-thirds of the variation in demand; expect forecasts within ±8% most months" |
| "Precision 0.30 at recall 0.60" | "Contact 100 customers to save 30; at ₹500 per contact and ₹8,000 saved, that returns ₹4.80 per rupee spent" |

## Be honest about uncertainty

Overstated certainty is how analysts lose credibility permanently — the one time a confident claim proves wrong outweighs many correct ones.

**Do:**
- Show confidence intervals or ranges on key numbers
- State assumptions explicitly and where they might break
- Distinguish what the data shows from what you infer
- Say "we cannot tell from this data" when true — it is a real finding
- Name the one thing that would most change your conclusion

**Do not:**
- Bury caveats in an appendix nobody reads
- Present a point estimate as exact when the interval is wide
- Hide a limitation that a knowledgeable stakeholder will spot
- Use "the data shows" for something the data merely permits

> [!TIP]
> Stating a limitation before someone finds it *increases* your credibility. "This assumes the two cohorts are otherwise comparable; I checked tenure and channel but could not control for account size" makes you the most trustworthy person in the room. Being caught omitting it makes you the least.

## Recommendations, not observations

Analysts often stop at the finding because a recommendation feels like overstepping. It is not — you have looked at the data more closely than anyone else in the room, and withholding your judgement wastes that.

| Observation | Recommendation |
| --- | --- |
| "Churn is higher on the discount plan" | "Discontinue the discount plan for new customers from Q4; grandfather existing ones to avoid a support spike" |
| "Mobile converts worse than desktop" | "Prioritise the mobile checkout rebuild; closing half the gap is worth ~₹3 crore annually" |

Include what you would need to be wrong about for the recommendation to fail. That is what makes it a professional judgement rather than an opinion.

## Handling pushback

Disagreement usually takes one of four forms, and each has a productive response:

**"That doesn't match my numbers."** Almost always a definition or date-range difference. Ask for their query or figure and reconcile them together, live. Never dismiss it — they may be right, and you learn where the discrepancy lives either way.

**"The sample is too small."** Show the confidence interval. Either it supports the point or it does not; the interval settles it faster than argument.

**"Correlation isn't causation."** They are right to ask. State what you controlled for, what you could not, and what experiment would settle it.

**"I don't believe it."** Often a mechanism objection rather than a data objection. Ask what would convince them — the answer usually points to the analysis that should be done next.

> [!WARNING]
> Never be defensive about data quality questions. The person asking is doing exactly what a good stakeholder should. Treating scrutiny as an attack is the fastest way to lose a room.

## Structure of a written analysis

```text
1. Recommendation           One paragraph. The decision and why.
2. Key numbers              Three to five, with comparison and uncertainty.
3. Supporting analysis      Two to four sections, one message each.
4. What we cannot conclude  Explicit limitations.
5. Next steps               What to do, who owns it, by when.
6. Appendix                 Method, queries, robustness checks.
```

Anyone can read section 1 and act. Anyone sceptical can read to section 4. Anyone who wants to reproduce it has section 6.

## Key takeaways

- Lead with the answer; use the pyramid so readers can stop when convinced.
- Open with SCQA to establish the decision in four sentences.
- One message per exhibit, stated in the title; the titles alone should form the argument.
- Translate every statistical result into money, customers or hours.
- Surface limitations yourself — it builds credibility rather than undermining it.
- Make a recommendation, and say what would have to be wrong for it to fail.

```quiz
[
  {
    "q": "You have 20 minutes with an executive team. How should you structure the presentation?",
    "options": [
      "Background, methodology, results, then the conclusion at the end",
      "Recommendation first, then the supporting arguments, with detail in the appendix",
      "Every chart you produced, in the order you made them",
      "Methodology in depth so they can judge rigour"
    ],
    "answer": 1,
    "explain": "The pyramid principle puts the answer first so decision-makers can act immediately, with supporting detail available for those who want to descend."
  },
  {
    "q": "A stakeholder says 'that doesn't match my numbers.' What is the best first response?",
    "options": [
      "Explain that your query is correct",
      "Ask to see their figure and reconcile the two together, expecting a definition or date-range difference",
      "Dismiss it as a data quality issue on their side",
      "Redo the analysis privately"
    ],
    "answer": 1,
    "explain": "Discrepancies are usually definitional. Reconciling openly resolves it faster, and may reveal that they are right — either outcome is better than defending."
  },
  {
    "q": "Why should you raise a limitation before anyone asks about it?",
    "options": [
      "It shortens the presentation",
      "Volunteering limitations increases credibility, whereas being caught omitting one destroys it",
      "It is required by statistical convention",
      "It prevents follow-up questions"
    ],
    "answer": 1,
    "explain": "Naming a caveat signals that you understand your own analysis and are not selling a conclusion. Having a stakeholder discover it instead undermines everything else you said."
  }
]
```
