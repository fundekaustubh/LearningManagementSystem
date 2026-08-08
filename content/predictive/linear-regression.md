---
title: Linear Regression
description: Fitting, reading and sanity-checking a regression — coefficient interpretation, R-squared, the assumptions, and why a good fit is not a causal claim.
order: 1
difficulty: Intermediate
tags: [modelling, regression, statistics, prediction]
---

Linear regression models a continuous outcome as a weighted sum of inputs. It is the most-used model in business analytics, and its real value is less about prediction than **interpretation**: the coefficients quantify relationships in units a stakeholder understands.

$y = β_0 + β_1x_1 + β_2x_2 + ... + β_kx_k + ε$

- $β_0$ — intercept, the predicted value when all predictors are zero.
- $β_i$ — the change in y per one-unit change in $x_i$, **holding the other predictors constant**.
- $ε$ — the error term, capturing everything the model does not.

That "holding others constant" clause is the entire reason multiple regression is worth learning. It is how you separate the effect of price from the effect of the advertising that happened to run at the same time.

## Reading the output

```python
import statsmodels.api as sm

X = df[['price', 'ad_spend', 'is_holiday_week']]
X = sm.add_constant(X)
model = sm.OLS(df['units_sold'], X).fit()
print(model.summary())
```

```text
                 coef    std err        t     P>|t|     [0.025    0.975]
const        1240.500     85.200   14.560     0.000   1073.100  1407.900
price         -18.400      2.100   -8.762     0.000    -22.520   -14.280
ad_spend        0.042      0.008    5.250     0.000      0.026     0.058
is_holiday    310.700     45.600    6.814     0.000    221.300    400.100

R-squared: 0.684    Adj. R-squared: 0.679    F-statistic: 142.3 (p < 0.001)
```

Read it line by line:

- **price = −18.4** — each ₹1 price increase reduces expected weekly units by 18.4, holding ad spend and holiday status constant.
- **ad_spend = 0.042** — each additional ₹1 of ad spend is associated with 0.042 more units. At ₹500 per unit of contribution, ₹1 of spend returns ₹21 — which sounds implausible and is a signal to check for confounding, not to increase the budget.
- **is_holiday = 310.7** — holiday weeks sell 311 more units on average.
- **P>|t| < 0.05** — the coefficient is distinguishable from zero.
- **The confidence interval** matters more than the p-value. Price is between −22.5 and −14.3; that range is what you should carry into a pricing decision.

## R² and what it does not tell you

**R²** is the share of variance in y explained by the model. 0.684 means the predictors account for about 68% of the variation in units sold.

- **Adjusted R²** penalises added predictors; use it when comparing models with different numbers of variables.
- **A high R² does not mean the model is correct.** It can be inflated by overfitting, by a trend both variables share, or by a leaked variable.
- **A low R² does not mean the model is useless.** In noisy human-behaviour data, an R² of 0.15 with a reliable, well-estimated coefficient can be genuinely valuable.

> [!WARNING]
> Never compare R² across models fitted on different outcome variables or different datasets. R² of 0.9 predicting revenue and 0.3 predicting churn probability say nothing about which model is better — they are measuring different things.

## The assumptions

Regression coefficients are unbiased and their standard errors trustworthy only when these hold. Check them; do not assume them.

**1. Linearity.** The relationship between each x and y is linear. Check by plotting residuals against fitted values — you want a formless cloud. A curve means you need a transformation or a polynomial term.

**2. Independence of errors.** One observation's error tells you nothing about another's. Violated by time series (autocorrelation) and by grouped data (multiple observations per store). Standard errors become far too small, so everything looks significant. Use time-series methods or clustered standard errors.

**3. Homoscedasticity.** Constant error variance. A funnel-shaped residual plot (spread growing with the fitted value) is extremely common with revenue data. Fix by modelling log(y), or use robust standard errors.

**4. Normality of residuals.** Needed for exact small-sample inference; matters little for large samples thanks to the CLT.

**5. No perfect multicollinearity.** Predictors must not be exact linear combinations of each other.

```python
import matplotlib.pyplot as plt

fitted = model.fittedvalues
residuals = model.resid

fig, axes = plt.subplots(1, 2, figsize=(11, 4))
axes[0].scatter(fitted, residuals, alpha=0.5)
axes[0].axhline(0, color='red', linestyle='--')
axes[0].set(xlabel='Fitted values', ylabel='Residuals',
            title='Residuals vs Fitted — want a formless cloud')
sm.qqplot(residuals, line='45', fit=True, ax=axes[1])
axes[1].set_title('Q-Q plot — want points on the line')
plt.tight_layout()
```

## Multicollinearity

When predictors are strongly correlated with each other, the model cannot attribute effect between them. Coefficients become unstable — large standard errors, signs that flip when you add a variable — even though overall predictions stay fine.

Detect with the **variance inflation factor**:

```python
from statsmodels.stats.outliers_influence import variance_inflation_factor

vif = pd.DataFrame({
    'variable': X.columns,
    'VIF': [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
})
# VIF > 5 warrants attention; VIF > 10 is a serious problem
```

Fixes: drop one of the correlated pair, combine them into an index, or use ridge regression. **If you only care about prediction, multicollinearity is not a problem** — it only damages the interpretation of individual coefficients.

## Categorical variables and interactions

Categorical predictors become dummy variables, with one level omitted as the reference:

```python
X = pd.get_dummies(df[['price', 'region']], columns=['region'], drop_first=True)
# region_North = 120 means: North sells 120 units more than the reference
# region, holding price constant.
```

The `drop_first` is essential — including every level creates perfect multicollinearity (the "dummy variable trap").

**Interactions** let one predictor's effect depend on another:

```python
df['price_x_holiday'] = df['price'] * df['is_holiday_week']
# A significant interaction means price sensitivity differs during holidays —
# often a more actionable finding than either main effect alone.
```

## Log transformations

Because business data is right-skewed, logs are used constantly, and they change how coefficients read:

| Model | Coefficient interpretation |
| --- | --- |
| $y = βx$ | 1 unit increase in x → β unit change in y |
| $log(y) = βx$ | 1 unit increase in x → approx. 100β% change in y |
| $y = β·log(x)$ | 1% increase in x → β/100 unit change in y |
| $log(y) = β·log(x)$ | 1% increase in x → **β% change in y** (an elasticity) |

The log-log form is the standard way to estimate **price elasticity of demand** — a coefficient of −1.4 means a 1% price increase reduces demand by 1.4%, which is directly usable in a pricing decision.

## Prediction vs inference

Two different goals with different priorities, and confusing them causes real mistakes:

| | Inference | Prediction |
| --- | --- | --- |
| Goal | Understand relationships | Forecast accurately |
| Cares about | Coefficients, CIs, assumptions | Out-of-sample error |
| Multicollinearity | Serious problem | Not a problem |
| Model choice | Interpretable, few variables | Whatever performs best |
| Validation | Assumption checks | Train/test split |

> [!WARNING]
> **A regression coefficient is not a causal effect** unless the design supports it. "Ad spend has a positive coefficient" does not mean more ads cause more sales — you probably spend more on advertising when you expect a good week. Omitted variable bias affects observational regression constantly. See [Correlation vs Causation](../../statistics/correlation-vs-causation/).

## Outliers and influence

A single point can dominate a fit. **Leverage** measures how unusual a point's predictor values are; **Cook's distance** measures how much removing it would change the coefficients.

```python
influence = model.get_influence()
cooks_d = influence.cooks_distance[0]
# Points with Cook's D > 4/n deserve investigation
```

Investigate influential points; do not delete them reflexively. A large customer that drives the whole relationship is a finding — one that says your model is really about that customer.

## Key takeaways

- Coefficients read as "change in y per unit of x, holding others constant" — that clause is the point.
- Use confidence intervals rather than p-values when carrying a coefficient into a decision.
- R² measures explained variance, not correctness; never compare it across different outcomes.
- Check residual plots for linearity and constant variance; independence is violated by time series and grouped data.
- Multicollinearity destroys interpretation but not prediction.
- Log-log models give elasticities directly; regression coefficients are not causal by default.

```quiz
[
  {
    "q": "In a regression of units sold, the coefficient on price is -18.4. What does this mean?",
    "options": [
      "Price causes an 18.4 unit decline in sales",
      "Each ₹1 price increase is associated with 18.4 fewer units, holding the other predictors constant",
      "Sales decline 18.4% when price rises",
      "Price explains 18.4% of the variation in sales"
    ],
    "answer": 1,
    "explain": "A coefficient is the associated change in y per unit of x with other predictors held constant. It is causal only if the study design supports a causal reading."
  },
  {
    "q": "Your residuals vs fitted plot shows a funnel widening to the right. What does this indicate?",
    "options": [
      "Multicollinearity",
      "Heteroscedasticity — error variance grows with the fitted value",
      "Non-independence of errors",
      "The model is overfitting"
    ],
    "answer": 1,
    "explain": "A funnel shape means non-constant error variance, common with revenue data. Modelling log(y) or using robust standard errors are the usual fixes."
  },
  {
    "q": "In a log-log model, the coefficient on log(price) is -1.4. What does this tell you?",
    "options": [
      "A ₹1 price rise reduces demand by 1.4 units",
      "A 1% price increase reduces demand by about 1.4% — the price elasticity",
      "Price explains 140% of demand variation",
      "Demand falls by 1.4 units per percent"
    ],
    "answer": 1,
    "explain": "In a log-log specification the coefficient is an elasticity: the percentage change in y per percentage change in x."
  }
]
```
