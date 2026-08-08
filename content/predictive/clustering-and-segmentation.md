---
title: Clustering and Customer Segmentation
description: K-means, choosing k, why scaling decides your answer, and how to turn statistical clusters into segments a business will actually use.
order: 4
difficulty: Intermediate
tags: [modelling, clustering, segmentation, unsupervised]
---

Clustering finds groups in data without being told what the groups are. In business it usually means customer segmentation — but a statistical cluster is only useful when it becomes a segment someone can act on differently.

## K-means

The workhorse algorithm:

1. Choose k, and place k centroids at random.
2. Assign each point to its nearest centroid.
3. Move each centroid to the mean of its assigned points.
4. Repeat 2–3 until assignments stop changing.

It minimises within-cluster sum of squares (inertia). It is fast, scales well, and has three assumptions that are frequently violated: clusters are **spherical**, of **similar size**, and of **similar density**.

## Scaling determines the answer

```python
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# WITHOUT scaling: annual_spend (0-500,000) dominates
# order_count (0-50) entirely. You are clustering on spend alone.
features = df[['annual_spend', 'order_count', 'tenure_months']]

scaler = StandardScaler()
X = scaler.fit_transform(features)          # now all features contribute equally

kmeans = KMeans(n_clusters=4, n_init=10, random_state=42)
df['cluster'] = kmeans.fit_predict(X)
```

> [!WARNING]
> K-means uses Euclidean distance, so a feature measured in rupees will overwhelm one measured in counts by pure magnitude. **Unscaled clustering silently clusters on whichever variable has the largest numeric range.** This is the most common clustering error, and it produces results that look plausible.

For skewed features — and revenue is always skewed — log-transform *before* scaling. Otherwise a handful of enterprise customers each become their own cluster.

## Choosing k

**Elbow method.** Plot inertia against k and look for the bend. Often ambiguous.

**Silhouette score.** Measures how similar each point is to its own cluster versus the nearest other cluster, from −1 to 1. Higher is better; above 0.5 indicates reasonable structure.

```python
from sklearn.metrics import silhouette_score

for k in range(2, 11):
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    print(f"k={k}  inertia={km.inertia_:>10,.0f}  silhouette={silhouette_score(X, km.labels_):.3f}")
```

**The business constraint usually wins.** If marketing can run four campaigns, seven statistically superior clusters are useless. Realistically k is between 3 and 8: fewer is not differentiated, more cannot be operationalised.

> [!TIP]
> Evaluate candidate solutions by profiling them, not by score alone. Run k = 3, 4 and 5, produce the profile table for each, and ask the business team which set of groups they recognise and could treat differently. That conversation is more informative than any silhouette score.

## Beyond k-means

| Algorithm | Strength | Use when |
| --- | --- | --- |
| K-means | Fast, simple | Roughly spherical, similar-sized clusters |
| K-medoids | Robust to outliers | Outliers distort centroids |
| Hierarchical | Dendrogram; no k needed upfront | You want nested structure, n is small |
| DBSCAN | Finds arbitrary shapes; labels noise | Irregular shapes, outliers to isolate |
| Gaussian mixture | Soft assignment, elliptical clusters | You need cluster membership probabilities |

**DBSCAN** deserves mention for a business reason: it explicitly labels points as noise rather than forcing everyone into a cluster. When 5% of customers genuinely do not fit any pattern, that is a more honest output than assigning them arbitrarily.

## Profiling: where the value is

The cluster labels are worthless until you describe what each cluster *is*.

```python
profile = df.groupby('cluster').agg(
    customers      = ('customer_id', 'count'),
    avg_spend      = ('annual_spend', 'mean'),
    median_spend   = ('annual_spend', 'median'),
    avg_orders     = ('order_count', 'mean'),
    avg_tenure     = ('tenure_months', 'mean'),
    churn_rate     = ('churned', 'mean'),
    total_revenue  = ('annual_spend', 'sum'),
).round(2)
profile['revenue_share'] = (profile.total_revenue / profile.total_revenue.sum() * 100).round(1)
```

> [!EXAMPLE]
> | Cluster | Customers | Avg spend | Orders/yr | Tenure | Churn | Revenue share | Name |
> | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
> | 0 | 4,210 | ₹2,100 | 1.4 | 8 mo | 41% | 9% | **Dabblers** |
> | 1 | 1,880 | ₹18,400 | 11.2 | 34 mo | 6% | 36% | **Loyal core** |
> | 2 | 620 | ₹94,000 | 24.6 | 41 mo | 4% | 41% | **Whales** |
> | 3 | 2,940 | ₹6,800 | 3.1 | 5 mo | 28% | 14% | **New & growing** |
>
> Now the segments imply different strategies: protect the whales with named account management; move "new & growing" up the ladder with onboarding; test whether dabblers are worth acquiring at all given 41% churn and 9% of revenue.
>
> **Naming the clusters matters more than it sounds.** "Cluster 2" is forgotten by the next meeting; "Whales" enters the vocabulary and gets used in planning.

## Making segments actionable

A segmentation is only useful if it passes four tests:

1. **Identifiable** — you can tell which segment a customer is in from data you actually have.
2. **Substantial** — big enough to be worth a distinct treatment.
3. **Differentiable** — segments respond differently to the same action. If two segments respond identically, they are one segment.
4. **Actionable** — you have a lever that differs across segments.

That third test is the one most segmentations fail. Statistically distinct groups that all respond the same way to every campaign are a taxonomy, not a strategy.

## Stability

Rerun the clustering on a different time window or a random half of the data. If assignments shift substantially, the structure is not real and you are describing noise.

Also plan for drift: customers move between segments over time, which is often the *interesting* signal. Track transitions — a whale drifting into "loyal core" is an early warning worth acting on.

## Supervised alternatives

If you have a specific outcome in mind — churn, value, propensity — a supervised model is usually more useful than clustering. "Customers likely to churn" is a more actionable group than "cluster 3", because it is defined by the thing you care about.

Use clustering when you genuinely want to *discover* structure. Use supervised models when you know the outcome you are targeting. The two are complementary: cluster to understand the customer base, then predict within segments.

## Key takeaways

- Always scale (and log-transform skewed) features — unscaled k-means clusters on the largest-range variable.
- Choose k from silhouette, elbow *and* the operational constraint of how many treatments you can run.
- The value is in profiling and naming clusters, not in the labels.
- Segments must be identifiable, substantial, differentiable and actionable.
- Test stability across time windows and random splits before committing.
- If you know the outcome you care about, a supervised model usually beats clustering.

```quiz
[
  {
    "q": "You cluster customers on annual_spend (0-500,000) and order_count (0-50) without scaling. What happens?",
    "options": [
      "Both features contribute equally",
      "annual_spend dominates the distance calculation, so you effectively cluster on spend alone",
      "The algorithm fails to converge",
      "order_count dominates because it has fewer distinct values"
    ],
    "answer": 1,
    "explain": "Euclidean distance is driven by absolute magnitude, so a feature ranging to 500,000 overwhelms one ranging to 50. Standardise before clustering."
  },
  {
    "q": "Silhouette analysis suggests k=7 but marketing can only run 4 distinct campaigns. What should you do?",
    "options": [
      "Use k=7 because it is statistically optimal",
      "Use k=4 — a segmentation that cannot be operationalised has no value",
      "Randomly merge three clusters",
      "Abandon the segmentation"
    ],
    "answer": 1,
    "explain": "Segments must be actionable. Statistical optimality that exceeds what the business can execute produces a taxonomy rather than a strategy."
  },
  {
    "q": "Two clusters are statistically distinct but respond identically to every campaign you test. What does this mean?",
    "options": [
      "The clustering algorithm failed",
      "They fail the differentiability test and should be treated as one segment",
      "You need more clusters",
      "The campaigns were poorly designed"
    ],
    "answer": 1,
    "explain": "Segments only earn their existence if they respond differently to the levers you have. Identical response means the distinction is not operationally meaningful."
  }
]
```
