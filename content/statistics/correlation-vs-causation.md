---
title: Correlation vs Causation
description: Why correlated metrics mislead, the three alternative explanations to check every time, and how to build a defensible causal claim without an experiment.
order: 8
difficulty: Intermediate
tags: [statistics, causal, correlation, bias]
---

"Customers who use feature X retain 3× better" is the most dangerous sentence in business analytics. It is almost always true, and it almost never means what the person saying it thinks it means.

## What correlation measures

The Pearson correlation coefficient $r$ measures **linear** association, from −1 to +1.

$r = \frac{Σ(xᵢ - x̄)(yᵢ - ȳ)}{\sqrt{Σ(xᵢ - x̄)² × Σ(yᵢ - ȳ)²}}$

Rough interpretation for business data: |r| < 0.3 weak, 0.3–0.7 moderate, > 0.7 strong. But three caveats matter more than the thresholds:

1. **Only linear relationships.** A perfect U-shape has r ≈ 0. Always plot the scatter before trusting r.
2. **Sensitive to outliers.** One extreme point can create or destroy a correlation. Spearman's rank correlation is the robust alternative.
3. **$r²$ is the share of variance explained.** r = 0.5 explains 25% of variance, not 50%. This is a very common overstatement.

## The four explanations for any correlation

X and Y move together. There are exactly four possibilities, and only the first is what people usually assume:

1. **X causes Y** — the hoped-for explanation.
2. **Y causes X** — reverse causation.
3. **Z causes both** — a confounder.
4. **Coincidence** — especially with many variables tested.

Before claiming (1), you must rule out (2), (3) and (4). Here is what each looks like in practice.

### Reverse causation

> Customers who contact support churn more. **Therefore support drives customers away?**
>
> More likely: customers who are already having problems contact support. The problem causes both the ticket and the churn.

> Companies with large data teams grow faster. **Therefore hire analysts to grow?**
>
> Or: growing companies have money to hire analysts.

**Test:** check the time ordering. Does X reliably precede Y at the individual level? If they are simultaneous or Y often precedes X, reverse causation is live.

### Confounding

A third variable causes both. This is the most common failure, and it is what makes observational feature-adoption analysis so misleading.

> [!EXAMPLE]
> **The feature adoption trap.** "Users of our Reports feature retain at 82%; non-users at 27%. Reports drives retention — let's push everyone to use it!"
>
> The confounder is **engagement**. Users who are already invested explore more features *and* retain. Reports adoption is a symptom of engagement, not a cause of retention.
>
> The test: force adoption via an experiment. Teams that do this routinely find the effect collapses from 55pp to 2–3pp. The remaining 2–3pp is the real, causal effect — still worth having, and one-twentieth of the headline claim.

Classic confounders in business data: **tenure** (older customers differ in everything), **engagement**, **customer size**, **acquisition channel**, and **seasonality**.

### Selection effects

Related to confounding but distinct: the *sample itself* was chosen in a way that creates the correlation.

> "Our premium customers are happier." — People who were already happy chose to upgrade.
>
> "Users who saw the banner converted 3× better." — The banner appeared on the checkout page, so only users already near purchase saw it.

### Coincidence and spurious correlation

Test enough pairs of time series and you will find strong correlations between unrelated things. Two variables that both trend upward over time will correlate strongly regardless of any relationship — which is why time-series correlations should be computed on **changes** (differences) rather than levels.

## Simpson's paradox

A relationship that holds in every subgroup can reverse when the groups are pooled.

> [!EXAMPLE]
> A company tests a new onboarding flow.
>
> | Segment | Old flow | New flow |
> | --- | --- | --- |
> | Small business | 6.0% (60/1000) | **7.0%** (140/2000) |
> | Enterprise | 20.0% (400/2000) | **22.0%** (220/1000) |
> | **Combined** | **15.3%** (460/3000) | **12.0%** (360/3000) |
>
> The new flow wins in both segments and loses overall — because it was shown mostly to small businesses, which convert far lower to begin with. The pooled number reflects the mix, not the flow.
>
> This is why sample ratio mismatch matters so much in [A/B testing](../ab-testing/), and why you always check headline results by segment.

## Establishing causation without an experiment

Randomisation is the gold standard. When it is impossible, strengthen an observational claim with:

**Bradford Hill-style criteria** (originally from epidemiology, entirely applicable here):

- **Strength** — is the association large?
- **Consistency** — does it appear in different periods, segments, markets?
- **Temporality** — does the cause reliably precede the effect?
- **Dose-response** — does more X give more Y?
- **Plausibility** — is there a credible mechanism?
- **Coherence** — does it fit everything else you know?

**Quasi-experimental designs:**

| Method | Idea | Key assumption |
| --- | --- | --- |
| Difference-in-differences | Compare change over time in treated vs untreated groups | Parallel trends absent treatment |
| Matching / propensity scores | Compare treated units to similar untreated ones | No unobserved confounders |
| Instrumental variables | Use a variable that affects X but not Y directly | Valid, strong instrument |
| Regression discontinuity | Compare either side of a sharp cutoff | Units cannot manipulate the cutoff |

Every one of these rests on an assumption that cannot be verified from the data alone. **State the assumption whenever you present the result.** An analyst who says "this assumes the two groups would have trended together" is far more credible than one who does not.

## Language discipline

How you write about a finding shapes how it gets used two meetings later, when your caveats have been dropped.

| Instead of | Write |
| --- | --- |
| "Feature X drives retention" | "Feature X users retain 55pp better; this is uncontrolled for engagement" |
| "Email caused the lift" | "Sales rose 12% in the week after the email; no control group was held out" |
| "A causes B" | "A is associated with B; the most likely confounder is C" |

> [!TIP]
> When someone presents a causal claim from observational data, the single most useful question is: **"who chose to be in the treated group, and why?"** If the answer is "they chose themselves", you are looking at selection, not causation.

## Key takeaways

- Four explanations for any correlation: X→Y, Y→X, a confounder, or chance.
- Feature-adoption analyses are dominated by engagement confounding; expect effects to shrink 10-20× under experiment.
- $r$ captures only linear association, is outlier-sensitive, and $r²$ is the variance explained.
- Simpson's paradox means pooled results can reverse subgroup results — always check segments.
- Without randomisation, use diff-in-diff, matching or RD, and state the assumption explicitly.
- Write findings in language that survives being repeated without your caveats.

```quiz
[
  {
    "q": "Users of your Reports feature retain at 82% vs 27% for non-users. What is the most likely explanation?",
    "options": [
      "Reports strongly causes retention",
      "Engagement confounds both — invested users adopt more features and also retain",
      "Retention causes Reports usage directly",
      "The correlation is a coincidence"
    ],
    "answer": 1,
    "explain": "Self-selected feature adoption is dominated by engagement confounding. Experiments that force adoption typically find a fraction of the observational effect."
  },
  {
    "q": "A new onboarding flow wins in both the SMB and Enterprise segments but loses overall. What is happening?",
    "options": [
      "A calculation error",
      "Simpson's paradox — the segment mix differs between the two groups",
      "The sample is too small",
      "The segments were defined incorrectly"
    ],
    "answer": 1,
    "explain": "When the treated group is weighted toward a lower-converting segment, the pooled comparison reflects the mix rather than the treatment effect."
  },
  {
    "q": "Which question best exposes selection bias in an observational causal claim?",
    "options": [
      "What is the sample size?",
      "Who chose to be in the treated group, and why?",
      "What is the p-value?",
      "Was the data collected recently?"
    ],
    "answer": 1,
    "explain": "If units selected themselves into treatment, the reasons for that choice usually also drive the outcome — that is selection, not causation."
  }
]
```
