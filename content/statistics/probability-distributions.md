---
title: Probability Distributions You Will Actually Use
description: Normal, binomial, Poisson, exponential, uniform and power-law distributions — how to recognise each in business data and what each one implies.
order: 3
difficulty: Intermediate
tags: [statistics, distributions, modelling]
---

A distribution describes how likely each possible value is. Recognising the shape of your data tells you which statistics are valid, which tests apply, and — often — something real about the process that generated it.

## Normal (Gaussian)

The bell curve, defined by mean $μ$ and standard deviation $σ$.

**Where it comes from:** sums or averages of many small independent effects. Heights, measurement errors, and — critically — *sample means of almost anything* (see [Sampling & the CLT](../sampling-and-central-limit-theorem/)).

**The empirical rule:** about 68% of values fall within 1σ of the mean, 95% within 2σ, 99.7% within 3σ.

**Where analysts go wrong:** assuming raw business data is normal. Revenue, order values, session times and company sizes are almost never normal — they are right-skewed and bounded at zero. The normal distribution is symmetric and unbounded, so it will happily assign probability to negative revenue.

> [!TIP]
> The CLT gives you normality of the **sample mean**, not of the data. That is enough for confidence intervals and t-tests on averages, which covers most analyst work. It does not license modelling individual order values as normal.

## Log-normal

If $log(X)$ is normal, X is log-normal. Right-skewed, strictly positive, long-tailed.

This is the **default shape of business data**: revenue per customer, order value, session duration, time to conversion, salaries, company sizes.

It arises from *multiplicative* effects rather than additive ones — each factor multiplies the outcome instead of adding to it. Practical consequence: analyse the log of the variable. Log revenue is roughly symmetric, means are meaningful, and regression assumptions hold much better. Coefficients then read naturally as percentage effects.

## Binomial

Number of successes in $n$ independent trials, each with probability $p$.

$mean = np$, $variance = np(1-p)$

**Business uses:** conversions out of visitors, defective units in a batch, clicks out of impressions, customers accepting an offer.

> [!EXAMPLE]
> 1,000 visitors, historical conversion 3%. Expected conversions = 30, standard deviation = $\sqrt{1000 × 0.03 × 0.97} ≈ 5.4$.
>
> So roughly 95% of weeks should land between about 19 and 41 conversions **with no change to the site at all**. If someone panics about a week with 24 conversions, this calculation is the answer: it is ordinary variation, not a problem to investigate.

This single computation prevents an enormous amount of wasted diagnostic effort. It is the basis of proportion tests in [A/B testing](../ab-testing/).

## Poisson

Number of events in a fixed interval, when events are independent and occur at a constant average rate $λ$.

Key property: $mean = variance = λ$.

**Business uses:** support tickets per hour, website visits per minute, defects per batch, arrivals per time window.

> [!EXAMPLE]
> A call centre receives 12 calls per hour on average. Poisson says the probability of 20 or more calls in an hour is about 1.2% — rare, but it will happen a few times a month across an eight-hour day. Staff for a percentile of the distribution, not for the mean, or you will be understaffed roughly half the time.

**Diagnostic:** if the observed variance is much larger than the mean (**overdispersion**), the constant-rate assumption is broken — usually because the rate varies by hour of day, or events arrive in clusters. Model the rate as varying rather than forcing a single λ.

## Exponential

The waiting time *between* Poisson events, with rate $λ$; mean waiting time is $1/λ$.

**Business uses:** time between purchases, time until churn, machine time-to-failure, inter-arrival times.

Its defining feature is **memorylessness**: having waited 10 minutes tells you nothing about how much longer you will wait. That is often unrealistic — a customer who has not purchased in a year is usually *more* likely to be gone, not equally likely to return. When memorylessness fails, the **Weibull** distribution (which allows the rate to rise or fall over time) is the standard upgrade, and it is the workhorse of survival and churn analysis.

## Uniform

Every value in a range is equally likely. Rare in nature, common by construction: random assignment in experiments, random sampling, simulation inputs.

Useful diagnostic: **p-values under a true null hypothesis are uniformly distributed**. If you run many A/A tests and their p-values are not roughly uniform, your experiment infrastructure is broken.

## Power law / Pareto

$P(X > x) ∝ x^{-α}$. Extremely heavy-tailed — the top few observations dominate the total.

**Business uses:** revenue by customer, sales by SKU, traffic by page, city sizes, wealth. The "80/20 rule" is the popular name.

Implications that matter:

- **The mean is nearly useless** and unstable — it jumps whenever a new extreme value appears.
- **Sample averages converge slowly**, so small samples badly understate the tail.
- **Segment rather than average.** Analyse the top 1% of customers separately; they are a different business.

> [!WARNING]
> Standard deviations and confidence intervals built on normal assumptions are badly wrong for power-law data. If your top customer is 500× the median, do not compute a CI on the mean and present it as a range.

## Choosing a distribution

| What you are measuring | Likely distribution |
| --- | --- |
| Successes out of n trials | Binomial |
| Events per fixed interval | Poisson |
| Time between events | Exponential / Weibull |
| Sample means | Normal (by the CLT) |
| Revenue, order value, duration | Log-normal |
| Revenue by customer, sales by SKU | Power law |
| Random assignment | Uniform |

## Checking the fit

1. **Plot a histogram.** Symmetric? Skewed? Bimodal? Bimodality usually means two mixed populations — split them.
2. **Compare mean and median.** Large gap → skew.
3. **Compare variance and mean for counts.** Variance ≫ mean → overdispersion.
4. **Try a log transform.** If the log looks normal, you have a log-normal.
5. **Plot on log-log axes.** A straight line suggests a power law.

## Key takeaways

- Raw business data is rarely normal; log-normal and power-law shapes dominate.
- The CLT normalises sample means, not individual observations.
- Binomial spread tells you how much week-to-week variation is ordinary noise.
- Poisson assumes a constant rate — overdispersion means the rate varies.
- Exponential assumes memorylessness; Weibull is the realistic upgrade for churn.
- For power-law data, segment the tail instead of reporting an average.

```quiz
[
  {
    "q": "You get 1,000 visitors a week at a 3% conversion rate. Roughly what range of weekly conversions is ordinary variation?",
    "options": ["Exactly 30 every week", "About 19 to 41", "About 28 to 32", "0 to 100"],
    "answer": 1,
    "explain": "Binomial with n=1000, p=0.03: mean 30, sd ≈ 5.4. Two standard deviations either side gives roughly 19-41 with no real change at all."
  },
  {
    "q": "Support tickets average 40 per day, but the variance is 300. What does this suggest?",
    "options": [
      "The data is normally distributed",
      "Overdispersion — the arrival rate is not constant, likely varying by day or clustering",
      "The mean was computed incorrectly",
      "Tickets follow an exponential distribution"
    ],
    "answer": 1,
    "explain": "Poisson requires variance ≈ mean. Variance far above the mean means the constant-rate assumption is violated, usually because the rate varies over time."
  },
  {
    "q": "Revenue per customer follows a power law. Why is the mean a poor summary?",
    "options": [
      "It is mathematically undefined",
      "It is unstable and dominated by a few extreme customers, describing no typical customer",
      "It is always smaller than the median",
      "Power laws have no centre"
    ],
    "answer": 1,
    "explain": "Heavy tails mean a handful of customers dominate the total. The mean jumps with each new extreme value and represents nobody; segmenting the tail is the right approach."
  }
]
```
