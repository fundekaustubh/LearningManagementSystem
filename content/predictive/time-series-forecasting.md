---
title: Time Series Forecasting
description: Decomposing trend and seasonality, choosing between naive baselines and ARIMA, backtesting properly, and why the confidence interval matters more than the point forecast.
order: 5
difficulty: Advanced
tags: [forecasting, time-series, modelling, planning]
---

Forecasting drives inventory, staffing, budgets and cash planning. It also has a failure mode unique to time series: the ordinary train/test split leaks the future into the past, so a model can look excellent and be worthless.

## Components of a series

Most business series decompose into four parts:

- **Trend** — long-run direction.
- **Seasonality** — fixed-period cycles: weekly (weekday vs weekend), yearly (Diwali, Christmas).
- **Cyclic** — longer swings without a fixed period, like an economic cycle. Harder, often ignored.
- **Residual** — what remains.

```python
from statsmodels.tsa.seasonal import STL

stl = STL(series, period=7, robust=True)   # period=7 for daily data with weekly seasonality
result = stl.fit()
result.plot()
# result.trend, result.seasonal, result.resid
```

**Additive** decomposition ($y = T + S + R$) fits when seasonal swings are a constant *amount*. **Multiplicative** ($y = T × S × R$) fits when they are a constant *percentage* — which is far more common in business, since a growing company's December spike grows with it. Model log(y) additively to get a multiplicative model.

## Start with naive baselines

Every forecasting project must beat these before anything sophisticated is justified. They win more often than people expect.

| Baseline | Rule | Good for |
| --- | --- | --- |
| Naive | $ŷ_t = y_{t-1}$ | Random walks; a surprisingly strong benchmark |
| Seasonal naive | $ŷ_t = y_{t-m}$ | Strongly seasonal series (same day last week) |
| Drift | Last value + average trend | Steady trends |
| Mean | Historical average | Stable, non-trending series |
| Moving average | Mean of last k periods | Noisy series with no trend |

> [!TIP]
> Report every model's error **relative to seasonal naive**. "MAPE 8.2%" is uninterpretable on its own; "MAPE 8.2% versus 13.5% for seasonal naive, a 39% improvement" is a result. Many production forecasting systems have been quietly replaced by seasonal naive after this comparison was finally run.

## Exponential smoothing

Weighted averages with exponentially decaying weights on older observations.

- **Simple (SES)** — level only, no trend or seasonality.
- **Holt's linear** — level plus trend.
- **Holt-Winters** — level, trend and seasonality. The practical workhorse.

```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing

model = ExponentialSmoothing(
    train,
    trend='add',
    seasonal='mul',          # multiplicative: seasonal swings scale with level
    seasonal_periods=12,     # monthly data with yearly seasonality
    damped_trend=True,       # damping prevents runaway long-horizon trends
).fit()

forecast = model.forecast(6)
```

`damped_trend=True` is worth adopting by default. An undamped linear trend extrapolated 24 months out produces forecasts that no business ever achieves.

## ARIMA

ARIMA(p, d, q) combines:

- **AR(p)** — regression on p previous values.
- **I(d)** — differencing d times to achieve stationarity.
- **MA(q)** — regression on q previous forecast errors.

**SARIMA** adds seasonal terms: $(p,d,q)(P,D,Q)_m$.

Stationarity — constant mean and variance over time — is required. Test with ADF/KPSS; achieve it by differencing, and stabilise variance with a log transform first if needed.

```python
import pmdarima as pm

model = pm.auto_arima(
    train,
    seasonal=True, m=12,
    d=None, D=None,             # let the tests choose differencing orders
    stepwise=True,
    suppress_warnings=True,
    information_criterion='aic',
)
forecast, conf_int = model.predict(n_periods=6, return_conf_int=True)
```

ARIMA is strong on short horizons for stable series with clear autocorrelation. It handles multiple seasonalities and irregular holidays poorly, which is a real limitation for retail.

## Prophet and ML approaches

**Prophet** models trend, multiple seasonalities and holiday effects additively. Its strengths are handling missing data, being robust to outliers, and — genuinely useful in business — accepting explicit changepoints and holiday calendars.

```python
from prophet import Prophet

m = Prophet(yearly_seasonality=True, weekly_seasonality=True,
            changepoint_prior_scale=0.05)
m.add_country_holidays(country_name='IN')
m.fit(df.rename(columns={'date': 'ds', 'revenue': 'y'}))

future = m.make_future_dataframe(periods=90)
forecast = m.predict(future)   # yhat, yhat_lower, yhat_upper
```

**Gradient boosting on lag features** (LightGBM with lags, rolling means, calendar features) often wins when you have many related series and external drivers — price, promotions, weather.

> [!WARNING]
> Tree models **cannot extrapolate** beyond the range of the training target. For a series with a strong upward trend, a boosted model will systematically under-forecast. Fix by modelling the *de-trended* series or predicting differences rather than levels.

## Backtesting

Random cross-validation is invalid here — it trains on future data to predict the past.

Use **rolling-origin evaluation** (walk-forward):

```text
Fold 1: train [────────────]  test [──]
Fold 2: train [──────────────]  test [──]
Fold 3: train [────────────────]  test [──]
```

```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5, test_size=30)
for train_idx, test_idx in tscv.split(series):
    train, test = series[train_idx], series[test_idx]
    # fit, forecast len(test), record error
```

Two rules: **test at the horizon you actually forecast** — a model good at 1-day-ahead may be poor at 30 — and **retrain in each fold**, exactly as production would.

## Accuracy metrics

| Metric | Formula | Notes |
| --- | --- | --- |
| MAE | mean(\|y − ŷ\|) | Same units, robust, easy to explain |
| RMSE | √mean((y − ŷ)²) | Penalises large errors more |
| MAPE | mean(\|y − ŷ\|/y) × 100 | Scale-free; **breaks near zero**, punishes over-forecasts asymmetrically |
| sMAPE | Symmetric variant | Fixes some MAPE asymmetry |
| MASE | MAE ÷ naive MAE | Best default: <1 beats naive |

> [!WARNING]
> MAPE is the most-requested and most-flawed metric. With any zero or near-zero actuals it explodes to infinity, and it systematically prefers under-forecasting — an under-forecast caps at 100% error while an over-forecast is unbounded. If someone insists on MAPE, report MASE alongside it.

## Prediction intervals matter more than the point forecast

A point forecast is wrong by construction. The interval is what supports a decision.

Inventory planning does not need "demand will be 4,200 units"; it needs "demand will be between 3,600 and 4,900 with 90% confidence" — because the safety stock level comes from the upper bound and the cost of the lower one.

Model-based intervals are usually too narrow, because they capture parameter uncertainty but not model misspecification or regime change. **Empirical intervals from backtest errors are more honest**: collect your actual out-of-sample errors at each horizon and use their percentiles.

## Practical guidance

1. **Plot the series first.** Trend, seasonality, outliers, level shifts, missing periods. Ten minutes here saves days.
2. **Handle known events explicitly.** Promotions, launches, outages, holidays. Unmodelled, they become "noise" and inflate all your intervals.
3. **Forecast at the level you decide at.** Then reconcile up or down as needed.
4. **Aggregate where possible.** Total demand is much easier to forecast than per-SKU demand; noise cancels on aggregation.
5. **Track forecast accuracy over time.** Degrading accuracy signals a regime change.
6. **Understand the asymmetry of error costs.** Under-forecasting a stockout of a high-margin item costs far more than over-forecasting warehousing. That asymmetry belongs in the decision rule, not in the model.

## Key takeaways

- Decompose into trend, seasonality and residual; business series are usually multiplicative.
- Beat seasonal naive before considering anything complex, and always report error relative to it.
- Use Holt-Winters or SARIMA for classic series; boosted lags when external drivers matter.
- Trees cannot extrapolate trends — model differences or de-trend first.
- Backtest with rolling origins at your real forecast horizon; never split randomly.
- Prefer MASE over MAPE, and report empirical prediction intervals from backtest errors.

```quiz
[
  {
    "q": "Why is random k-fold cross-validation invalid for time series forecasting?",
    "options": [
      "It is computationally expensive",
      "It trains on future observations to predict past ones, which is impossible in production and inflates accuracy",
      "Time series data cannot be split",
      "It requires stationary data"
    ],
    "answer": 1,
    "explain": "Random folds place future data in training. Rolling-origin (walk-forward) validation preserves the temporal ordering that production faces."
  },
  {
    "q": "Your forecast has MAPE of 8.2%. What must you report alongside it?",
    "options": [
      "The R-squared",
      "The error of a naive or seasonal naive baseline, so the improvement is interpretable",
      "The number of parameters",
      "The training time"
    ],
    "answer": 1,
    "explain": "An absolute error figure means nothing without a benchmark. Seasonal naive is the standard comparison, and it beats sophisticated models more often than expected."
  },
  {
    "q": "You use gradient boosting on lag features for a series with a strong upward trend. What problem should you expect?",
    "options": [
      "Overfitting to seasonality",
      "Systematic under-forecasting, because trees cannot predict beyond the training range of the target",
      "The model will not converge",
      "MAPE will be undefined"
    ],
    "answer": 1,
    "explain": "Tree predictions are bounded by observed target values, so a rising series is persistently under-forecast. De-trend the series or model differences instead of levels."
  }
]
```
