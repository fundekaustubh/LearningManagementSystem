---
title: Marketing Analytics
description: CAC, ROAS, attribution models and the payback period — measuring marketing without being fooled by channels that take credit for organic demand.
order: 1
difficulty: Intermediate
tags: [marketing, applied, cac, attribution]
---

Marketing analytics answers one question repeatedly: **what did we get for that money, and should we spend more?** The difficulty is that marketing channels rarely operate independently, and every platform's own dashboard is incentivised to claim credit.

## The core metrics

**Customer acquisition cost (CAC)**

$CAC = \frac{Total\ acquisition\ spend}{New\ customers\ acquired}$

Include everything: media spend, agency fees, salaries of the acquisition team, creative production, tooling. "Blended CAC" using only media spend understates true cost, often by 40% or more, and comparing your blended CAC to a competitor's fully loaded CAC is meaningless.

**Return on ad spend (ROAS)**

$ROAS = \frac{Revenue\ attributed\ to\ ads}{Ad\ spend}$

ROAS uses *revenue*, so a ROAS of 3 on a 25% gross margin business loses money on every sale. Track **margin-adjusted ROAS** or, better, contribution profit per rupee spent.

**LTV:CAC ratio**

The standard health check. Rules of thumb:

- Below 1:1 — losing money on every customer.
- 1:1 to 3:1 — sustainable only with low overheads.
- 3:1 — commonly cited healthy target.
- Above 5:1 — often a sign you are **under**-investing in growth.

That last point gets missed. A 6:1 ratio with slow growth usually means there is profitable demand you are not buying.

**CAC payback period** — months of gross profit needed to recover CAC. Often more important than LTV:CAC because it determines cash requirements. A 24-month payback can be perfectly healthy on paper and still bankrupt a company that cannot finance the gap.

## Attribution

A customer sees a display ad, searches your brand, clicks a Facebook ad, reads a review, then converts through an email. **Which channel gets the credit?**

| Model | Rule | Bias |
| --- | --- | --- |
| Last click | 100% to the final touch | Over-credits bottom-funnel and branded search |
| First click | 100% to the first touch | Over-credits awareness |
| Linear | Equal split across touches | Ignores that touches differ in impact |
| Time decay | More credit to recent touches | Reasonable default; still arbitrary |
| Position-based | 40/20/40 first/middle/last | Compromise; still arbitrary |
| Data-driven | Model estimated from data | Better, needs volume; still correlational |

> [!WARNING]
> **Every attribution model is a heuristic, not a measurement.** They allocate credit for conversions that already happened; they do not tell you what would have happened without the ad. Branded search is the clearest example: someone who searches your brand name was already going to buy. Last-click attribution credits that click with the sale, and the channel looks spectacular.
>
> The only reliable way to know a channel's incremental effect is to **turn it off in a geo holdout** and measure the difference.

**Incrementality testing** is the answer. Hold out a randomly selected set of regions or users, run the campaign everywhere else, and compare. Results are routinely sobering: channels reporting 8:1 ROAS often show 1.5:1 incremental. Retargeting is the classic offender — it targets people who were already going to convert.

**Marketing mix modelling (MMM)** regresses sales on channel spend with adstock (carryover) and saturation curves. Aggregate, privacy-safe, captures offline channels, and estimates diminishing returns — but needs years of data and enough spend variation to identify effects.

## Funnel analysis

```sql
WITH funnel AS (
    SELECT count(DISTINCT session_id)                                   AS sessions,
           count(DISTINCT session_id) FILTER (WHERE viewed_product)     AS viewed,
           count(DISTINCT session_id) FILTER (WHERE added_to_cart)      AS carted,
           count(DISTINCT session_id) FILTER (WHERE started_checkout)   AS checkout,
           count(DISTINCT session_id) FILTER (WHERE purchased)          AS purchased
    FROM   session_events
    WHERE  session_date >= current_date - interval '30 days'
)
SELECT sessions,
       round(100.0 * viewed    / nullif(sessions, 0), 1) AS pct_viewed,
       round(100.0 * carted    / nullif(viewed, 0),   1) AS view_to_cart,
       round(100.0 * checkout  / nullif(carted, 0),   1) AS cart_to_checkout,
       round(100.0 * purchased / nullif(checkout, 0), 1) AS checkout_to_purchase,
       round(100.0 * purchased / nullif(sessions, 0), 1) AS overall_conversion
FROM   funnel;
```

Report **step conversion** (each stage against the previous) to locate the leak, and **overall conversion** to size the opportunity. Confusing the two is a frequent reporting error.

Then segment the funnel — by device, channel and new vs returning. The aggregate funnel almost always hides that one segment is dramatically worse, which is where the actual fix lives.

## Channel evaluation

Judge channels on more than CAC:

| Dimension | Question |
| --- | --- |
| Volume | How many customers can it deliver at scale? |
| Efficiency | CAC, and margin-adjusted ROAS |
| Quality | Do these customers retain and expand? |
| Incrementality | What happens when it is switched off? |
| Scalability | Does CAC rise steeply with spend? |
| Payback | How quickly is cash recovered? |

> [!EXAMPLE]
> Two channels, both ₹1,200 CAC:
>
> | | Channel A | Channel B |
> | --- | --- | --- |
> | CAC | ₹1,200 | ₹1,200 |
> | 12-month retention | 68% | 31% |
> | Avg annual revenue | ₹9,400 | ₹5,100 |
> | 3-year LTV | ₹19,800 | ₹6,900 |
> | LTV:CAC | 16.5 | 5.8 |
>
> Identical on the metric most teams report weekly, and completely different businesses. **Always evaluate acquisition channels on cohort retention, not on CAC alone.** This is also the most common explanation for retention appearing to decline: a cheaper, lower-quality channel was scaled up.

## Diminishing returns

Channels saturate. The first ₹1 lakh reaches the most responsive audience; the tenth reaches people barely interested.

Plot CAC against weekly spend. When CAC starts rising with spend, you are at the efficient frontier. The optimal allocation equalises **marginal** CAC across channels — not average CAC, which is what most budget conversations use.

## Campaign measurement

- **Always hold out a control group.** Even 5% is enough to measure lift, and without one you cannot separate campaign effect from seasonality.
- **Pre-register the success metric** before launch.
- **Measure at the decision horizon.** A campaign that lifts week-one purchases and pulls forward demand from week three has a net effect of zero.
- **Watch cannibalisation.** A discount campaign frequently converts customers who would have paid full price.

## Key takeaways

- Load CAC fully — media alone understates it substantially.
- ROAS on revenue ignores margin; use contribution profit per rupee.
- Attribution allocates credit; only incrementality tests measure causal effect.
- Report step and overall funnel conversion separately, and segment before concluding.
- Evaluate channels on retention and LTV, never on CAC alone.
- Allocate budget by marginal CAC, and always keep a holdout.

```quiz
[
  {
    "q": "A retargeting channel reports 8:1 ROAS, but a geo holdout shows 1.5:1 incremental. What explains the gap?",
    "options": [
      "The holdout was too small",
      "Retargeting reaches users who were already going to convert, so last-click attribution credits it with conversions it did not cause",
      "The ROAS calculation was wrong",
      "Seasonality"
    ],
    "answer": 1,
    "explain": "Attribution assigns credit for conversions that happened; it does not measure counterfactual impact. Retargeting is the classic case of taking credit for existing intent."
  },
  {
    "q": "Two channels have identical ₹1,200 CAC, but 12-month retention is 68% vs 31%. What follows?",
    "options": [
      "They are equally valuable",
      "The higher-retention channel is far more valuable; CAC alone is an incomplete measure",
      "The lower-retention channel is cheaper to scale",
      "Retention is unrelated to acquisition quality"
    ],
    "answer": 1,
    "explain": "Channel quality shows up in retention and LTV, not in acquisition cost. Scaling a cheap, low-retention channel is also the most common cause of apparently worsening cohort retention."
  },
  {
    "q": "When allocating budget across channels, which quantity should be equalised?",
    "options": [
      "Average CAC across channels",
      "Marginal CAC — the cost of the next customer in each channel",
      "Total spend per channel",
      "ROAS reported by each platform"
    ],
    "answer": 1,
    "explain": "With diminishing returns, the optimum is where the next rupee buys the same result everywhere. Average CAC hides saturation and leads to over-investing in a channel past its efficient frontier."
  }
]
```
