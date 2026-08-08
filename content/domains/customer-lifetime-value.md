---
title: Customer Lifetime Value
description: Computing CLV for contractual and non-contractual businesses, discounting future cash flows, and the mistakes that make CLV numbers useless.
order: 2
difficulty: Intermediate
tags: [clv, ltv, retention, applied, finance]
---

Customer lifetime value is the total profit a customer generates over their relationship with the business. It is the number that makes acquisition spend rational: without it, "is ₹1,200 too much to acquire a customer?" is unanswerable.

## The simple formula

For a subscription business with roughly constant churn:

$CLV = \frac{ARPU × Gross\ margin\ \%}{Monthly\ churn\ rate}$

> [!EXAMPLE]
> ARPU ₹800/month, gross margin 70%, monthly churn 4%.
>
> $CLV = (800 × 0.70) / 0.04 = ₹14,000$
>
> With CAC of ₹3,500, LTV:CAC is 4:1 and payback is 3,500/560 ≈ **6.3 months**. Both healthy.

The $1/churn$ term is average customer lifetime in months — 4% churn implies 25 months. That equivalence is worth remembering: it makes the sensitivity to churn obvious.

> [!WARNING]
> **Use gross margin, not revenue.** CLV on revenue overstates value by whatever your cost of service is, and it is the single most common CLV error. It leads directly to over-spending on acquisition.

## Discounting

Money next year is worth less than money today. For horizons beyond a year:

$CLV = \sum_{t=1}^{T} \frac{M × r^t}{(1+d)^t}$

where M is periodic margin, r is retention rate, d is the discount rate per period, T the horizon.

For an infinite horizon with constant retention this simplifies to:

$CLV = M × \frac{r}{1 + d - r}$

> [!TIP]
> **Cap the horizon at 3 years** for most businesses. Predictions beyond that are dominated by assumptions no one can validate, and a finance team will discount a 10-year CLV to zero credibility. A 36-month CLV is defensible; "lifetime" rarely is.

## Churn is not constant

The simple formula assumes a flat hazard rate, which is nearly always wrong. Real churn is highest early and declines as customers mature — survivors are systematically more committed.

Using an average churn rate therefore **understates** the value of customers who have already survived their first months.

Cohort-based CLV handles this properly by using the observed survival curve:

```sql
WITH cohort_survival AS (
    SELECT cohort_month,
           months_since_signup,
           count(DISTINCT customer_id)                                    AS active,
           count(DISTINCT customer_id)::float
             / first_value(count(DISTINCT customer_id))
               OVER (PARTITION BY cohort_month ORDER BY months_since_signup) AS survival_rate
    FROM   customer_months
    GROUP  BY 1, 2
)
SELECT months_since_signup,
       round(avg(survival_rate)::numeric, 3)                              AS avg_survival,
       round(avg(survival_rate * avg_monthly_margin)::numeric, 0)         AS expected_margin,
       round(sum(avg(survival_rate * avg_monthly_margin))
             OVER (ORDER BY months_since_signup)::numeric, 0)             AS cumulative_clv
FROM   cohort_survival s
JOIN   cohort_margins m USING (cohort_month, months_since_signup)
GROUP  BY months_since_signup
ORDER  BY months_since_signup;
```

## Non-contractual businesses

Retail and e-commerce have no cancellation event — a customer who has not purchased in six months may be gone, or may just be between purchases. You cannot observe churn, only its absence of evidence.

**RFM-based CLV** is the practical approach: use recency, frequency and monetary value to score customers, then estimate value per segment from history. See [RFM Analysis](../rfm-analysis/).

**Probabilistic models** are the rigorous approach. BG/NBD models purchase frequency and dropout; Gamma-Gamma models spend per transaction.

```python
from lifetimes import BetaGeoFitter, GammaGammaFitter

bgf = BetaGeoFitter(penalizer_coef=0.001)
bgf.fit(summary['frequency'], summary['recency'], summary['T'])

# Expected purchases in the next 90 days
summary['predicted_purchases'] = bgf.conditional_expected_number_of_purchases_up_to_time(
    90, summary['frequency'], summary['recency'], summary['T'])

ggf = GammaGammaFitter(penalizer_coef=0.001)
repeat = summary[summary['frequency'] > 0]
ggf.fit(repeat['frequency'], repeat['monetary_value'])

summary['clv_12m'] = ggf.customer_lifetime_value(
    bgf, summary['frequency'], summary['recency'], summary['T'],
    summary['monetary_value'], time=12, freq='D', discount_rate=0.01)
```

These models are well-established and require only transaction logs — no subscription structure.

## Historic vs predictive CLV

**Historic CLV** — what a customer has generated so far. Factual, backward-looking, useless for acquisition decisions on new customers.

**Predictive CLV** — expected total value including the future. Necessary for deciding what to pay to acquire, but only as good as its assumptions.

Report both. Historic CLV validates the model: compare predicted CLV for a cohort acquired 18 months ago against what they actually generated.

## Using CLV

**1. Acquisition budgets.** Bid up to a fraction of CLV, varied by predicted segment value. Paying ₹4,000 for a customer worth ₹20,000 and ₹800 for one worth ₹3,000 is far better than a single blended cap.

**2. Retention prioritisation.** Combine churn probability with CLV. Contact high-value, high-risk customers first — high churn risk on a low-value customer is often not worth the call.

**3. Service levels.** Justify dedicated support for high-CLV accounts with an actual number.

**4. Product decisions.** Which features correlate with high-CLV cohorts? (Correlational — see [Correlation vs Causation](../../statistics/correlation-vs-causation/).)

**5. Company valuation.** CLV × customer count is the basis of customer-equity-based valuation.

## Common mistakes

1. **Using revenue instead of margin.** Overstates value by the entire cost of service.
2. **Ignoring the discount rate** on multi-year horizons.
3. **Assuming constant churn** — understates the value of surviving customers.
4. **Averaging across wildly different segments.** With a power-law distribution, the mean CLV describes nobody. Report by segment and by decile.
5. **Infinite horizons.** Beyond 3 years the number is fiction.
6. **Ignoring acquisition-channel differences.** Customers from different channels have systematically different CLV.
7. **Excluding expansion revenue.** In B2B, upgrades often exceed initial contract value; a CLV without expansion badly understates B2B customers.

> [!WARNING]
> CLV is usually power-law distributed: the top 10% of customers can represent over half of total value. Presenting a single average CLV hides the entire structure. Always show the distribution or at least deciles.

## A practical CLV report

| Segment | Customers | Avg CAC | 12m margin | 36m CLV | LTV:CAC | Payback |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Enterprise | 180 | ₹84,000 | ₹2,40,000 | ₹6,10,000 | 7.3 | 4.2 mo |
| Mid-market | 1,420 | ₹18,500 | ₹52,000 | ₹1,18,000 | 6.4 | 4.3 mo |
| SMB — organic | 8,900 | ₹1,100 | ₹9,400 | ₹19,800 | 18.0 | 1.4 mo |
| SMB — paid | 12,300 | ₹4,200 | ₹7,100 | ₹12,400 | 3.0 | 7.1 mo |
| SMB — discount | 3,600 | ₹3,900 | ₹4,300 | ₹6,900 | 1.8 | 10.9 mo |

The discount segment is barely above break-even once overhead is included — which is exactly the finding that should drive a decision. Note also that SMB-organic has the best ratio by far, which usually means the company should invest more in whatever generates organic signups.

## Key takeaways

- CLV uses gross margin, not revenue, and should be discounted over a capped horizon.
- Constant-churn formulas understate value because churn declines with tenure.
- Non-contractual businesses need RFM or BG/NBD models; churn is unobservable there.
- Report predictive CLV for decisions and historic CLV to validate the model.
- CLV is power-law distributed — always segment, never present a single average.
- Segment-level CLV plus CAC is what makes acquisition budgets rational.

```quiz
[
  {
    "q": "ARPU is ₹800/month, gross margin 70%, monthly churn 4%. What is the simple CLV?",
    "options": ["₹20,000", "₹14,000", "₹2,240", "₹560"],
    "answer": 1,
    "explain": "CLV = (800 x 0.70) / 0.04 = ₹14,000. Using revenue instead of margin would overstate it as ₹20,000."
  },
  {
    "q": "Why does assuming a constant churn rate typically understate CLV for tenured customers?",
    "options": [
      "It overstates gross margin",
      "Real churn is highest early and declines with tenure, so surviving customers have lower forward churn than the average",
      "It ignores the discount rate",
      "Constant churn always overstates CLV"
    ],
    "answer": 1,
    "explain": "Survivors are self-selected for commitment. Applying an average hazard rate that includes early churners to a customer who already survived understates their remaining lifetime."
  },
  {
    "q": "Your CLV distribution shows the top 10% of customers generating 55% of total value. What does this mean for reporting?",
    "options": [
      "Report the mean CLV as the headline number",
      "Report CLV by segment or decile — a single average describes no actual customer",
      "Remove the top 10% as outliers",
      "Use the mode instead"
    ],
    "answer": 1,
    "explain": "With a power-law distribution the mean is pulled far above the typical customer. Segment-level or decile reporting preserves the structure that decisions depend on."
  }
]
```
