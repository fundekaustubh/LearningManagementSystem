---
title: Statistics
description: Formulas, test selection and thresholds for everyday analytical work.
order: 1
---

## Descriptive statistics

| Statistic | Formula | Use |
| --- | --- | --- |
| Mean | $Σx / n$ | Symmetric data |
| Median | Middle value | Skewed data — the business default |
| Std dev (sample) | $\sqrt{Σ(x-x̄)²/(n-1)}$ | Spread in original units |
| Variance | $s²$ | Intermediate for tests |
| Coefficient of variation | $s / x̄$ | Compare volatility across scales |
| IQR | $Q3 - Q1$ | Robust spread |
| Z-score | $(x - x̄) / s$ | Standardised distance from mean |

**Outlier rule (IQR):** outside $Q1 - 1.5×IQR$ to $Q3 + 1.5×IQR$.

## Standard error and sample size

| Quantity | Formula |
| --- | --- |
| SE of the mean | $σ/\sqrt{n}$ |
| SE of a proportion | $\sqrt{p(1-p)/n}$ |
| SE of a difference in means | $\sqrt{s_A²/n_A + s_B²/n_B}$ |
| 95% CI (mean) | $x̄ ± t_{.025,n-1} × SE$ |
| 95% CI (proportion) | $p̂ ± 1.96 × SE$ |

**Sample size for a proportion** at 95% confidence, worst case p = 0.5:

| Margin of error | n |
| --- | --- |
| ±5% | 385 |
| ±3% | 1,068 |
| ±2% | 2,401 |
| ±1% | 9,604 |

To halve the margin of error, quadruple n.

## Critical values

| Confidence | Two-tailed z |
| --- | --- |
| 80% | 1.28 |
| 90% | 1.645 |
| 95% | 1.96 |
| 99% | 2.576 |
| 99.9% | 3.291 |

## Choosing a test

| Question | Test |
| --- | --- |
| One mean vs a target | One-sample t-test |
| Two independent means | Welch's t-test (default) |
| Paired measurements | Paired t-test |
| 3+ group means | ANOVA + post-hoc |
| Two proportions | Two-proportion z / chi-square |
| Categorical association | Chi-square independence |
| Non-normal, two groups | Mann-Whitney U |
| Non-normal, paired | Wilcoxon signed-rank |
| Correlation (linear) | Pearson |
| Correlation (monotonic) | Spearman |

## A/B test sizing

$n = \frac{2 × 7.85 × p̄(1-p̄)}{(p_1 - p_2)²}$ per variant, at α = 0.05 and 80% power.

| Baseline | Relative lift | n per variant |
| ---: | ---: | ---: |
| 3% | 20% | ~13,000 |
| 3% | 10% | ~51,000 |
| 3% | 5% | ~205,000 |
| 10% | 10% | ~14,700 |
| 10% | 5% | ~58,500 |

## Effect size

| Measure | Small | Medium | Large |
| --- | --- | --- | --- |
| Cohen's d | 0.2 | 0.5 | 0.8 |
| Correlation r | 0.1 | 0.3 | 0.5 |
| Cramér's V | 0.1 | 0.3 | 0.5 |

## Interpretation reminders

- p-value = P(data this extreme | null true). **Not** P(null true).
- Statistical significance ≠ practical significance.
- Failing to reject ≠ proving no effect.
- Overlapping CIs ≠ no significant difference — test the difference itself.
- Correct for multiple comparisons, or pre-register one primary metric.
