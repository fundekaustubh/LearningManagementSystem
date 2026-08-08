---
title: HR and People Analytics
description: Attrition analysis, hiring funnels, compensation equity and engagement — analytics on people, where the ethical constraints are as important as the methods.
order: 6
difficulty: Intermediate
tags: [hr, people-analytics, applied, ethics]
---

People analytics applies the same techniques as the rest of business analytics to workforce questions. What differs is the stakes: the data describes identifiable individuals, sample sizes are small, and a wrong conclusion affects someone's career. The ethical constraints are not an appendix to the methods — they shape which analyses are appropriate at all.

## The core metrics

**Attrition (turnover) rate**

$Annual\ attrition = \frac{Departures\ in\ period}{Average\ headcount} × \frac{12}{months\ in\ period}$

Always split **voluntary** (they left) from **involuntary** (you exited them). Combining them makes the number meaningless — a restructuring and a retention crisis look identical.

**Regretted vs non-regretted attrition** matters even more. Losing 15% of your workforce is a crisis if it is your top performers and healthy if it is planned performance management. Aggregate attrition hides which one you have.

| Metric | Definition | Note |
| --- | --- | --- |
| Voluntary attrition | Resignations ÷ avg headcount | The retention signal |
| Regretted attrition | Departures you wanted to keep ÷ avg headcount | The one that matters |
| Time to fill | Requisition open → offer accepted | Recruiting efficiency |
| Time to productivity | Start date → performance benchmark | Onboarding quality |
| Offer acceptance rate | Offers accepted ÷ offers made | Competitiveness |
| Internal mobility rate | Internal moves ÷ headcount | Career-path health |
| Span of control | Reports per manager | Organisational structure |
| Revenue per employee | Revenue ÷ FTE | Productivity, comparable across peers |

## Attrition analysis done properly

Attrition is a survival problem, not a classification problem. The question is not only *whether* someone leaves but *when*.

```sql
-- Attrition by tenure band — reveals when people actually leave
SELECT CASE WHEN tenure_months <  6 THEN '0-6 months'
            WHEN tenure_months < 12 THEN '6-12 months'
            WHEN tenure_months < 24 THEN '1-2 years'
            WHEN tenure_months < 48 THEN '2-4 years'
            ELSE '4+ years' END                                      AS tenure_band,
       count(*)                                                       AS employees,
       count(*) FILTER (WHERE left_voluntarily)                       AS voluntary_exits,
       round(100.0 * count(*) FILTER (WHERE left_voluntarily)
                   / nullif(count(*), 0), 1)                          AS attrition_pct
FROM   employee_periods
WHERE  period_year = 2026
GROUP  BY 1
ORDER  BY min(tenure_months);
```

Most organisations find two peaks: an early one (6–18 months, usually a hiring or onboarding mismatch) and a later one (2–4 years, usually a career-progression ceiling). These have completely different remedies, and the aggregate rate hides both.

**Cohort analysis** applies directly — see [Cohort and Retention Analysis](../../sql/cohort-and-retention-analysis/). Track retention curves by hiring cohort, source, manager and location. A cohort curve that worsens after a policy change is far more convincing than a correlation.

**Survival analysis** (Kaplan-Meier, Cox proportional hazards) handles the censoring problem properly: employees still present have not left *yet*, and treating them as "did not leave" biases everything.

> [!WARNING]
> **Small sample sizes are the defining constraint of people analytics.** A team of 12 with 3 departures has 25% attrition, and the 95% confidence interval spans roughly 5% to 57%. Reporting that as "Team X has an attrition problem" is statistically indefensible and can end a manager's career.
>
> Set a minimum group size — 30 is a common floor — below which you report nothing broken out.

## Hiring funnel

```text
Applications      12,400   ──────────────────────────────
Screened           3,100   ───────                25.0%
Phone screen         890   ──                     28.7%
Onsite               310   ─                      34.8%
Offer                 96                          31.0%
Accepted              71                          74.0%
```

Analyse it exactly like a marketing funnel: locate the biggest drop, segment by source and role, and check for adverse impact across demographic groups at every stage.

Two additional considerations specific to hiring:

- **Quality of hire, not just speed.** Time-to-fill is easy to measure and easy to game by lowering the bar. Pair it with 12-month retention and performance ratings by source.
- **Source effectiveness varies enormously.** Referrals typically convert and retain better; job boards deliver volume. Evaluate sources on hires-that-stay, not on applications.

## Compensation analysis

Pay equity analysis is the highest-stakes work in people analytics and needs to be done carefully.

The standard approach is a regression of pay on legitimate factors — role, level, location, tenure, performance — with a demographic variable added:

```python
import statsmodels.api as sm

X = pd.get_dummies(df[['job_family', 'level', 'location', 'tenure_years',
                       'performance_rating', 'gender']], drop_first=True)
X = sm.add_constant(X)
model = sm.OLS(np.log(df['base_salary']), X).fit()
# The coefficient on gender_Female is the unexplained pay gap,
# after controlling for the listed factors.
```

Three genuine cautions:

1. **Controlling for level can hide the problem.** If one group is systematically promoted more slowly, controlling for level "explains away" the gap that matters most. Analyse promotion rates separately.
2. **The unexplained gap is not automatically discrimination**, and a zero gap does not prove its absence. It is a screening tool that identifies where to look closely.
3. **Involve legal and HR before you start.** In many jurisdictions these analyses have privilege implications, and running one informally can create problems.

## Engagement surveys

- **Response rate first.** Below ~60%, non-response bias dominates and the results describe the people who chose to answer.
- **Use consistent items over time.** Changing the wording resets the trend.
- **Report distributions, not just averages.** A team split between very high and very low scores averages to "fine" and is not fine.
- **Guarantee and honour anonymity.** Do not report below the minimum group size, ever. One breach ends honest responses permanently.
- **Act visibly.** Surveying without acting reduces future response rates and, measurably, engagement itself.

## The ethical constraints

People analytics can cause real harm, and several tempting analyses should not be done.

**Do not:**
- Build individual attrition-risk scores visible to managers. It creates self-fulfilling prophecies and invites retaliation.
- Use protected characteristics as model features.
- Report metrics for groups small enough to identify individuals.
- Monitor individual productivity in ways employees have not been told about.
- Use engagement scores in individual performance reviews.

**Do:**
- Analyse at the group and systemic level.
- Focus on what the organisation can change: management practices, career paths, workload, compensation structures.
- Be transparent about what data is collected and why.
- Apply a minimum group size consistently, without exceptions for senior requesters.
- Involve HR, legal and works councils early.

> [!WARNING]
> **Proxy discrimination is the specific trap.** Removing gender from a model does not remove its effect if the model includes variables correlated with it — part-time status, career gaps, certain job families. A model can produce discriminatory outcomes with no protected attribute in it at all. Test outcomes by group, not just inputs.

## What people analytics is genuinely good at

The highest-value work here is rarely predictive:

1. **Identifying systemic patterns** — which manager populations, locations or job families show elevated regretted attrition.
2. **Evaluating interventions** — did the new onboarding programme improve 12-month retention, against a comparison group.
3. **Workforce planning** — headcount projections from attrition rates, growth plans and hiring capacity.
4. **Structural questions** — span of control, layer count, internal mobility rates.
5. **Costing the problem** — replacing an employee typically costs 50–200% of annual salary once recruiting, ramp time and lost productivity are included. Quantifying that is what makes retention investment fundable.

## Key takeaways

- Split attrition into voluntary/involuntary and regretted/non-regretted, or the number means nothing.
- Analyse attrition by tenure band and cohort; the peaks have different causes and remedies.
- Small samples dominate — enforce a minimum group size and report confidence intervals.
- Pay equity regression is a screening tool; controlling for level can hide the real gap.
- Engagement results below ~60% response rate reflect responders, not the organisation.
- Analyse systems, not individuals, and test for proxy discrimination in outcomes.

```quiz
[
  {
    "q": "A team of 12 people had 3 voluntary departures this year. What should you report?",
    "options": [
      "This team has a 25% attrition problem",
      "Nothing broken out at that group size — the confidence interval is far too wide to support a conclusion",
      "The team needs immediate intervention",
      "25% attrition, flagged as above average"
    ],
    "answer": 1,
    "explain": "With n=12 the 95% interval for 3 events spans roughly 5% to 57%. Reporting a point estimate at that sample size is statistically indefensible and can unfairly damage a manager."
  },
  {
    "q": "A pay equity regression controls for job level and finds no gap. Why might this be misleading?",
    "options": [
      "Regression cannot be used for pay analysis",
      "If one group is promoted more slowly, controlling for level absorbs exactly the disparity that matters",
      "Log salary should not be used",
      "The sample is always too small"
    ],
    "answer": 1,
    "explain": "Level is downstream of promotion decisions. Controlling for it explains away a promotion-rate disparity, so promotion rates must be analysed separately."
  },
  {
    "q": "What is proxy discrimination in a people analytics model?",
    "options": [
      "Using an incorrect statistical proxy for performance",
      "A model producing discriminatory outcomes through variables correlated with protected characteristics, even when those characteristics are excluded",
      "Delegating an analysis to another team",
      "Using survey data instead of HR records"
    ],
    "answer": 1,
    "explain": "Variables like part-time status or career gaps can encode protected characteristics. Excluding the protected attribute is not sufficient — outcomes must be tested by group."
  }
]
```
