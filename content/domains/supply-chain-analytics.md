---
title: Supply Chain and Operations Analytics
description: Demand forecasting, safety stock, ABC/XYZ classification and the service-level trade-off that decides how much inventory to hold.
order: 5
difficulty: Intermediate
tags: [operations, supply-chain, inventory, applied]
---

Supply chain analytics has an unusually clear objective function: meet demand at the lowest total cost. Both sides are measurable, the trade-offs are explicit, and the answers translate directly into money — which makes it one of the most satisfying domains for an analyst.

## The central trade-off

- **Too much inventory** — capital tied up, warehousing costs, obsolescence, markdowns.
- **Too little** — stockouts, lost sales, expedited freight, damaged customer relationships.

Every inventory decision sits on this line, and the optimum depends on the ratio of the two costs, not on either alone.

## Key metrics

| Metric | Formula | Meaning |
| --- | --- | --- |
| Inventory turnover | COGS ÷ average inventory | How many times stock cycles per year |
| Days inventory (DIO) | 365 ÷ turnover | Days of stock on hand |
| Fill rate | Units shipped ÷ units ordered | Demand met from stock |
| On-time in-full (OTIF) | Complete, on-time orders ÷ total | The customer-facing service measure |
| Stockout rate | Out-of-stock SKU-days ÷ total SKU-days | Availability failure |
| Forecast accuracy | 1 − MAPE, or MASE | Quality of demand planning |
| Cash conversion cycle | DIO + DSO − DPO | Working capital efficiency |

> [!TIP]
> **OTIF is the metric customers actually feel.** An order that is 95% complete is still a late order for the buyer waiting on the missing item. Reporting fill rate at the unit level while customers experience order-level failures is a common source of "the dashboard says we're fine but customers are complaining".

## Safety stock

Safety stock buffers against variability in both demand and lead time.

$Safety\ stock = z × σ_{LT} × \sqrt{LT}$

where z is the service-level factor, $σ_{LT}$ the standard deviation of demand per period, and LT the lead time in periods.

| Service level | z |
| --- | --- |
| 90% | 1.28 |
| 95% | 1.65 |
| 98% | 2.05 |
| 99% | 2.33 |
| 99.9% | 3.09 |

> [!EXAMPLE]
> Weekly demand averages 500 units with a standard deviation of 120. Lead time is 4 weeks. Target service level 95%.
>
> $Safety\ stock = 1.65 × 120 × \sqrt{4} = 396\ units$
> $Reorder\ point = (500 × 4) + 396 = 2,396\ units$
>
> Now note the cost of higher service:
>
> | Service level | Safety stock | Extra vs 95% |
> | --- | ---: | ---: |
> | 90% | 307 | −89 |
> | 95% | 396 | — |
> | 99% | 559 | +163 |
> | 99.9% | 742 | +346 |
>
> Going from 95% to 99.9% nearly doubles safety stock to eliminate a small fraction of stockouts. **Service level is a business decision about the cost of a stockout, not a target to maximise.** For a critical component in a production line, 99.9% is cheap; for a slow-moving accessory, 90% may be generous.

When lead time is also variable, the formula extends to include lead-time variance — often the larger contributor, especially with overseas suppliers.

## ABC/XYZ classification

Not every SKU deserves the same attention. Two dimensions:

**ABC by value** (Pareto):
- **A** — top ~20% of SKUs, ~80% of value. Tight control, frequent review.
- **B** — next ~30%, ~15% of value. Moderate control.
- **C** — remaining ~50%, ~5% of value. Simple rules, large safety buffers (they are cheap).

**XYZ by demand variability** (coefficient of variation):
- **X** — CV < 0.5, stable and predictable.
- **Y** — CV 0.5–1.0, seasonal or trending.
- **Z** — CV > 1.0, erratic.

```sql
WITH sku_stats AS (
    SELECT sku,
           sum(units * unit_price)                          AS annual_value,
           avg(units)                                       AS mean_weekly_units,
           stddev(units)                                    AS sd_weekly_units,
           stddev(units) / nullif(avg(units), 0)            AS cv
    FROM   weekly_sales
    WHERE  week >= current_date - interval '52 weeks'
    GROUP  BY sku
),
ranked AS (
    SELECT *,
           sum(annual_value) OVER (ORDER BY annual_value DESC)
             / sum(annual_value) OVER ()                    AS cumulative_share
    FROM   sku_stats
)
SELECT sku, annual_value, cv,
       CASE WHEN cumulative_share <= 0.80 THEN 'A'
            WHEN cumulative_share <= 0.95 THEN 'B'
            ELSE 'C' END                                    AS abc_class,
       CASE WHEN cv <= 0.5 THEN 'X'
            WHEN cv <= 1.0 THEN 'Y'
            ELSE 'Z' END                                    AS xyz_class
FROM   ranked
ORDER  BY annual_value DESC;
```

The nine-cell matrix drives policy:

- **AX** — high value, predictable. Tight forecasting, low safety stock, frequent small orders.
- **AZ** — high value, erratic. The hardest cell. Consider make-to-order, supplier flexibility agreements, or deliberately high buffers.
- **CX** — low value, predictable. Automate entirely; hold plenty, it costs little.
- **CZ** — low value, erratic. Candidates for discontinuation. Long-tail SKUs consume disproportionate planning effort.

## Demand forecasting in a supply chain context

The [time-series methods](../../predictive/time-series-forecasting/) apply, with domain-specific wrinkles:

- **Forecast at the decision level.** If you order per SKU per warehouse, that is where the forecast is needed — even though aggregate forecasts are more accurate.
- **Hierarchical reconciliation.** Forecast at multiple levels and reconcile so SKU forecasts sum to the category forecast.
- **Intermittent demand.** Many SKUs sell zero most periods. Standard methods fail; use Croston's method or its variants.
- **Promotions and price changes** must be modelled explicitly, not absorbed as noise.
- **The bullwhip effect.** Demand variability amplifies up the supply chain as each tier adds its own buffer. Sharing point-of-sale data upstream dampens it more effectively than better forecasting at each tier.

> [!WARNING]
> **Forecast error costs are asymmetric.** Under-forecasting a high-margin fast-mover costs a lost sale and possibly a lost customer. Over-forecasting costs holding and eventual markdown. These are rarely equal, so the optimal forecast is usually **not** the unbiased one. Build the asymmetry into the ordering rule, not into the forecast itself — keep the forecast honest and let the safety stock carry the bias.

## Economic order quantity

$EOQ = \sqrt{\frac{2DS}{H}}$

where D is annual demand, S is fixed cost per order, H is annual holding cost per unit.

EOQ balances ordering costs against holding costs. Its assumptions — constant demand, fixed lead time, no quantity discounts — rarely hold exactly, but it remains a useful starting point, and the total-cost curve near the optimum is flat, so being somewhat wrong is inexpensive.

## Root-cause analysis for operational failures

When OTIF drops, decompose systematically:

```text
OTIF failure
├── Not in full
│   ├── Stockout        → forecast error, supplier delay, demand spike
│   └── Damaged/quality → warehouse handling, supplier quality
└── Not on time
    ├── Picking delay   → labour capacity, layout, pick-path
    ├── Transport delay → carrier performance, route, weather
    └── Order held      → credit check, address validation
```

Quantify each branch before investigating any of it. Teams routinely rebuild forecasting systems when 60% of failures were transport-related.

## Key takeaways

- Every inventory decision balances holding cost against stockout cost; the service level encodes that ratio.
- Safety stock scales with demand variability and the square root of lead time.
- Going from 95% to 99.9% service nearly doubles safety stock — choose the level deliberately.
- ABC/XYZ classification directs planning effort to where it pays.
- Forecast at the decision level, model promotions explicitly, and use Croston for intermittent demand.
- Error costs are asymmetric; put the bias in the ordering policy, not the forecast.

```quiz
[
  {
    "q": "Weekly demand averages 500 units with sd 120, lead time 4 weeks, target service level 95% (z = 1.65). What is the safety stock?",
    "options": ["198 units", "396 units", "792 units", "2,000 units"],
    "answer": 1,
    "explain": "Safety stock = z x sd x sqrt(LT) = 1.65 x 120 x 2 = 396 units. The reorder point adds average lead-time demand of 2,000, giving 2,396."
  },
  {
    "q": "A SKU is classified AZ — high value, highly erratic demand. What is the appropriate policy?",
    "options": [
      "Automate ordering with large buffers, since it is cheap to over-stock",
      "Tight forecasting with minimal safety stock",
      "Active management: supplier flexibility, make-to-order, or deliberately high buffers with senior review",
      "Discontinue it"
    ],
    "answer": 2,
    "explain": "High value means errors are expensive; high variability means forecasting cannot solve it. AZ items need active management and supply-side flexibility rather than a formula."
  },
  {
    "q": "Why is the optimal supply chain forecast often deliberately biased?",
    "options": [
      "Because forecasting models are inherently biased",
      "Because the cost of under-forecasting a high-margin item usually exceeds the cost of over-forecasting, so the ordering policy should reflect that asymmetry",
      "To make accuracy metrics look better",
      "Because demand is always growing"
    ],
    "answer": 1,
    "explain": "Stockout and holding costs are rarely symmetric. Best practice is to keep the forecast unbiased and encode the asymmetry in the safety stock and ordering rule."
  }
]
```
