---
title: Confidence Intervals
description: What a 95% confidence interval actually means, how to compute one for means and proportions, and why reporting an interval beats reporting a point estimate.
order: 5
difficulty: Intermediate
tags: [statistics, inference, uncertainty]
---

A point estimate without an interval is an overconfident claim. "Conversion is 3.2%" invites a decision; "conversion is 3.2%, plausibly between 2.6% and 3.8%" invites the *right* decision, because it shows whether the difference you care about is even distinguishable from noise.

## What a confidence interval is

A 95% confidence interval is a range constructed so that, **if you repeated the sampling process many times, 95% of the intervals produced would contain the true population parameter**.

The confidence is a property of the *procedure*, not of any one interval. Your specific interval either contains the true value or it does not.

> [!WARNING]
> "There is a 95% probability the true value is in this interval" is the standard misinterpretation. In frequentist statistics the parameter is fixed, not random — it does not have a probability of being anywhere. (A Bayesian **credible interval** does support that reading, which is one reason people find Bayesian intervals more intuitive.)
>
> For practical purposes the distinction rarely changes a business decision, but stating it correctly in an interview or a document marks you as someone who understands what they are computing.

## Confidence interval for a mean

$x̄ ± t_{α/2, n-1} × s/\sqrt{n}$

Where $s/\sqrt{n}$ is the standard error and $t$ is the critical value from the t-distribution with $n-1$ degrees of freedom.

Use **t** rather than z when the population standard deviation is unknown — which is always, in practice. For n above roughly 30 they are nearly identical (t → 1.96 as n grows), but t is never wrong.

> [!EXAMPLE]
> 250 support tickets, mean resolution time 4.2 hours, sd 2.8 hours.
>
> $SE = 2.8/\sqrt{250} = 0.177$
> $t_{0.025, 249} ≈ 1.97$
> $CI = 4.2 ± 1.97 × 0.177 = [3.85, 4.55]$ hours.
>
> If the SLA target is 4 hours, note that the interval **straddles it**. You cannot conclude the target is being missed. That is a materially different message from "average resolution is 4.2 hours, we are over target."

## Confidence interval for a proportion

$p̂ ± z_{α/2} × \sqrt{p̂(1-p̂)/n}$

Valid when $np̂ ≥ 10$ and $n(1-p̂) ≥ 10$. For rare events or small samples, use the **Wilson score interval** instead — the normal approximation misbehaves near 0 and 1, producing intervals that extend below zero.

> [!EXAMPLE]
> 4,200 visitors, 134 conversions. $p̂ = 3.19\%$.
>
> $SE = \sqrt{0.0319 × 0.9681 / 4200} = 0.00271$
> $CI = 3.19\% ± 1.96 × 0.271\% = [2.66\%, 3.72\%]$
>
> Last month was 3.05%. Since that sits comfortably inside the interval, **this month is not distinguishable from last month.** No investigation needed.

That last line is the everyday value of confidence intervals: they tell you when *not* to spend a day investigating.

## What changes the width

$width ∝ z × s / \sqrt{n}$

| Change | Effect on width |
| --- | --- |
| Quadruple sample size | Half as wide |
| 95% → 99% confidence | ~31% wider |
| 95% → 90% confidence | ~16% narrower |
| Double the variability | Twice as wide |

Higher confidence is not free: it buys certainty with precision. A 99.9% interval is often so wide it excludes no interesting hypothesis, which makes it useless for decisions.

```python
import numpy as np
from scipy import stats

def mean_ci(data, confidence=0.95):
    """Confidence interval for a mean using the t-distribution."""
    data = np.asarray(data)
    n = len(data)
    mean = data.mean()
    se = data.std(ddof=1) / np.sqrt(n)
    margin = se * stats.t.ppf((1 + confidence) / 2, df=n - 1)
    return mean, (mean - margin, mean + margin)

def proportion_ci(successes, n, confidence=0.95):
    """Wilson score interval — reliable for small n and extreme proportions."""
    z = stats.norm.ppf((1 + confidence) / 2)
    p = successes / n
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    margin = z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / denom
    return centre - margin, centre + margin
```

## Confidence intervals for a difference

Usually the business question is about a *difference* between two groups, so build the interval on the difference directly:

$(x̄_A - x̄_B) ± t × \sqrt{s_A²/n_A + s_B²/n_B}$

If that interval excludes zero, the difference is statistically significant at that level. This is equivalent to a two-sample t-test but far more informative, because it also tells you **how big** the difference plausibly is.

> [!TIP]
> Prefer intervals on differences over p-values in business reporting. "Variant B lifts conversion by 0.4pp, 95% CI [0.1pp, 0.7pp]" tells a product manager everything: it is positive, and it is worth somewhere between a little and quite a lot. A bare "p = 0.03" tells them nothing about magnitude.

## Overlapping intervals: a common trap

If two 95% intervals overlap, it does **not** follow that the difference is insignificant. The correct test is on the interval of the *difference*, which is narrower than the naive comparison of two separate intervals suggests.

Two groups whose individual CIs overlap slightly can still have a difference whose CI clearly excludes zero. Always compute the interval on the difference rather than eyeballing two error bars.

## Practical guidance

- **Report an interval whenever a decision depends on the estimate.** For an exploratory count in a data pull, skip it.
- **Round honestly.** [2.66%, 3.72%] not [2.6612%, 3.7188%]. The precision is not real.
- **Show intervals on charts** as error bars or a shaded band — the visual makes noise obvious in a way a table does not.
- **State the practical threshold alongside.** An interval of [0.1%, 0.3%] lift is significant and possibly worthless if you need 1% to justify the engineering cost.
- **Remember the interval only covers sampling error.** It says nothing about selection bias, instrumentation bugs or a broken tracking pixel.

## Key takeaways

- 95% confidence describes the long-run behaviour of the procedure, not the probability for one interval.
- Use t for means, Wilson for proportions with small n or extreme rates.
- Width shrinks with $\sqrt{n}$; higher confidence trades precision for certainty.
- Build the interval on the *difference* when comparing groups; overlapping CIs are not a valid test.
- Intervals quantify sampling error only — bias sits entirely outside them.

```quiz
[
  {
    "q": "A 95% confidence interval for conversion is [2.66%, 3.72%]. Which statement is correct?",
    "options": [
      "There is a 95% probability the true rate is between 2.66% and 3.72%",
      "If we repeated this sampling procedure many times, 95% of such intervals would contain the true rate",
      "95% of customers convert within this range",
      "The true rate is definitely in this interval"
    ],
    "answer": 1,
    "explain": "Confidence is a property of the procedure across repeated samples. Any single interval either contains the parameter or does not."
  },
  {
    "q": "Your CI for mean resolution time is [3.85, 4.55] hours and the SLA target is 4 hours. What should you report?",
    "options": [
      "The SLA is being missed",
      "The SLA is being met",
      "The data cannot distinguish performance from the 4-hour target",
      "The sample is invalid"
    ],
    "answer": 2,
    "explain": "The interval straddles 4 hours, so the evidence is compatible with being above or below target. Reporting either direction as fact overstates what the data supports."
  },
  {
    "q": "Two groups' 95% confidence intervals overlap slightly. What can you conclude about the difference?",
    "options": [
      "The difference is definitely not significant",
      "The difference is definitely significant",
      "Nothing — you must compute the confidence interval on the difference itself",
      "The samples are too small"
    ],
    "answer": 2,
    "explain": "Overlapping individual intervals do not imply an insignificant difference. The CI on the difference is narrower and is the correct test."
  }
]
```
