---
title: Logistic Regression and Classification
description: Predicting yes/no outcomes — odds ratios, choosing a decision threshold from business costs, and handling class imbalance without fooling yourself.
order: 2
difficulty: Intermediate
tags: [modelling, classification, churn, prediction]
---

Most valuable business predictions are binary. Will this customer churn? Will this lead convert? Is this transaction fraudulent? Should this application be approved? Logistic regression is the standard starting point — interpretable, fast, and strong enough that complex models often beat it only marginally.

## Why not linear regression

Fitting a straight line to a 0/1 outcome predicts values below 0 and above 1, which are not probabilities, and assumes a constant effect across the whole range, which is wrong at the extremes.

Logistic regression fits an S-curve bounded by 0 and 1:

$P(y=1) = \frac{1}{1 + e^{-(β_0 + β_1x_1 + ... + β_kx_k)}}$

Equivalently, it is linear in the **log-odds**:

$log\left(\frac{p}{1-p}\right) = β_0 + β_1x_1 + ... + β_kx_k$

## Odds and odds ratios

**Odds** = p / (1 − p). A 20% churn probability is odds of 0.25, or "1 to 4".

A coefficient $β$ is the change in **log-odds** per unit of x. Exponentiating gives the **odds ratio**, which is how you should always report it to stakeholders.

```python
import statsmodels.api as sm
import numpy as np

X = sm.add_constant(df[['tenure_months', 'support_tickets', 'is_annual_plan']])
model = sm.Logit(df['churned'], X).fit()

odds_ratios = np.exp(model.params)
print(odds_ratios)
```

```text
const              0.412
tenure_months      0.94     → each extra month cuts churn odds by 6%
support_tickets    1.31     → each ticket raises churn odds by 31%
is_annual_plan     0.58     → annual plans have 42% lower churn odds
```

> [!WARNING]
> An odds ratio is **not** a relative risk. An odds ratio of 1.31 does not mean a 31% higher probability of churn. When the base rate is small (under ~10%) the two are close; when it is large they diverge sharply. Say "odds", not "chance", unless you have converted properly.

## The threshold is a business decision

The model outputs a probability. Turning it into an action requires a threshold — and **the default 0.5 is almost never right**.

The correct threshold comes from the relative costs of the two errors:

> [!EXAMPLE]
> A churn model for retention outreach.
>
> - Contacting a customer costs ₹500.
> - Saving a customer is worth ₹8,000.
> - The outreach succeeds 30% of the time.
>
> Expected value of contacting a customer with churn probability p:
>
> $E = p × 0.30 × 8000 - 500$
>
> This is positive when $p > 500 / 2400 = 0.208$.
>
> **The threshold is 0.21, not 0.5.** At 0.5 you would skip more than half the customers worth contacting. Setting the threshold from the cost structure rather than the default is often worth more than any modelling improvement.

Restating it as "we need better than a 1-in-5 chance of churn to justify the call" is what makes the choice legible to the business.

## Evaluating a classifier

Accuracy is nearly useless for imbalanced problems. With 2% churn, predicting "nobody churns" is 98% accurate and completely worthless.

**The confusion matrix**:

|  | Predicted positive | Predicted negative |
| --- | --- | --- |
| **Actually positive** | True positive (TP) | False negative (FN) |
| **Actually negative** | False positive (FP) | True negative (TN) |

| Metric | Formula | Question it answers |
| --- | --- | --- |
| Precision | TP / (TP + FP) | Of those we flagged, how many were right? |
| Recall (sensitivity) | TP / (TP + FN) | Of all real positives, how many did we catch? |
| F1 | Harmonic mean | Single balanced score |
| Specificity | TN / (TN + FP) | Of the negatives, how many did we clear? |

**Precision and recall trade off against each other**, and the right balance is a business question:

- **Fraud blocking** — a false positive blocks a legitimate customer's card. Favour precision.
- **Cancer screening** — a false negative is catastrophic; follow-up tests are cheap. Favour recall.
- **Churn outreach** — depends entirely on the contact cost versus the save value, as computed above.

**AUC-ROC** measures ranking quality across all thresholds: the probability that a random positive is ranked above a random negative. 0.5 is random, 1.0 is perfect, 0.7–0.8 is typical for churn.

> [!TIP]
> For heavily imbalanced problems, prefer **AUC-PR** (precision-recall) over AUC-ROC. ROC looks flattering when negatives dominate, because the false positive rate has a huge denominator. The precision-recall curve exposes the problem honestly.

## Class imbalance

When positives are rare (fraud at 0.1%, churn at 2%), models drift toward predicting the majority class.

| Approach | Note |
| --- | --- |
| Adjust the threshold | Simplest and usually sufficient — try this first |
| Class weights | `class_weight='balanced'`; penalises errors on the rare class more |
| Oversample the minority | Risks overfitting duplicated rows |
| Undersample the majority | Discards data |
| SMOTE (synthetic examples) | Popular, often no better than class weights in practice |

> [!WARNING]
> Whatever you resample, **do it inside the training fold only**. Resampling before splitting leaks information into the test set and produces a validation score that will not survive production. This is one of the most common serious mistakes in applied ML.

## Calibration

A model can rank well and still output badly-scaled probabilities. If you plan to *use* the probability — in an expected-value calculation, as above — it must be calibrated.

Check with a calibration plot: bucket predictions by predicted probability, and plot predicted against observed rates. A well-calibrated model sits on the diagonal: among customers scored 0.30, about 30% should actually churn.

Logistic regression is usually well calibrated by construction. Tree ensembles often are not, and need Platt scaling or isotonic regression to fix.

## A complete workflow

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (classification_report, roc_auc_score,
                             average_precision_score, confusion_matrix)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=42)

pipe = Pipeline([
    ('scale', StandardScaler()),
    ('model', LogisticRegression(class_weight='balanced', max_iter=1000)),
])
pipe.fit(X_train, y_train)

probs = pipe.predict_proba(X_test)[:, 1]
print('AUC-ROC:', roc_auc_score(y_test, probs))
print('AUC-PR :', average_precision_score(y_test, probs))

# Apply the business threshold, not 0.5
THRESHOLD = 0.21
preds = (probs >= THRESHOLD).astype(int)
print(confusion_matrix(y_test, preds))
print(classification_report(y_test, preds))
```

Two details worth noting: `stratify=y` preserves the class balance in both splits, and the scaler lives **inside** the pipeline so it is fitted on training data only — another common leakage route.

## Turning a model into a programme

A churn model is not a deliverable; a retention programme is. The full loop:

1. **Score** all active customers weekly.
2. **Threshold** by expected value, not by 0.5.
3. **Prioritise** within the flagged set by customer value — high probability *and* high CLV first.
4. **Assign** an intervention appropriate to the segment.
5. **Hold out a control group.** Without it you can never measure whether the programme worked.
6. **Measure** the actual retention lift against that control, and feed it back.

> [!TIP]
> Step 5 is the one teams skip, and it is the one that determines whether the programme survives its first budget review. Without a control group you cannot distinguish "we saved 340 customers" from "340 customers who were never going to leave got a phone call".

## Key takeaways

- Logistic regression models log-odds; report exponentiated coefficients as odds ratios.
- Odds ratios are not probability ratios — they diverge when the base rate is high.
- Set the decision threshold from the cost of each error type, not at 0.5.
- Accuracy is meaningless under imbalance; use precision, recall and AUC-PR.
- Resample only inside training folds, and keep preprocessing inside the pipeline.
- Calibrate if you use probabilities numerically, and always hold out a control group.

```quiz
[
  {
    "q": "Contacting a customer costs ₹500, a save is worth ₹8,000, and outreach succeeds 30% of the time. What churn probability threshold maximises expected value?",
    "options": ["0.50", "0.21", "0.06", "0.30"],
    "answer": 1,
    "explain": "Expected value is positive when p x 0.30 x 8000 > 500, i.e. p > 500/2400 ≈ 0.21. The default 0.5 threshold would skip many profitable contacts."
  },
  {
    "q": "A fraud model has 99.9% accuracy on data where fraud is 0.1% of transactions. What should you check?",
    "options": [
      "Nothing, this is excellent",
      "Whether it simply predicts 'not fraud' every time — check precision and recall instead",
      "Whether the model is overfitting",
      "Whether the threshold is too low"
    ],
    "answer": 1,
    "explain": "Predicting the majority class always yields 99.9% accuracy here. Precision, recall and AUC-PR reveal whether the model detects anything at all."
  },
  {
    "q": "Why must SMOTE or other resampling be applied only within training folds?",
    "options": [
      "It is computationally faster",
      "Resampling before splitting leaks synthetic or duplicated information into the test set, inflating validation scores",
      "SMOTE requires the full dataset",
      "It changes the class balance permanently"
    ],
    "answer": 1,
    "explain": "Synthetic points generated from records that later land in the test set make evaluation optimistic. Resampling must sit inside the cross-validation loop."
  }
]
```
