---
title: A/B Testing in Practice
description: Designing, sizing, running and reading an online experiment — including the pitfalls of peeking, novelty effects and Simpson's paradox.
order: 7
difficulty: Intermediate
tags: [experimentation, ab-testing, statistics, causal]
---

A/B testing is the most reliable causal tool available to a business analyst. Randomisation makes the two groups statistically identical in every respect except the treatment, so a difference in outcome can be attributed to the treatment. That property is worth protecting carefully — nearly every A/B testing failure is a failure of randomisation or of discipline, not of statistics.

## Designing the test

**1. One clear hypothesis.** "Moving the CTA above the fold will increase add-to-cart rate, because currently 40% of mobile users never scroll past the hero." A mechanism makes the result interpretable either way.

**2. One primary metric.** Pre-registered. Secondary metrics are for diagnosis, not for declaring victory.

**3. Guardrail metrics.** What must not degrade: revenue per session, page load time, refund rate, support contacts. A conversion win that tanks margin is not a win.

**4. Randomisation unit.** Usually the **user**, not the session or the pageview. If you randomise by session, the same person sees both variants, which contaminates the comparison and breaks the independence assumption behind your test.

**5. Duration.** At minimum one full business cycle — usually one or two complete weeks. Traffic on Tuesday differs from Sunday, and a test running Monday–Thursday measures weekday users only.

## Sizing the test

The sample size per variant, for comparing two proportions:

$n = \frac{2 × (z_{α/2} + z_β)² × p̄(1-p̄)}{(p_1 - p_2)²}$

At α = 0.05 and 80% power, $(z_{α/2} + z_β)² = (1.96 + 0.84)² ≈ 7.85$.

```python
from statsmodels.stats.power import zt_ind_solve_power
from statsmodels.stats.proportion import proportion_effectsize

baseline = 0.032           # current conversion rate
mde      = 0.10            # smallest lift worth detecting: 10% relative
target   = baseline * (1 + mde)

effect = proportion_effectsize(target, baseline)
n = zt_ind_solve_power(effect_size=effect, alpha=0.05, power=0.80,
                       alternative='two-sided')
print(f"{n:,.0f} users per variant")   # ≈ 51,000 per variant
```

The critical input is the **minimum detectable effect (MDE)**: the smallest lift that would actually change your decision. Because n scales with $1/effect²$, halving the MDE quadruples the required sample.

> [!EXAMPLE]
> Baseline conversion 3.2%, 20,000 users/week.
>
> | Relative lift to detect | Users per variant | Weeks (2 variants) |
> | --- | --- | --- |
> | 20% | ~13,000 | 1.3 |
> | 10% | ~51,000 | 5.1 |
> | 5% | ~205,000 | 20.5 |
> | 2% | ~1,280,000 | 128 |
>
> This table is the most useful thing to bring to an experiment planning meeting. It converts "let's test everything" into an honest conversation about what is testable at your traffic level. Below a certain size, small effects are simply not measurable and should be decided on judgement instead.

## Validity checks before reading results

**Sample ratio mismatch (SRM).** You split 50/50 but observe 50.8/49.2. Run a chi-square test on the split; if p < 0.001, something is broken — a redirect failing, a bot filter applied to one arm, differential tracking loss. **Stop and fix, do not analyse.** SRM is the single most valuable automated check in an experimentation platform.

**A/A test.** Run the same experience against itself. You should see no significant difference (about 5% of the time you will, which is exactly the point). Regular A/A tests validate your infrastructure.

**Pre-period comparison.** The groups should have been indistinguishable *before* the test started. If they were not, randomisation failed.

## Reading the results

Report all three of these together:

1. **Effect size** — absolute (+0.4pp) and relative (+12.5%).
2. **Confidence interval** — [0.1pp, 0.7pp].
3. **Practical threshold** — the lift needed to justify the cost.

Then decide with the interval, not the p-value. If the whole interval sits above your threshold, ship. If it straddles zero, you learned the effect is not large — which is genuinely useful information.

> [!TIP]
> Translate results into annual money before presenting. "+0.4pp conversion on 2.4M annual sessions at ₹1,850 AOV ≈ ₹1.8 crore of incremental revenue" lands very differently from "p = 0.03".

## The pitfalls

**Peeking.** Checking results daily and stopping when p < 0.05 inflates your false positive rate from 5% to 20–30%. Every look is another chance to catch a random fluctuation.

*Fixes:* commit to the sample size in advance; or use a **sequential testing** method (mSPRT, always-valid p-values, group sequential boundaries) that is designed for continuous monitoring.

**Novelty and primacy effects.** Regular users react to *change*, not to the design. A new UI can lift engagement for a week and then decay; or existing users are temporarily worse off because they knew the old layout. Segment new versus returning users, and check whether the effect is stable across the test window.

**Simpson's paradox.** The treatment wins in every segment yet loses overall (or vice versa), because the segment mix differs between arms. Almost always caused by an SRM or a segment-specific rollout. Always check headline results against the main segments.

**Interference between arms.** Randomisation assumes one user's treatment does not affect another's outcome. This breaks in marketplaces (a discount to buyers in arm A consumes inventory that arm B needed), social networks and anything with shared supply. Fixes involve cluster or switchback randomisation.

**Multiple metric testing.** Twenty metrics, α = 0.05, one false winner guaranteed. Pre-register the primary metric.

**Stopping early on a "clear loser."** Symmetric to peeking, and equally invalid, though usually more forgivable when the loss is large and expensive.

## When you cannot randomise

Sometimes an A/B test is impossible — pricing changes, brand campaigns, features that cannot be split. Quasi-experimental alternatives:

- **Difference-in-differences.** Compare the before/after change in a treated group against the change in an untreated control group over the same period. Requires the "parallel trends" assumption: absent treatment, both groups would have moved together.
- **Regression discontinuity.** Exploit a sharp cutoff (customers above ₹10,000 spend get a perk) and compare just either side of it.
- **Synthetic control.** Build a weighted combination of untreated units that tracks the treated unit's pre-period, then compare after.
- **Interrupted time series.** Model the pre-period trend and measure the deviation after the change.

All of these are weaker than randomisation. State the assumption each one rests on when you present it.

## An experiment readout template

```text
EXPERIMENT:  CTA above the fold (mobile web)
HYPOTHESIS:  40% of mobile users never scroll to the CTA; moving it up
             will raise add-to-cart rate.
DESIGN:      50/50 by user_id · 14 days · 2 full weeks
PRIMARY:     Add-to-cart rate.  MDE 5% relative, 80% power.
GUARDRAILS:  Revenue/session, page load p95, refund rate.

VALIDITY:    SRM check p = 0.62 ✓ · pre-period balanced ✓

RESULT:      Control 8.10% · Treatment 8.58%
             Absolute +0.48pp · Relative +5.9%
             95% CI [+0.14pp, +0.82pp] · p = 0.006
GUARDRAILS:  Revenue/session +1.2% (ns) · load p95 unchanged ✓
SEGMENTS:    Stable across new/returning, iOS/Android, all weeks.

DECISION:    Ship. Estimated +₹1.8 crore annualised revenue.
             Monitor for 4 weeks for decay.
```

## Key takeaways

- Randomise by user, run for whole business cycles, pre-register one primary metric plus guardrails.
- Sample size scales with $1/MDE²$ — small effects are often untestable at real traffic levels.
- Always check for sample ratio mismatch before reading any result.
- Peeking inflates false positives; fix the sample size in advance or use sequential methods.
- Report effect size and confidence interval in business units, not p-values alone.
- Without randomisation, use diff-in-diff or synthetic control — and state the assumptions.

```quiz
[
  {
    "q": "You planned a 14-day test but see p = 0.04 on day 4 and stop. What is the problem?",
    "options": [
      "Nothing — significance is significance",
      "Peeking inflates the false positive rate well above the nominal 5%",
      "Four days is always enough",
      "The confidence interval becomes too narrow"
    ],
    "answer": 1,
    "explain": "Repeatedly testing as data accumulates gives many chances to catch a random fluctuation. Fixed-horizon tests must run to their planned size, or you need sequential methods designed for continuous monitoring."
  },
  {
    "q": "Your 50/50 test shows 50.9% of users in control and 49.1% in treatment, with millions of users. What should you do?",
    "options": [
      "Nothing, the split is close enough",
      "Investigate — this is a sample ratio mismatch indicating a broken assignment or tracking pipeline",
      "Reweight the groups and analyse",
      "Extend the test until the split evens out"
    ],
    "answer": 1,
    "explain": "At large n a 1.8pp deviation from a 50/50 split is essentially impossible by chance. SRM signals a real defect, and results should not be trusted until it is resolved."
  },
  {
    "q": "Baseline conversion is 3.2% and you want to detect a 5% relative lift instead of 10%. What happens to the required sample size?",
    "options": ["It halves", "It stays the same", "It roughly doubles", "It roughly quadruples"],
    "answer": 3,
    "explain": "Required n scales with the inverse square of the effect size, so halving the detectable effect multiplies the required sample by about four."
  }
]
```
