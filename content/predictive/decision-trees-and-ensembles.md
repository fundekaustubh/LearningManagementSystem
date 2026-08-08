---
title: Decision Trees and Ensembles
description: How trees split data, why a single tree overfits, and how random forests and gradient boosting became the default for tabular business data.
order: 3
difficulty: Intermediate
tags: [modelling, machine-learning, trees, prediction]
---

Decision trees split data into ever-purer groups using simple rules. A single tree is highly interpretable and usually not very accurate. Combining many of them produces the models that win on tabular business data almost every time.

## How a tree splits

At each node, the algorithm tries every feature and every threshold, and picks the split that most improves purity.

- **Gini impurity** — $1 - Σp_i²$, minimised when a node contains one class.
- **Entropy** — $-Σp_i log_2(p_i)$. Similar results, slightly more expensive.
- **Variance reduction** — for regression trees.

```text
                   All customers (churn 12%)
                            │
              tenure_months < 6 ?
              ┌─────────────┴──────────────┐
            yes                            no
      churn 31% (n=2,100)            churn 6% (n=7,900)
              │                              │
      support_tickets > 2 ?            is_annual_plan ?
      ┌───────┴────────┐              ┌──────┴───────┐
    yes              no             yes             no
  churn 58%       churn 19%       churn 3%       churn 9%
```

The output is a set of readable rules: *"customers under 6 months old with more than 2 support tickets churn at 58%"*. That kind of statement can go straight into a retention playbook without any translation, which is why trees remain valuable even when they are not the final model.

## Why a single tree overfits

Left unconstrained, a tree keeps splitting until every leaf is pure — memorising the training data, including its noise. It will be nearly perfect in training and poor on new data.

Controls:

| Parameter | Effect |
| --- | --- |
| `max_depth` | Hard limit on tree depth |
| `min_samples_split` | Minimum rows required to split a node |
| `min_samples_leaf` | Minimum rows in a leaf — the most effective single control |
| `max_features` | Features considered per split |
| `ccp_alpha` | Cost-complexity pruning after growth |

Even well-tuned, single trees are **unstable**: change 5% of the training data and the top split can change, producing an entirely different-looking tree. That instability is exactly what ensembles exploit.

## Random forests

Train many trees on different random subsets, then average their predictions.

Two sources of randomness make the trees genuinely different:

1. **Bagging** — each tree trains on a bootstrap sample (sampled with replacement).
2. **Feature subsampling** — each split considers a random subset of features, so one dominant feature does not appear at the top of every tree.

Averaging many high-variance, low-bias trees cancels much of the variance. The result is robust, needs little tuning, and rarely overfits badly with more trees.

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=500,       # more trees never hurts accuracy, only runtime
    max_depth=None,         # let trees grow; the ensemble controls variance
    min_samples_leaf=5,     # the main regularisation knob
    max_features='sqrt',    # standard for classification
    class_weight='balanced',
    n_jobs=-1,
    random_state=42,
)
rf.fit(X_train, y_train)
```

## Gradient boosting

Where a forest builds trees independently, boosting builds them **sequentially**, each new tree fitting the errors the ensemble has made so far.

1. Start with a simple prediction (often the mean).
2. Compute the residuals.
3. Fit a small tree to those residuals.
4. Add it, scaled by the learning rate.
5. Repeat.

This usually beats random forests on tabular data, at the cost of more careful tuning — boosting *can* overfit if you let it run too long.

```python
import lightgbm as lgb

model = lgb.LGBMClassifier(
    n_estimators=1000,
    learning_rate=0.05,     # lower rate + more trees generally wins
    num_leaves=31,
    min_child_samples=20,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)
model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    eval_metric='auc',
    callbacks=[lgb.early_stopping(50)],   # stop when validation stops improving
)
```

**Early stopping is the key mechanism.** It uses a validation set to determine the number of trees automatically, which removes the main overfitting risk.

XGBoost, LightGBM and CatBoost are the three standard implementations. LightGBM is fastest on large data; CatBoost handles high-cardinality categorical features without manual encoding.

## Choosing between them

| | Single tree | Random forest | Gradient boosting |
| --- | --- | --- | --- |
| Accuracy | Low | Good | Best (tabular) |
| Interpretability | Excellent | Moderate | Low without SHAP |
| Tuning effort | Low | Low | Moderate to high |
| Overfitting risk | High | Low | Moderate — needs early stopping |
| Training speed | Fast | Fast (parallel) | Slower (sequential) |
| Handles missing values | Some implementations | Some | Natively |

**Practical guidance:** start with logistic regression as a baseline, then LightGBM. If the boosted model does not clearly beat the linear one, ship the linear one — it is easier to explain, monitor and debug.

## Feature importance, and its trap

```python
importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
```

Built-in (impurity-based) importance has two well-documented biases:

1. **It inflates high-cardinality features.** A customer ID would look highly "important" because it can split anything.
2. **It splits credit arbitrarily among correlated features.** Two near-duplicate features each get roughly half the importance, making both look unimportant.

Better alternatives:

- **Permutation importance** — shuffle one feature and measure the drop in validation performance. Measures what the model actually relies on.
- **SHAP values** — per-prediction attributions with strong theoretical grounding. `shap.summary_plot` is the standard explanation artefact for a boosted model.

> [!WARNING]
> Feature importance is **not** a causal effect. A high importance score for `support_tickets` in a churn model means tickets help predict churn, not that reducing tickets reduces churn. This distinction gets lost constantly when model outputs reach a business audience — say it explicitly whenever you present importances.

## Trees vs linear models

**Trees handle natively:**
- Non-linear relationships and thresholds
- Interactions, without you specifying them
- Mixed feature scales — no standardisation needed
- Outliers in predictors — splits are rank-based

**Trees are worse at:**
- Extrapolation — they can never predict outside the training range of y
- Smooth relationships — approximated as staircases
- Very small datasets — not enough data to split reliably
- Direct interpretability of an effect size

That extrapolation limit matters in business: a tree-based demand forecast **cannot** predict a sales level higher than anything it has seen. For a growing business, that is disqualifying, and it is why time-series forecasting usually keeps a trend model.

## Avoiding overfitting

1. **Always hold out a test set** never used for any decision.
2. **Cross-validate** for tuning; use time-based splits for temporal data.
3. **Use early stopping** with a separate validation set.
4. **Watch the train/validation gap.** 0.99 train AUC and 0.72 validation AUC is memorisation.
5. **Check for leakage** first whenever results look implausibly good. Suspiciously excellent models are almost always leaking.

## Key takeaways

- A single tree gives readable rules but overfits and is unstable.
- Random forests reduce variance via bagging and feature subsampling; boosting fits residuals sequentially.
- Gradient boosting usually wins on tabular data; early stopping is what keeps it honest.
- Impurity-based importance is biased — prefer permutation importance or SHAP.
- Importance is predictive, never causal.
- Trees cannot extrapolate beyond the training range, which rules them out for trending forecasts.

```quiz
[
  {
    "q": "What is the key difference between a random forest and gradient boosting?",
    "options": [
      "Forests use regression trees, boosting uses classification trees",
      "Forests build trees independently and average them; boosting builds trees sequentially, each fitting the previous errors",
      "Boosting cannot handle categorical features",
      "Forests require more tuning"
    ],
    "answer": 1,
    "explain": "Bagging (forests) reduces variance by averaging independent trees. Boosting reduces bias by sequentially fitting residuals, which is more powerful and more prone to overfitting without early stopping."
  },
  {
    "q": "Your training AUC is 0.99 and validation AUC is 0.72. What is happening?",
    "options": [
      "The model is well fitted",
      "Severe overfitting — reduce depth, increase min_samples_leaf, or use early stopping",
      "The validation set is too large",
      "The learning rate is too low"
    ],
    "answer": 1,
    "explain": "A large train/validation gap means the model has memorised training noise. Stronger regularisation or early stopping is required."
  },
  {
    "q": "Why can a tree-based model be a poor choice for forecasting a fast-growing company's revenue?",
    "options": [
      "Trees cannot handle time features",
      "Trees cannot extrapolate beyond the range of the training target, so they cannot predict record-high values",
      "Trees are too slow to train",
      "Trees require normally distributed data"
    ],
    "answer": 1,
    "explain": "Tree predictions are averages of training observations in a leaf, bounded by the observed range of y. A growing series constantly needs values above anything seen before."
  }
]
```
