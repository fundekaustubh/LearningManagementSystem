---
title: Financial Analytics for Non-Finance Analysts
description: Reading a P&L, unit economics, contribution margin, cash vs profit, and the variance analysis that explains why the numbers missed plan.
order: 4
difficulty: Intermediate
tags: [finance, applied, unit-economics, margin]
---

An analyst who understands the P&L asks better questions than one who does not. Knowing that gross margin on hardware is 18% and on services 62% changes which growth you recommend chasing — and it is the difference between an analyst who reports numbers and one who is invited to the planning meeting.

## The income statement, top to bottom

```text
  Revenue                              ₹100.0    Gross sales, net of returns
− Cost of goods sold (COGS)            − 42.0    Direct costs of delivery
─────────────────────────────────────────────
= Gross profit                         ₹ 58.0    58% gross margin
− Sales & marketing                    − 22.0
− Research & development               − 15.0
− General & administrative             −  9.0
─────────────────────────────────────────────
= Operating profit (EBIT)              ₹ 12.0    12% operating margin
− Interest                             −  2.0
− Tax                                  −  3.0
─────────────────────────────────────────────
= Net profit                           ₹  7.0    7% net margin
```

**Gross margin** is the most diagnostic single number. It tells you how much of each rupee of revenue is available to cover everything else. Software: 70–85%. Retail: 20–40%. Distribution: 5–15%. A business model change usually shows up in gross margin before anywhere else.

**EBITDA** adds back depreciation and amortisation to approximate operating cash generation. Widely used, and worth knowing it excludes real costs — the equipment does wear out.

## Fixed, variable and contribution margin

**Variable costs** scale with volume: materials, payment processing, shipping, cloud usage per customer.
**Fixed costs** do not, within a range: rent, salaries, software licences.

$Contribution\ margin = Revenue - Variable\ costs$

Contribution margin is the money each additional sale contributes toward fixed costs and profit. It is the correct basis for most incremental decisions.

> [!EXAMPLE]
> An order sells for ₹1,000 with ₹600 of variable cost and ₹300 of allocated fixed overhead. Accounting profit is ₹100.
>
> A customer offers ₹800 for a one-off order. Full-cost thinking says reject it — ₹800 is below the ₹900 total cost.
>
> Contribution thinking says accept: it contributes ₹200 toward fixed costs you are paying regardless. **The fixed overhead is not affected by this decision**, so it should not enter it.
>
> The caveats: only if capacity is genuinely spare, and only if it does not cannibalise full-price sales or reset customer price expectations. Both caveats are real, and both are business judgements rather than accounting ones.

**Break-even volume** = Fixed costs ÷ Contribution margin per unit.

## Unit economics

Reduce the business to one customer or one order:

| Metric | Definition | Healthy signal |
| --- | --- | --- |
| CAC | Fully loaded acquisition cost | Falling or stable as you scale |
| ARPU / AOV | Average revenue per user / order | Growing |
| Gross margin % | (Revenue − COGS) / Revenue | Stable or improving |
| Contribution margin per order | Revenue − all variable costs | Positive, growing |
| LTV:CAC | Lifetime value over CAC | 3:1 or better |
| CAC payback | Months to recover CAC from gross profit | Under 12 months |

> [!WARNING]
> A business with negative contribution margin **gets worse as it grows**. Every additional order loses money, and volume cannot fix it. "We'll make it up on volume" only works when contribution margin is positive and fixed costs are the problem. This distinction is worth being able to explain clearly.

## Cash is not profit

Profitable companies fail from running out of cash. The gap comes from timing.

- **Accrual accounting** records revenue when earned, not when collected.
- A sale booked in March, invoiced in April, paid in June is March revenue and June cash.
- **Working capital** — inventory and receivables — consumes cash as you grow. A fast-growing distributor can be profitable on paper and cash-starved every month.

**The cash conversion cycle:**

$CCC = DIO + DSO - DPO$

- **DIO** — days inventory outstanding
- **DSO** — days sales outstanding (collection time)
- **DPO** — days payable outstanding (how long you take to pay)

A negative CCC means you collect from customers before paying suppliers — customers fund your growth. This is the structural advantage behind many successful retail and marketplace businesses, and it is invisible on the income statement.

## Variance analysis

When results miss plan, decompose the gap rather than describing it.

> [!EXAMPLE]
> Revenue plan ₹10 crore, actual ₹9.2 crore. A ₹0.8 crore shortfall.
>
> | Driver | Plan | Actual | Variance |
> | --- | ---: | ---: | ---: |
> | Units sold | 50,000 | 46,000 | −4,000 |
> | Average price | ₹2,000 | ₹2,000 | 0 |
>
> **Volume variance** = (46,000 − 50,000) × ₹2,000 = **−₹0.8 crore**
> **Price variance** = 46,000 × (₹2,000 − ₹2,000) = **₹0**
>
> Entirely a volume problem. Now decompose volume by region, channel and product — the same [issue-tree](../../foundations/framing-business-problems/) approach. A "we missed plan" conversation becomes "the North region's enterprise channel is 3,800 units short", which someone can act on.

Standard decompositions: **price × volume**, **mix effects** (a shift toward lower-margin products), **rate × efficiency** for labour, and **FX** for multi-currency businesses.

## Margin bridges

A waterfall chart explaining a margin change period over period is one of the most valuable exhibits an analyst can produce:

```text
Gross margin Q1                      58.0%
  Product mix shift to hardware      − 2.4pp
  Input cost inflation               − 1.8pp
  Price increases                    + 1.1pp
  Manufacturing efficiency           + 0.6pp
  FX                                 − 0.3pp
────────────────────────────────────────────
Gross margin Q2                      55.2%
```

Each line is a different owner and a different action. "Margin fell 2.8pp" is a fact; this bridge is a plan.

## Reading a balance sheet quickly

Assets = Liabilities + Equity.

Four checks that take a minute:

- **Current ratio** = current assets ÷ current liabilities. Below 1 signals short-term liquidity strain.
- **Receivables growing faster than revenue** — you are selling to people who are not paying.
- **Inventory growing faster than revenue** — demand is being over-forecast, and a write-down is coming.
- **Debt relative to EBITDA** — above ~4× is highly leveraged in most industries.

## Discounting and NPV

For any multi-period investment:

$NPV = \sum_{t=0}^{T} \frac{CF_t}{(1+r)^t}$

Positive NPV means the project creates value at the given discount rate. The discount rate reflects the cost of capital and risk; most companies have an official hurdle rate — ask finance rather than inventing one.

**IRR** is the discount rate at which NPV is zero. Intuitive, but it misleads when cash flows change sign more than once or when comparing projects of very different size. **NPV is the more reliable decision rule.**

## Where analysts add most value in finance

1. **Driver-based forecasting** — model revenue from units, price and retention rather than extrapolating a total.
2. **Cohort-based revenue projection** — far more accurate than growth-rate extrapolation for subscription businesses.
3. **Scenario and sensitivity analysis** — which assumption most changes the answer? That is where the analysis effort belongs.
4. **Reconciliation** — finding why the product database and the finance system disagree. Unglamorous, and consistently the highest-trust work an analyst can do.

## Key takeaways

- Gross margin is the fastest read on a business model; contribution margin drives incremental decisions.
- Negative contribution margin means growth makes things worse.
- Profit and cash differ by timing; the cash conversion cycle explains most of the gap.
- Decompose variances into price, volume and mix before explaining a miss.
- Margin bridges turn a change into an owned action list.
- Prefer NPV to IRR, and use the company's official hurdle rate.

```quiz
[
  {
    "q": "An order sells for ₹800 with ₹600 variable cost and ₹300 allocated fixed overhead. Should you accept it as a one-off with spare capacity?",
    "options": [
      "No — it loses ₹100 against total cost",
      "Yes — it contributes ₹200 toward fixed costs you pay regardless, provided capacity is spare and it does not cannibalise full-price sales",
      "No — never sell below full cost",
      "Yes — fixed costs are irrelevant in all situations"
    ],
    "answer": 1,
    "explain": "Fixed costs are unaffected by this decision, so contribution margin is the right basis. The caveats about spare capacity and cannibalisation are genuine business constraints, not accounting ones."
  },
  {
    "q": "A company is profitable but consistently short of cash while growing fast. What is the most likely explanation?",
    "options": [
      "The accounting is fraudulent",
      "Working capital — inventory and receivables — consumes cash before customers pay",
      "Gross margin is negative",
      "Depreciation is too high"
    ],
    "answer": 1,
    "explain": "Accrual profit records revenue when earned, but growth ties up cash in inventory and receivables. The cash conversion cycle quantifies this timing gap."
  },
  {
    "q": "Revenue missed plan by ₹0.8 crore. Units were 4,000 below plan and average price matched plan exactly. What does this tell you?",
    "options": [
      "It is a pricing problem",
      "It is entirely a volume problem — decompose volume by region, channel and product next",
      "It is a mix problem",
      "The variance cannot be attributed"
    ],
    "answer": 1,
    "explain": "With price variance at zero, the entire gap is volume. The next step is decomposing volume along the dimensions where someone can act."
  }
]
```
