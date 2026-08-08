---
title: Model Evaluation Metrics
description: Choosing the right metric for regression, classification and ranking — plus the validation discipline that stops a great offline score becoming a bad production model.
order: 6
difficulty: Intermediate
tags: [modelling, evaluation, metrics, validation]
---

A model is only as good as the metric you judged it on. Choosing the wrong one produces a model that optimises something nobody wanted — and the mistake is invisible until the model is in production.

## Regression metrics

| Metric | Formula | Properties |
| --- | --- | --- |
| MAE | mean(\|y − ŷ\|) | Same units, robust to outliers, easy to explain |
| RMSE | √mean((y − ŷ)²) | Penalises large errors; sensitive to outliers |
| MAPE | mean(\|y − ŷ\|/y) × 100 | Scale-free; undefined at y = 0, asymmetric |
| R² | 1 − SS_res/SS_tot | Share of variance explained; not an error measure |
| MASE | MAE ÷ naive MAE | Scale-free with a built-in benchmark |

**MAE vs RMSE is a business decision, not a technical one.** RMSE punishes big misses disproportionately. If one large error is much worse than several small ones — a stockout of a critical component — RMSE reflects your preference. If all errors cost proportionally, MAE does.

> [!TIP]
> Optimising MAE fits the conditional **median**; optimising RMSE fits the conditional **mean**. With skewed business data those differ substantially, and the choice determines whether your forecasts are systematically above or below the typical outcome.

## Classification metrics

Everything derives from the confusion matrix:

|  | Predicted + | Predicted − |
| --- | --- | --- |
| **Actual +** | TP | FN |
| **Actual −** | FP | TN |

| Metric | Formula | Use when |
| --- | --- | --- |
| Accuracy | (TP+TN)/all | Balanced classes only |
| Precision | TP/(TP+FP) | False positives are costly |
| Recall | TP/(TP+FN) | False negatives are costly |
| F1 | 2PR/(P+R) | Need one balanced number |
| Specificity | TN/(TN+FP) | Correctly clearing negatives matters |
| AUC-ROC | Area under ROC | Ranking quality, balanced classes |
| AUC-PR | Area under PR curve | Ranking quality, **imbalanced classes** |
| Log loss | −mean(y·log p + …) | Probability quality matters |
| Brier score | mean((p − y)²) | Calibration |

> [!WARNING]
> **Accuracy is nearly always the wrong metric in business.** Fraud at 0.1% means "predict never fraud" scores 99.9%. Whenever someone reports accuracy on an imbalanced problem, ask for the confusion matrix.

**AUC-ROC vs AUC-PR.** ROC uses the false positive rate, whose denominator is the huge negative class, so it stays flattering under imbalance. The precision-recall curve exposes the real difficulty. **Use AUC-PR whenever positives are under ~10% of the data.**

## The metric should mirror the decision

The best evaluation metric is often not a standard one at all — it is expected value in currency.

> [!EXAMPLE]
> **Churn model, evaluated properly.**
>
> - 10,000 active customers; 500 will churn (5%).
> - Retention call costs ₹500; succeeds 30% of the time; a saved customer is worth ₹8,000.
>
> | Threshold | Flagged | True churners caught | Cost | Value saved | **Net** |
> | ---: | ---: | ---: | ---: | ---: | ---: |
> | 0.50 | 300 | 210 | ₹1.5L | ₹5.04L | **₹3.54L** |
> | 0.30 | 800 | 380 | ₹4.0L | ₹9.12L | **₹5.12L** |
> | 0.21 | 1,200 | 440 | ₹6.0L | ₹10.56L | **₹4.56L** |
> | 0.10 | 2,600 | 480 | ₹13.0L | ₹11.52L | **−₹1.48L** |
>
> Net value peaks near a 0.30 threshold — not at 0.5, and not at the F1-optimal point either. **Build this table for every classification model you deploy.** It converts a modelling choice into a business one, and it is what the budget conversation actually needs.

## Validation discipline

The metric is only meaningful if computed on data the model has never influenced.

**Three-way split:**
- **Train** (60%) — fit parameters.
- **Validation** (20%) — tune hyperparameters, select features, choose thresholds.
- **Test** (20%) — touched **once**, at the end.

Every time you look at the test set and change something, it becomes a validation set. Its estimate is no longer unbiased.

**Cross-validation** uses the data more efficiently:

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(pipeline, X, y, cv=cv, scoring='average_precision')
print(f"AUC-PR: {scores.mean():.3f} ± {scores.std():.3f}")
```

The standard deviation across folds matters. High variance means the estimate is unstable and small differences between models are not real.

**Split by the right unit.** With repeat customers, splitting by row puts the same customer in both train and test — the model recognises them rather than generalising. Use `GroupKFold` on customer_id. For temporal data, split by time.

## Leakage

Leakage is the most common cause of a model that scores brilliantly and fails in production.

| Type | Example | Symptom |
| --- | --- | --- |
| Target leakage | `cancellation_reason` in a churn model | Near-perfect accuracy |
| Train-test contamination | Scaling fitted on the whole dataset | Small optimistic bias |
| Temporal leakage | Using future data in features | Great backtest, poor live |
| Group leakage | Same customer in train and test | Overstated generalisation |
| Duplicate leakage | Duplicated rows across splits | Overstated performance |

> [!TIP]
> **A model that looks too good almost certainly is.** Above ~0.95 AUC on a business problem, stop and hunt for leakage before celebrating. The single best defence is asking, for every feature: *would this value be available, with this value, at the moment I need to predict?*

Keep all preprocessing inside a `Pipeline` so scalers and encoders are fitted on training folds only.

## Comparing models honestly

- **Same test set, same metric.** Otherwise the comparison is meaningless.
- **Report variability**, not just the mean score.
- **Include a trivial baseline** — majority class, seasonal naive, or the existing business rule.
- **Weigh complexity.** A 1% gain that requires a real-time feature store, monitoring and retraining is often not worth it. The simpler model that ships beats the better model that does not.

## Monitoring in production

Offline metrics decay. Track:

- **Input drift** — have feature distributions moved from training?
- **Prediction drift** — has the score distribution shifted?
- **Performance** — actual outcomes versus predictions, once labels arrive.
- **Business metric** — is the programme delivering value?
- **Calibration** — do 30%-scored customers still churn 30% of the time?

Set the retraining trigger before deployment: on a schedule, on a drift threshold, or on measured performance decay. Deciding this afterwards means it never gets decided.

## Key takeaways

- Choose the metric from the cost structure: MAE vs RMSE, precision vs recall.
- Accuracy is misleading under imbalance; use AUC-PR when positives are rare.
- Build the expected-value table across thresholds — it usually changes the decision.
- Touch the test set once; keep preprocessing inside a pipeline.
- Split by customer or by time when rows are not independent.
- Suspiciously good results mean leakage until proven otherwise.

```quiz
[
  {
    "q": "Positives make up 2% of your data. Which ranking metric should you prefer?",
    "options": ["Accuracy", "AUC-ROC", "AUC-PR", "R-squared"],
    "answer": 2,
    "explain": "ROC's false positive rate has a huge denominator under imbalance and stays flattering. The precision-recall curve reflects the real difficulty of finding rare positives."
  },
  {
    "q": "Your churn model achieves 0.98 AUC on the test set. What is the first thing to check?",
    "options": [
      "Deploy it immediately",
      "Look for leakage — a feature that would not be available at prediction time",
      "Increase the training set size",
      "Reduce the number of features"
    ],
    "answer": 1,
    "explain": "Business churn models rarely exceed ~0.85 AUC. A near-perfect score almost always means a feature encodes the outcome, such as a cancellation timestamp or reason."
  },
  {
    "q": "You have repeat customers with multiple rows each. Why is a random row-level train/test split a problem?",
    "options": [
      "It creates class imbalance",
      "The same customer appears in both splits, so the model recognises individuals rather than generalising",
      "It reduces the training set size",
      "Random splits require stratification"
    ],
    "answer": 1,
    "explain": "Group leakage inflates test performance because the model has already seen that customer. Use GroupKFold on customer_id so all of a customer's rows stay on one side."
  }
]
```
