# Uncertainty audit — 2026-09-07

The old 5.9–24.2 h Astra range was too narrow to serve as the main uncertainty readout. It propagated only Astra's ECI endpoints through a fixed regression. It did not include uncertainty in that regression or variation between models. The default chart now shows a **3.1–48.3 h index-plus-fit prediction envelope**, with the central estimate still **11.56 h**, using Epoch directly. This is broader but still not an end-to-end confidence interval. “Index uncertainty only” remains available as a comparison mode.

## Exact calculation before this audit

The calibration fitted the natural logarithm of published p80 hours on Epoch ECI:

```text
log(h) = a + b × ECI
a = -23.698399285395016
b = 0.15449956686718874
```

For Astra, `ECI = 169.23`, with a published 90% interval `[164.85, 174.02]`. The old bounds were simply:

```text
center = exp(a + b × 169.23) = 11.5601 h
lower  = exp(a + b × 164.85) =  5.8759 h
upper  = exp(a + b × 174.02) = 24.2306 h
```

No parameter in those bounds depended on the regression's residuals, sample size, or extrapolation distance. Even a poorly fitted curve would have received such bounds. This was an input-uncertainty transformation, not a prediction interval for a new model.

## Calculation now used by default

For each candidate index `x`, the classical log-linear model gives the following nominal 90% prediction interval:

```text
predicted log(h) ± t(0.95, n−2) × s × sqrt(1 + 1/n + (x−mean(x))²/Sxx)
Sxx = sum((x_i−mean(x))²)
s²  = sum(log-residual_i²)/(n−2)
```

The `1` inside the square root adds the uncertainty of an individual new model, beyond uncertainty in the fitted mean relationship. The other terms account for uncertainty in the intercept/slope, including their covariance through centered predictor coordinates. Uncertainty grows with distance from the calibration sample. Finally, exponentiation returns the endpoints to hours. [NIST's prediction-interval explanation](https://www.itl.nist.gov/div898/handbook/pmd/section5/pmd512.htm)

For the 21-model fit, `s = 0.3309779557` log-hours and `t(0.95, 19) = 1.7291328115`. Holding Astra's ECI at 169.23 gives **5.96–22.42 h**. The interval for the *mean log response* is narrower, **8.28–16.13 h**; that narrower mean interval is not appropriate as the uncertainty of an individual new model.

The chart's envelope is the union of the conditional prediction intervals across Astra's input range `[164.85, 174.02]`. For a linear fit, the lower log limit is concave in `x` and the upper limit is convex, so the extrema occur at the endpoints. The result is **3.0965–48.2669 h**.

This envelope combines a 90% input range and nominal 90% conditional prediction limits. It must **not** be called a 90% joint interval. The component confidence levels do not automatically give the same coverage for their combination, and the modeling assumptions are not fully validated here. The implementation explicitly stores `overallCoverage: null`.

The same method is applied to the separate Claude AECI series. Reported AECI inputs have 95% intervals, while the conditional regression limits use 90%. Mythos Preview's digitized score has no digitized input interval: its shown prediction limits hold that approximate index fixed, with the missing component labeled explicitly. Astra is never converted to AECI.

## Measurement uncertainty: checked against task-level data

Marginal confidence intervals for different METR model horizons cannot be sampled independently without discarding their dependence. METR explicitly notes that task resampling produces correlated measurement uncertainty across models. [METR's GPT-5 report](https://metr.org/evaluations/gpt-5-report/)

To inspect this directly, the audit used [METR's public per-task results](https://metr.org/assets/task_results_1_1.yaml), including task identifiers, human minutes, success counts, attempt counts, and task weights. A local reconstruction of the weighted, regularized logistic fits matches **all 21 calibration horizons within 0.045%** of the published central estimates. Differences come from published weight rounding and solver tolerances; this is not a byte-for-byte rerun of METR's original pipeline.

The diagnostic resamples **79 task families**, then tasks within each sampled family, then binary attempts for each model. All models share the same family/task resample, retaining cross-model dependence. The 228 unique task IDs use their prefix as family membership; every ID was checked against the raw public task-family mapping and no mismatch or missing ID was found. The attempt-level binomial draw is equivalent to sampling the empirical binary attempts with replacement. Original weight normalization and the source regularization `1e-5` are preserved.

With **10,000 draws** and seed `739421`, and every ECI score held fixed, fitting the ECI-to-log-p80 relationship on each resample produces an Astra regression-estimate range of **5.22–25.49 h** (5th–95th percentiles; median 11.95 h). Median pairwise correlation of bootstrapped log horizons is approximately **0.300**. The small reconstruction differences are recentered on the published values before fitting the cross-model regression.

This measures sensitivity of the *fitted estimate* to the METR sample. It does not include target ECI uncertainty, uncertainty in calibration ECI scores, a new model's residual deviation from the relationship, human-duration measurement error, or a different success-curve family. It is a separate diagnostic, not a complete predictive interval. It is not blindly added to OLS parameter uncertainty because the two can count some of the same variation.

## Model-choice sensitivity

The same index-plus-fit envelope changes substantially under different calibration samples:

| Calibration | Central Astra p80 | Index + fit envelope |
| --- | ---: | ---: |
| All 21 overlapping models | 11.56 h | 3.10–48.27 h |
| Twelve models released from 2025 onward | 4.41 h | 1.66–14.14 h |
| Eleven OpenAI models | 8.32 h | 2.21–35.78 h |
| Eight Claude models, using Epoch ECI | 20.73 h | 3.90–139.69 h |

The span **1.7–140 h** is a sensitivity range across these choices, not a confidence interval and not an instruction to weight the alternatives equally. The Claude-only fit assumes the Claude relationship transfers to OpenAI. The recent-model fit has a narrower index range. Neither choice is automatically superior to the pooled fit.

The METR-excluded IRT refit still yields a central Astra estimate of 11.46 h, as documented in the AECI follow-up. No uncertainty interval for that alternative index was bootstrapped, so the chart does not invent one. The two-anchor GPT-4→o3 continuation also lacks enough observations to estimate residual variance and therefore has no displayed regression prediction interval.

## Remaining uncertainty and potential bias

- **Calibration measurement errors.** OLS treats historical ECI scores as exact. Their uncertainty and shared fitted scale can affect the regression slope. The joint METR diagnostic measures a different, correlated source of error. A validated joint errors-in-variables model would be needed to combine them into a full predictive distribution.
- **Correlated model families.** The classical formula assumes independent residuals. Successive releases are related, and 21 models are not 21 independent model-development processes. This limits interpretation of the nominal t interval.
- **Human baseline times.** The task bootstrap holds each task's human duration fixed. These durations themselves are noisy and some are estimates. They add both uncertainty and possible directional bias.
- **Success-curve assumptions.** METR uses one two-parameter logistic curve to infer p50 and p80. Alternative reasonable shapes can change p80 substantially; these choices are not covered by our cross-model residual band.
- **Benchmark/task selection and generalization.** A finite software-task suite cannot identify the horizon across all economically relevant work. Horizon estimates vary with the task mix and do not directly measure autonomous runtime.
- **Harness, reasoning effort, and elicitation.** Epoch aggregates best benchmark settings, while METR evaluates a particular setup. This mismatch can produce systematic differences, especially for new models.
- **Extrapolation and task-suite saturation.** Astra is beyond the observed index range. The linear log-horizon relationship can change, and METR cautions about measurements above the supported task-duration range. A statistical interval conditional on a functional form does not protect against that functional form failing.
- **Scenario curve.** The red polynomial has no recoverable source coordinates, fit uncertainty, or predictive distribution in the repository. Its uncertainty remains unknown; no ribbon has been invented for it.

METR discusses baseline noise, success-curve sensitivity, and task distribution as distinct issues in its [modeling-assumptions analysis](https://metr.org/notes/2026-03-20-impact-of-modelling-assumptions-on-time-horizon-results/). These effects should not be converted into arbitrary extra multipliers just to make the range wider.

## Reproduction and verification

- `npm run audit:metr` prints input-only bounds, conditional intervals, envelopes, model-choice sensitivity, and the saved task-bootstrap diagnostic.
- `npm test` checks t critical values against SciPy, interval values against an independent Python calculation, unit invariance, increasing extrapolation error, envelope containment, and the source archive hash.
- `scripts/bootstrap-metr-uncertainty.py --draws 10000 --output /tmp/metr-bootstrap.json` reruns the joint diagnostic using Python with NumPy and SciPy. The script invokes Node to read the current calibration points. Its output does not silently replace the saved audit result.
- The task archive and source metadata are in `docs/data/metr-task-results-2026-09-07.json.gz` and `docs/data/metr-task-bootstrap-source.json`. Metadata pins the retrieved source SHA-256 and reference-code commit. The saved audit includes per-model reconstruction and marginal interval checks.

All intervals retain the 80%-task-success definition of p80. Statistical confidence levels describe uncertainty about a horizon; they do not change that task-success target.
