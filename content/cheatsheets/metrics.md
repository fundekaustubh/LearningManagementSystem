---
title: Business Metrics
description: Formulas for the growth, retention, unit-economics and model metrics analysts are asked for most.
order: 4
---

## Growth

| Metric | Formula |
| --- | --- |
| Growth rate | $(Current - Prior) / Prior$ |
| CAGR | $(End/Start)^{1/years} - 1$ |
| MoM / YoY | Current ÷ same period prior − 1 |
| Rule of 40 (SaaS) | Growth % + profit margin % ≥ 40 |
| Quick ratio | (New + Expansion) ÷ (Churned + Contraction) MRR |

## Retention and churn

| Metric | Formula |
| --- | --- |
| Churn rate | Lost customers ÷ customers at period start |
| Retention rate | $1 - churn$ |
| Avg customer lifetime | $1 / monthly\ churn$ (months) |
| GRR | Retained MRR ÷ starting MRR (capped at 100%) |
| NRR | (Retained + expansion) ÷ starting MRR (uncapped) |
| Logo vs revenue churn | By count vs by value |

NRR > 100% means growth from the existing base alone.

## Unit economics

| Metric | Formula |
| --- | --- |
| CAC | Fully loaded acquisition spend ÷ new customers |
| CLV (simple) | $(ARPU × gross\ margin\%) / churn\ rate$ |
| CLV (discounted) | $M × r / (1 + d - r)$ |
| LTV:CAC | CLV ÷ CAC — target ≥ 3:1 |
| CAC payback | CAC ÷ monthly gross profit per customer |
| ROAS | Attributed revenue ÷ ad spend |
| Contribution margin | Revenue − variable costs |
| Break-even volume | Fixed costs ÷ contribution margin per unit |

**Always use gross margin, not revenue, in CLV.**

## E-commerce / product

| Metric | Formula |
| --- | --- |
| Conversion rate | Purchases ÷ sessions |
| AOV | Revenue ÷ orders |
| Revenue | Traffic × Conversion × AOV |
| Repeat purchase rate | Customers with ≥2 orders ÷ all customers |
| Cart abandonment | 1 − (purchases ÷ carts created) |
| DAU/MAU stickiness | DAU ÷ MAU |

## Finance

| Metric | Formula |
| --- | --- |
| Gross margin | (Revenue − COGS) ÷ Revenue |
| Operating margin | EBIT ÷ Revenue |
| Cash conversion cycle | DIO + DSO − DPO |
| Current ratio | Current assets ÷ current liabilities |
| NPV | $Σ CF_t / (1+r)^t$ |

## Operations

| Metric | Formula |
| --- | --- |
| Inventory turnover | COGS ÷ average inventory |
| Days inventory | 365 ÷ turnover |
| Safety stock | $z × σ × \sqrt{LT}$ |
| Reorder point | (Avg demand × LT) + safety stock |
| EOQ | $\sqrt{2DS/H}$ |
| Fill rate | Units shipped ÷ units ordered |

**Service-level z:** 90% → 1.28 · 95% → 1.65 · 98% → 2.05 · 99% → 2.33

## Model evaluation

| Metric | Formula | Use |
| --- | --- | --- |
| Precision | TP/(TP+FP) | False positives costly |
| Recall | TP/(TP+FN) | False negatives costly |
| F1 | 2PR/(P+R) | Balanced single score |
| AUC-ROC | Ranking quality | Balanced classes |
| AUC-PR | Ranking quality | **Imbalanced classes** |
| MAE / RMSE | Mean absolute / root squared error | RMSE punishes large misses |
| MASE | MAE ÷ naive MAE | < 1 beats naive |

**Optimal threshold** from costs: contact if $p × P(save) × value > cost$.
