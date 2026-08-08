---
title: Sampling and the Central Limit Theorem
description: Why a sample of 1,000 can describe a million people, what the standard error really measures, and the sampling biases that ruin analyses.
order: 4
difficulty: Intermediate
tags: [statistics, sampling, clt, inference]
---

Analysts almost never have the whole population. You have last quarter's customers, not all future customers; the users who responded, not all users. Statistical inference is the discipline of saying something defensible about the whole from a part — and of knowing how wrong you might be.

## Population, sample, parameter, estimate

- **Population** — everything you want to conclude about (all customers).
- **Sample** — the subset you measured (2,000 surveyed customers).
- **Parameter** — the true population value, usually written with Greek letters ($μ$, $σ$, $p$). Unknown.
- **Estimate/statistic** — what you compute from the sample ($x̄$, $s$, $p̂$). Known, and wrong by some amount.

The entire enterprise is: how far is the estimate from the parameter, and how confident can I be about that distance?

## Sampling methods

| Method | How | When to use |
| --- | --- | --- |
| Simple random | Everyone equally likely | The default; needs a complete list |
| Stratified | Split into groups, sample within each | When groups differ and you need all represented |
| Cluster | Randomly select whole groups | When reaching individuals is expensive |
| Systematic | Every kth record | Convenient; dangerous if the list has periodicity |
| Convenience | Whoever is easy to reach | Almost never defensible |

**Stratified sampling** deserves special attention in business settings. If 5% of your customers are enterprise accounts but generate 60% of revenue, a simple random sample of 500 gets ~25 of them — too few to say anything. Stratify: sample enterprise and SMB separately, then reweight when combining.

## Sampling bias — the error no sample size fixes

Increasing n reduces *random* error. It does nothing about *systematic* error. A biased sample of a million is worse than an unbiased sample of a thousand, because the large one gives you false confidence.

- **Selection bias.** The sampling frame excludes part of the population. Surveying only app users about a website redesign.
- **Non-response bias.** Responders differ from non-responders. Satisfaction surveys are answered disproportionately by the delighted and the furious; the indifferent middle is invisible.
- **Survivorship bias.** Only successes remain in the data. "Our customers love us" from a survey of active customers omits everyone who left.
- **Voluntary response bias.** Self-selected participants have stronger opinions than average.

> [!WARNING]
> The classic case: in 1936 the *Literary Digest* polled 2.4 million people and predicted Landon would beat Roosevelt. He lost in a landslide. The sample came from car and telephone owners — wealthier than average during the Depression. Two point four million respondents could not fix a broken frame.

> [!TIP]
> Before trusting any sample, ask: **who could not possibly appear in this data?** That question catches most sampling bias.

## The sampling distribution

Take a sample of size n, compute the mean, write it down. Repeat many times. The distribution of those means is the **sampling distribution of the mean**.

It has three properties that make inference possible:

1. It is **centred on the true population mean** — the sample mean is unbiased.
2. Its spread, the **standard error**, is $SE = σ/\sqrt{n}$.
3. It is **approximately normal for large n, regardless of the population's shape** — the Central Limit Theorem.

## The Central Limit Theorem

The CLT is why statistics works on messy business data. Order values may be wildly skewed with a long tail; the *average* order value across 1,000 orders is still approximately normally distributed.

**How large must n be?** The often-quoted n ≥ 30 assumes mild skew. Realistically:

- Roughly symmetric data: n ≈ 15–20 suffices.
- Moderately skewed (most business data): n ≈ 50–100.
- Heavily skewed / power-law (revenue per customer): several hundred to thousands, and sometimes the CLT is impractical — use the median or bootstrap instead.

> [!WARNING]
> The CLT does **not** normalise your data. It normalises the *sampling distribution of the mean*. Individual order values remain skewed no matter how many you collect.

## Standard error and the square-root law

$SE = σ/\sqrt{n}$

The square root is the most important practical fact in sampling:

| Sample size | Relative SE |
| --- | --- |
| 100 | 1.00× |
| 400 | 0.50× |
| 1,600 | 0.25× |
| 10,000 | 0.10× |

**To halve your uncertainty you must quadruple your sample.** This is why a national poll of 1,000 has a ±3% margin and going to ±1.5% requires 4,000 — and why "just collect more data" gets expensive fast. It is also why national polls of 1,000 people work at all: population size barely enters the formula.

> [!EXAMPLE]
> Average order value in a sample of 400 orders: ₹1,850, sample sd ₹600.
>
> $SE = 600/\sqrt{400} = ₹30$
>
> A 95% confidence interval is roughly ₹1,850 ± 1.96 × 30 = **₹1,791 to ₹1,909**.
>
> To narrow that to ±₹15 you would need 1,600 orders.

Note that the population size does not appear. A sample of 400 is about as informative for 50,000 customers as for 5 million — as long as it is genuinely random.

## Sample size planning

For a proportion, the required n for margin of error $E$ at 95% confidence:

$n = 1.96² × p(1-p) / E²$

Using p = 0.5 (the most conservative value) gives the familiar results:

| Margin of error | Required n |
| --- | --- |
| ±5% | 385 |
| ±3% | 1,068 |
| ±2% | 2,401 |
| ±1% | 9,604 |

For comparing two groups in an experiment, see [A/B Testing](../ab-testing/) — the calculation there depends on the effect size you care about detecting.

## Bootstrapping

When the formula is unknown or assumptions are shaky — a median, a 90th percentile, a ratio of two metrics — resample instead.

1. Draw a sample of size n **with replacement** from your data.
2. Compute the statistic.
3. Repeat 10,000 times.
4. The 2.5th and 97.5th percentiles of those values form a 95% confidence interval.

```python
import numpy as np

def bootstrap_ci(data, statistic=np.median, n_boot=10000, alpha=0.05):
    """Percentile bootstrap confidence interval for any statistic."""
    rng = np.random.default_rng(42)
    data = np.asarray(data)
    estimates = [
        statistic(rng.choice(data, size=len(data), replace=True))
        for _ in range(n_boot)
    ]
    lower = np.percentile(estimates, 100 * alpha / 2)
    upper = np.percentile(estimates, 100 * (1 - alpha / 2))
    return lower, upper

# 95% CI for the median order value
print(bootstrap_ci(order_values))
```

The bootstrap makes almost no distributional assumptions and works for statistics with no closed-form standard error. It still cannot rescue a biased sample — it resamples the bias faithfully.

## Key takeaways

- Random error shrinks with n; systematic bias does not shrink at all.
- Ask "who cannot appear in this data?" to detect sampling bias.
- The CLT makes sample *means* normal even when the data is not.
- $SE = σ/\sqrt{n}$: quartering uncertainty costs 16× the sample.
- Population size barely matters — 1,000 is 1,000 whether the population is 50,000 or 50 million.
- Bootstrap when you need a CI for a median, percentile or ratio.

```quiz
[
  {
    "q": "You currently sample 400 customers and want to halve your margin of error. How many do you need?",
    "options": ["800", "1,200", "1,600", "4,000"],
    "answer": 2,
    "explain": "Standard error scales with 1/sqrt(n), so halving it requires quadrupling n: 400 x 4 = 1,600."
  },
  {
    "q": "A satisfaction survey emailed to all customers gets a 4% response rate. What is the biggest threat to validity?",
    "options": [
      "The sample is too small",
      "Non-response bias — responders likely differ systematically from non-responders",
      "The CLT does not apply",
      "The confidence interval will be too narrow"
    ],
    "answer": 1,
    "explain": "At 4% response, respondents are self-selected — typically the very happy and very unhappy. No sample size fixes that; the frame itself is biased."
  },
  {
    "q": "Order values are heavily right-skewed. Does the CLT let you use a normal-based confidence interval for the mean?",
    "options": [
      "No, the data must be normal first",
      "Yes, for a large enough sample the sampling distribution of the mean is approximately normal",
      "Only after removing outliers",
      "Only if the median equals the mean"
    ],
    "answer": 1,
    "explain": "The CLT applies to the sampling distribution of the mean, not to the raw data. Heavier skew simply requires a larger n before the approximation is good."
  }
]
```
