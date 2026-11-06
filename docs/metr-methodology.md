# Task-horizon audit — 2026-09-07

Follow-up: [AECI and Astra: deeper review](aeci-follow-up.md) adds a separately calibrated AECI series and measures the effect of removing METR from ECI. It supersedes the initial blanket exclusion of AECI. Astra stays on Epoch ECI directly; AECI is used only for Claude models. The [uncertainty audit](uncertainty-audit.md) now expands the default bounds to a 3.1–48.3 h index-plus-fit prediction envelope next to Astra’s 11.6 h central estimate. The old 5.9–24.2 h input-only range remains available for comparison.

The previous chart was not statistically rigorous. The revised chart is reproducible, but its ECI predictions remain exploratory. In particular, they do not establish a lower bound on Astra's capabilities or independently confirm the AI 2027 scenario.

## Findings and corrections

1. **The ECI-to-p80 fit could not be reproduced.** Hours were hard-coded, with no calibration rows, coefficients, selection rule, or diagnostics. Updating a new model's ECI while leaving an older calibration unchanged is unsafe because Epoch jointly refits its scores. The replacement fits all 21 explicit model/version matches in a single dated snapshot.
2. **The green points substituted raw values across scales without calibration.** Opus 5 used Anthropic AECI; Mythos Preview used an assumed ECI of 161. Mythos 5 is a different model and does not validate that assumption. All green points now use the same Epoch snapshot. The assumed Mythos point is removed; its actual published METR measurement remains. AECI is now reintroduced as a separate purple approximation using its own calibration; see the follow-up.
3. **“Best METR” was not a published p80.** Sol's 14.0 h was a conversion of the 71 h p50 variant that discarded cheating attempts. The standard-scoring p50 is 11.3 h, and METR calls neither measurement robust. No model-independent p50-to-p80 conversion exists. The converted point is removed from the published series; Sol now appears only as an ECI estimate. The highest published p80 in the snapshot is Mythos Preview (early), 3.0985 h. [METR's Sol report](https://metr.org/blog/2026-06-26-gpt-5-6-sol/)
4. **The reported intervals were mislabeled and incomplete.** Epoch's Astra interval is 90%, not 95%. Transforming its endpoints through a fixed regression propagates ECI uncertainty only; it does not produce a confidence interval for a new model's horizon. The chart now names this limitation and shows the published METR intervals as well. [Epoch's Astra page](https://epoch.ai/models/gpt-6-astra)
5. **The explanation of ECI omitted target leakage.** ECI includes METR Time Horizons, alongside agent benchmarks including Terminal-Bench and OSWorld. A high in-sample correlation with METR cannot by itself serve as independent validation. The follow-up removes all METR observations and fully refits ECI: the correlation remains strong and the Astra estimate changes only from 11.56 to 11.46 h. Direct target overlap therefore has little numerical effect here. A systematic direction of bias is not established. [Epoch's included benchmarks](https://epoch.ai/data/eci-documentation/data)
6. **The red curve is an unvalidated reconstruction.** The repository stores a seventh-degree polynomial in decimal year for the natural logarithm of seconds. It contains no original coordinates, fitting procedure, residuals, or source uncertainty. Git commit `9d42c3b` replaced an earlier piecewise approximation with this polynomial. Its numerical values are retained, labeled approximate, and displayed with a dashed line. Neither this audit nor finite-value checks validate its shape as Daniel's original forecast.
7. **The axis mixed time conventions.** Axis labels used 40-hour weeks and 160-hour months, while headline formatting converted hours into 24-hour days. Values above an hour now stay in hours. The fixed snapshot date is labeled “as of” rather than “today.”

## Reproducible calculation

`src/data/metrCalibration.js` preserves all 26 published METR rows and the relevant Epoch rows, source URLs, retrieval date, SHA-256 hashes of the retrieved upstream files, units, explicit joins, and exclusions. Sources:

- [METR Horizon 1.1 source data](https://metr.org/assets/benchmark_results_1_1.yaml)
- [Epoch's model data](https://epoch.ai/data/benchmarked_models.csv)

Published horizons are stored in minutes and converted to hours exactly once. Every plotted blue central estimate and interval comes from that snapshot. Pre-2023 measurements remain in the source data; some fall outside the displayed chart domain.

Calibration includes every explicitly matched model released since 2023. GPT-5.1 Codex Max and Mythos Preview have no matching Epoch ECI in the snapshot; neither is replaced by a related model. The three pre-2023 measurements also lack a matching ECI. No frontier-only filter, reliability conversion, assumed index, or derived horizon enters calibration. Joins match named model versions, but they cannot guarantee equivalent inference settings: Epoch aggregates benchmark settings while METR measures a particular model-and-harness combination.

With equal model weights, ordinary least squares gives:

```text
ln(p80 hours) = -23.698399285395016 + 0.15449956686718874 × ECI
n = 21
in-sample R² in log space = 0.9670648815494046
residual standard deviation in log space = 0.33097795572283767
calibration ECI range = 125.88 to 156.77
```

Exponentiating the fitted log response produces a geometric central estimate. It is not an arithmetic expected value or a lower bound. This is a local descriptive regression, not an official METR or Epoch forecast.

| Model | Epoch ECI | p80 estimate | Transformed 90% ECI endpoints only | 2025+ calibration |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.4 Pro | 158.89 | 2.34 h | 1.63–3.60 h | 1.58 h |
| GPT-5.6 Sol | 162.03 | 3.80 h | 2.64–6.01 h | 2.16 h |
| Claude Opus 5 | 162.33 | 3.98 h | 2.67–6.78 h | 2.23 h |
| GPT-6 Astra | 169.23 | 11.56 h | 5.88–24.23 h | 4.41 h |

The 2025+ column uses all 12 eligible models released from January 2025 onward. It is a sensitivity check, not a preferred alternative selected for its answer. Leaving out one calibration model at a time yields Astra estimates from 10.90–13.43 h. The multiplicative leave-one-out RMSE is 1.416, but this is not independent validation because the ECI inputs already contain METR information and related model families recur across folds.

The former Astra value, 15.1245 h, was already above 15 h. The current data do not establish that Astra's p80 must exceed 15 h. That value remains plausible given the uncertainty, but its use as a minimum would be an additional assumption. A separate regression of published **p50** values on ECI for the same 21 models yields approximately **66.9 h** for Astra. That is a different reliability target, remains extrapolative, and is not plotted on the p80 chart.

For a fitted success curve `P(success | t) = sigmoid(a + b ln(t))`, with `b < 0`, the ratio `t80/t50 = exp(log(4)/b)` depends on the model's fitted slope. A median ratio across models is not a measurement of another model's p80.

## What remains unresolved

- The follow-up completed the full ECI refit with METR excluded. Independent predictive validation on held-out model families and later releases still remains; a central ablation alone does not establish forecast calibration.
- OLS treats ECI as exact and ignores the uncertainty and dependence in both axes. The input-only ranges in the table above omit calibration residuals and coefficient uncertainty. The default plotted envelope now includes classical regression prediction error, but correlated measurement errors, model-family dependence, harness effects, and distribution shift remain unresolved. No comprehensive horizon confidence interval is claimed.
- Astra is 12.46 ECI points beyond the strongest calibration model. The large shift under the recent-model fit demonstrates structural uncertainty that a high in-sample R² does not resolve.
- METR cautions that its current suite is unreliable above 16 hours. Its own doubling-time fit excludes central p50 estimates above 16 hours. That exclusion is not a universal numerical cap on p80 forecasts. [METR methodology](https://metr.org/time-horizons/)
- The red polynomial's provenance must be recovered to validate its numerical agreement with the original forecast. It has no estimated statistical uncertainty. The chart now continues the same polynomial beyond the initial window at the user’s request, sampling the visible range in log space; this is mathematical extrapolation, not newly verified forecast data. The [AI 2027 timelines forecast](https://ai-2027.com/research/timelines-forecast) provides context, not verification of these coefficients.

Run `npm run audit:metr` to print the matches, coefficients, sensitivity checks, and estimates. Run `npm test` for numerical and data-integrity checks. These checks establish implementation consistency, not scientific predictive validity.
