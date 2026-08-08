---
title: Hypothesis Testing
description: Null and alternative hypotheses, p-values, the two error types, statistical power, and which test to run for which business question.
order: 6
difficulty: Intermediate
tags: [statistics, inference, testing, p-value]
---

Hypothesis testing answers one question: **could this result plausibly have happened by chance alone?** It cannot tell you whether a result matters, whether it will persist, or what caused it. Keeping that boundary clear prevents most misuse.

## The framework

1. **State the null hypothesis $H_0$** — the boring explanation. "There is no difference between variants."
2. **State the alternative $H_1$** — what you suspect. "Variant B has a higher conversion rate."
3. **Choose a significance level $α$**, conventionally 0.05.
4. **Compute a test statistic** and its p-value.
5. **Decide.** If p < α, reject the null. Otherwise, fail to reject.

Note the careful phrasing: you never "accept the null". Absence of evidence for a difference is not evidence of no difference — especially with a small sample.

## What a p-value is

**The p-value is the probability of observing data at least as extreme as yours, assuming the null hypothesis is true.**

What it is *not*:

- ❌ The probability the null hypothesis is true
- ❌ The probability your result was a fluke
- ❌ The probability of replication
- ❌ A measure of effect size

> [!WARNING]
> p = 0.03 does **not** mean a 3% chance the null is true. It means: if there were genuinely no effect, you would see data this extreme 3% of the time. Turning that into a statement about the hypothesis requires the base rate — Bayes' theorem again.

A crucial and under-appreciated consequence: with a large enough sample, **any** non-zero difference becomes statistically significant. With 10 million users, a 0.001pp conversion difference will produce p < 0.001 and be completely worthless. Statistical significance is about detectability; practical significance is about whether anyone should care. Report both.

## The two error types

|  | $H_0$ actually true | $H_0$ actually false |
| --- | --- | --- |
| **Reject $H_0$** | Type I error (α) — false positive | Correct — true positive (power) |
| **Fail to reject** | Correct | Type II error (β) — false negative |

- **Type I (α = 0.05):** you ship a change that does nothing. Cost: wasted engineering, a false belief that propagates into future decisions.
- **Type II (β):** you miss a real improvement. Cost: the foregone value, invisible forever.

Which is worse depends entirely on context. For a costly, hard-to-reverse change, guard against Type I. For a cheap experiment where missing a winner is expensive, guard against Type II by increasing power. **α = 0.05 is a convention, not a law**, and choosing it deliberately is a sign of a mature analyst.

## Statistical power

**Power = 1 − β**: the probability of detecting an effect that genuinely exists. The convention is 80%.

Power depends on four things, and fixing any three determines the fourth:

1. **Effect size** — bigger effects are easier to detect.
2. **Sample size** — more data, more power.
3. **Variance** — noisier data, less power.
4. **α** — a stricter threshold reduces power.

> [!WARNING]
> **Underpowered tests are worse than no test.** At 30% power you will miss most real effects, and — less obviously — the effects you *do* detect will be badly overestimated, because only unusually large sample fluctuations clear the threshold. This is the "winner's curse" and it is why underpowered studies produce results that never replicate.

Always run a power calculation **before** collecting data. See [A/B Testing](../ab-testing/) for the sample size formula.

## Choosing a test

| Question | Test |
| --- | --- |
| Is one mean different from a target? | One-sample t-test |
| Are two independent group means different? | Two-sample (Welch's) t-test |
| Are two paired measurements different? | Paired t-test |
| Are three or more group means different? | ANOVA |
| Are two proportions different? | Two-proportion z-test / chi-square |
| Are two categorical variables associated? | Chi-square test of independence |
| Two group medians, non-normal data? | Mann-Whitney U |
| Is a distribution normal? | Shapiro-Wilk, or just look at a histogram |

**Default to Welch's t-test** for comparing two means. It does not assume equal variances, costs almost nothing in power when variances happen to be equal, and is what `scipy` gives you with `equal_var=False`.

```python
from scipy import stats

# Two independent groups — Welch's t-test (does not assume equal variance)
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)

# Two proportions — chi-square on a contingency table
#          converted   not converted
# variant A   [120,        3880]
# variant B   [156,        3844]
table = [[120, 3880], [156, 3844]]
chi2, p, dof, expected = stats.chi2_contingency(table)

# Non-normal data, comparing central tendency
u_stat, p_value = stats.mannwhitneyu(group_a, group_b, alternative='two-sided')
```

## One-tailed vs two-tailed

**Two-tailed** tests for a difference in either direction. **One-tailed** tests only one direction, and has more power for the same sample — because it refuses to detect an effect the other way.

Use one-tailed only when a result in the opposite direction would lead to exactly the same action as no result. That is rarer than people claim. If a new checkout flow *reduced* conversion, you would certainly want to know.

> [!WARNING]
> Choosing one-tailed after seeing the direction of your data is p-hacking. It halves the p-value for free and invalidates the test.

## Multiple comparisons

Test 20 hypotheses at α = 0.05 and you expect one false positive by construction. Test 100 metrics on the same experiment and you will find "significant" results guaranteed.

Corrections:

- **Bonferroni**: use α/m for m tests. Simple, very conservative, loses power quickly.
- **Benjamini-Hochberg (FDR)**: controls the *expected proportion* of false discoveries among rejections. Much better when running many tests.
- **Pre-register one primary metric.** The best defence. Declare the metric before the experiment; everything else is exploratory and labelled as such.

## The garden of forking paths

Even without formally running many tests, flexibility in analysis inflates false positives: trying different segments, excluding outliers, choosing a date range after seeing results, stopping the test when it looks good.

Each choice is defensible individually. Together they guarantee a "significant" finding. The defence is **pre-specification**: write down the metric, population, exclusions and duration before you look at the data.

> [!INTERVIEW]
> A frequent interview question: *"Your A/B test shows p = 0.04. Do you ship?"*
>
> A strong answer covers: (1) what is the effect size and its confidence interval — is it practically meaningful? (2) was the sample size pre-committed, or did we stop when it crossed significance? (3) how many metrics and segments were examined? (4) what does the cost of being wrong look like in each direction? (5) is the mechanism plausible? A bare p-value is not enough to decide.

## Key takeaways

- The p-value is P(data this extreme | null true), not the probability the null is true.
- Statistical significance ≠ practical significance; huge samples make trivial effects significant.
- Balance Type I and Type II errors according to their real business costs.
- Underpowered tests both miss real effects and exaggerate the ones they find.
- Default to Welch's t-test for two means; use one-tailed tests only with a genuine prior justification.
- Correct for multiple comparisons and pre-specify your primary metric.

```quiz
[
  {
    "q": "An A/B test on 8 million users shows a 0.02pp conversion lift with p = 0.001. What is the right conclusion?",
    "options": [
      "Ship it — the p-value is very small",
      "The effect is real but likely too small to be worth the cost; judge practical significance separately",
      "The test is invalid because the sample is too large",
      "There is a 0.1% chance the null is true"
    ],
    "answer": 1,
    "explain": "Very large samples make trivially small effects statistically significant. Statistical significance answers 'is it detectable', not 'is it worth doing'."
  },
  {
    "q": "You run a test at 30% power and get a significant result. What is a known problem with the estimated effect size?",
    "options": [
      "It will be systematically underestimated",
      "It will be systematically overestimated, because only large fluctuations clear the threshold",
      "It will be exactly right",
      "Power does not affect effect size estimates"
    ],
    "answer": 1,
    "explain": "This is the winner's curse. At low power, only unusually large sample fluctuations reach significance, so published effects from underpowered studies are inflated and fail to replicate."
  },
  {
    "q": "You examine 40 metrics on one experiment at α = 0.05 and find 2 significant. What should you suspect?",
    "options": [
      "Both effects are real",
      "About 2 false positives are expected by chance alone at this number of tests",
      "The experiment was underpowered",
      "The α should have been raised"
    ],
    "answer": 1,
    "explain": "40 tests at α = 0.05 yield about 2 false positives on average even with no real effects. This needs a multiple-comparison correction or a pre-specified primary metric."
  }
]
```
