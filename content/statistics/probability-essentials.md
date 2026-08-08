---
title: Probability Essentials for Analysts
description: Conditional probability, independence and Bayes' theorem — the small amount of probability theory that prevents large business mistakes.
order: 2
difficulty: Beginner
tags: [statistics, probability, bayes]
---

You do not need measure theory to be a good analyst. You do need to be fluent in conditional probability, because almost every business misinterpretation of data is a conditional probability mistake wearing a disguise.

## The basics in one screen

A probability is a number in [0, 1] describing how likely an event is.

- **Complement:** $P(not A) = 1 - P(A)$
- **Addition:** $P(A or B) = P(A) + P(B) - P(A and B)$ — subtract the overlap so it is not double-counted.
- **Multiplication:** $P(A and B) = P(A) × P(B|A)$
- **Independence:** A and B are independent if $P(B|A) = P(B)$; then $P(A and B) = P(A) × P(B)$.

## Conditional probability

$P(A|B)$ — "probability of A given B" — restricts the world to cases where B happened.

$P(A|B) = P(A and B) / P(B)$

This is what almost every business metric actually is:

- Conversion rate = P(purchase | visited)
- Churn rate = P(cancels this month | was active at month start)
- Click-through rate = P(click | impression)

Which means the **denominator is a modelling choice**, and quietly changing it changes the metric. "Email conversion rate" computed over sent, delivered, opened or clicked emails gives four very different numbers from the same campaign.

> [!WARNING]
> $P(A|B) ≠ P(B|A)$. This inversion is the single most common statistical error in business.
>
> "80% of churned customers had a support ticket" is $P(ticket | churned)$. It does **not** mean tickets cause churn. If 75% of *all* customers file a ticket, the association is nearly nothing. The number you need is $P(churn | ticket)$ versus $P(churn | no ticket)$.

## Bayes' theorem

Bayes' theorem inverts a conditional probability properly:

$P(A|B) = P(B|A) × P(A) / P(B)$

In analyst terms: **posterior = likelihood × prior / evidence**. It tells you how much to update a belief when new evidence arrives, and it makes explicit that the base rate matters.

> [!EXAMPLE]
> **The fraud-detection trap.** A model flags fraudulent transactions.
>
> - Base rate: 1 in 1,000 transactions is fraud → $P(F) = 0.001$
> - Sensitivity: it catches 95% of fraud → $P(flag|F) = 0.95$
> - False positive rate: 2% of legitimate transactions → $P(flag|not F) = 0.02$
>
> A transaction is flagged. What is the probability it is actually fraud?
>
> Out of 100,000 transactions:
> - Fraudulent: 100. Flagged: 95.
> - Legitimate: 99,900. Flagged: 1,998.
> - Total flagged: 2,093, of which 95 are fraud.
>
> $P(F|flag) = 95 / 2093 ≈ 4.5\%$
>
> A "95% accurate" model produces flags that are wrong **95% of the time**. Not because the model is bad, but because the base rate is tiny. This is the base rate fallacy, and it is why rare-event models need precision-focused evaluation rather than accuracy.

The frequency framing used above ("out of 100,000...") is worth adopting permanently — it is the same arithmetic as the formula but far harder to get wrong, and it is much more persuasive in a meeting.

## Independence and its failures

Two events are independent if knowing one tells you nothing about the other. Business events are **rarely** independent, and assuming they are is a reliable source of underestimated risk.

- Two customers churning: not independent if a price rise hit both.
- Two loans defaulting: not independent if both borrowers work in the same industry.
- Two servers failing: not independent if they share a power supply.

Correlated failures are how "one-in-a-million" events happen quarterly. Whenever you multiply probabilities together, ask explicitly what shared cause could link them.

## Expected value

The probability-weighted average of outcomes: $E[X] = Σ xᵢ × P(xᵢ)$.

This turns uncertainty into a single comparable number, which is what decisions need.

> [!EXAMPLE]
> A retention offer costs ₹500 per customer and saves a customer worth ₹8,000 with probability 0.30.
>
> $E[value] = 0.30 × 8000 - 500 = ₹1,900$ per customer contacted.
>
> Positive, so contact them — *if* the 0.30 is real. It is worth noting that this arithmetic also gives you the break-even success rate: 500/8000 = 6.25%. Framing it that way ("we need better than a 1-in-16 save rate") is usually more convincing than the expected value itself.

**Caution:** expected value assumes you can repeat the bet many times. For one-shot decisions where a bad outcome is catastrophic — a bet that could bankrupt the company — maximising expected value is the wrong objective.

## Probability mistakes that cost money

**The conjunction fallacy.** A specific scenario feels more likely than a general one, though it must be less likely. P(A and B) ≤ P(A), always.

**The gambler's fallacy.** "We've had five bad quarters, we're due a good one." Independent events have no memory. (If they are *not* independent, you have a trend, not a due correction.)

**Ignoring the denominator.** "Complaints from the Delhi region doubled." So did Delhi orders. The rate is flat.

**Survivorship bias.** Analysing only surviving customers/products/companies. The failures are absent from the data, so anything you learn is conditioned on success.

**Confusing "not significant" with "no effect."** Failing to detect an effect is not evidence there is none, especially with small samples.

## Key takeaways

- Most business metrics are conditional probabilities, so the denominator is a decision.
- $P(A|B) ≠ P(B|A)$; inverting them is the most common and most expensive statistical error.
- Bayes' theorem formalises the inversion, and base rates dominate for rare events.
- Reason in natural frequencies ("out of 100,000...") rather than formulas.
- Business events are rarely independent; correlated failures make rare events common.
- Expected value guides repeatable decisions, not one-shot catastrophic ones.

```quiz
[
  {
    "q": "A model flags fraud with 95% sensitivity and a 2% false positive rate. Fraud occurs in 0.1% of transactions. Roughly what share of flagged transactions are actually fraudulent?",
    "options": ["95%", "About 50%", "About 5%", "About 0.1%"],
    "answer": 2,
    "explain": "Of 100,000 transactions: 95 true positives and 1,998 false positives, so precision is 95/2093 ≈ 4.5%. The tiny base rate dominates."
  },
  {
    "q": "'80% of churned customers contacted support.' What additional number do you most need before concluding support drives churn?",
    "options": [
      "The total number of support tickets",
      "The share of retained customers who also contacted support",
      "The average ticket resolution time",
      "The number of support agents"
    ],
    "answer": 1,
    "explain": "You have P(ticket | churned). To assess association you need the comparison group — P(ticket | retained). If it is similar, the association is illusory."
  },
  {
    "q": "A retention offer costs ₹500 and saves an ₹8,000 customer with probability p. What is the break-even p?",
    "options": ["6.25%", "16%", "50%", "62.5%"],
    "answer": 0,
    "explain": "Break-even when p x 8000 = 500, so p = 0.0625, or 6.25%."
  }
]
```
