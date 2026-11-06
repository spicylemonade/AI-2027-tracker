# Task-horizon chart: methodology

Data as of 2026-11-05. `scripts/horizon_analysis.py` produces every number below from the frozen inputs in `docs/data`, using a fixed random seed. Full results are in [`docs/data/horizon-analysis.json`](data/horizon-analysis.json).

## Summary

The chart plots p80 task horizons: how long a task, in human time, AI agents can complete with 80% success on METR's software tasks. METR's last published p80 is Claude Mythos Preview (early), 3.10 h. Everything newer is an estimate from a capability index, not a measurement.

| Model | Index | Score | p80 estimate | 90% range |
|---|---|---|---:|---:|
| GPT-6 Astra | Epoch ECI | 169.07 | 9.0 h | 4.2–18.0 h |
| Claude Opus 5 | AECI | 169.33 | 9.2 h | 5.2–16.7 h |
| Claude Opus 5.5 | AECI | 174.56 | 19.9 h | 10.6–37.4 h |
| Anthropic Model 4 (internal) | AECI | 178.6 | 36.1 h | 12.5–186 h |

The AI 2027 scenario curve is at 36.2 h on the as-of date, on the same TH1.1 scale.

Four conclusions matter most:

1. **Every estimate's range includes the AI 2027 curve.** The central estimates run from about 5 weeks behind it (Astra) to about 6 weeks ahead (Model 4).
2. **ECI and AECI disagree only where METR has no data.** They agree within 2 points on the Claude models METR has measured and both score, then split by up to 6.2 points. METR's results can't show which is right, so the chart shows both and names no single headline number.
3. **ECI's coding coverage is not an obvious weakness.** ECI includes long-running agentic benchmarks, and indexes built only from those benchmarks predicted METR worse than the full ECI.
4. **The estimates have been checked against held-out results.** The ECI ranges held 11 of 12 forward tests. AECI has too few measured models for a strong test, and 3 of its 5 forward tests fell inside the range.

## ECI estimate

**Fit.** Ordinary least squares of ln(p80 hours) on Epoch ECI, for the 20 models released since 2023 that have both a published METR p80 and an Epoch score:

ln(p80) = −22.2044 + 0.14433 × ECI, with R² 0.971, residual SD 0.313, and a leave-one-out error factor of 1.40.

The fit is descriptive, and it depends on one snapshot of Epoch's scores. Epoch refits all scores jointly, so a refresh must replace every row at once.

**Range.** The 90% range is a Monte Carlo predictive interval. Each draw takes one of Epoch's 500 joint posterior score sets, refits the line, and adds model-to-model scatter. METR's own sampling error is left out of the headline range. Adding it, by resampling METR's tasks within task families, widens Astra to 2.7–30.4 h. That reconstruction matches METR's published p80s within 0.04%.

**Backtest.** Each model from o1 onward was predicted using only models released before it.

| Predictor | RMSE factor | Bias factor |
|---|---:|---:|
| ECI, all earlier models | 1.44 | 0.93 |
| ECI, last 10 models | 1.39 | 0.94 |
| Last measured model + 5 ECI points per doubling | 1.35 | 0.97 |
| Release date only | 1.92 | 1.50 |

ECI clearly beats the release date. The three ECI variants are too close to separate on 12 tests, so the chart keeps the simplest one. The range held 11 of 12 results, both with the classical interval and with the Monte Carlo interval. The miss was GPT-5.4.

| Model | Released | Actual ÷ predicted |
|---|---|---:|
| o1 | 2024-12-05 | 0.82 |
| Claude 3.7 Sonnet | 2025-02-24 | 1.61 |
| o3 | 2025-04-16 | 1.40 |
| Claude Opus 4 | 2025-05-22 | 1.56 |
| Claude Opus 4.1 | 2025-08-05 | 1.20 |
| GPT-5 | 2025-08-07 | 0.81 |
| Gemini 3 Pro | 2025-11-18 | 0.77 |
| Claude Opus 4.5 | 2025-11-24 | 0.88 |
| GPT-5.2 | 2025-12-11 | 0.81 |
| Claude Opus 4.6 | 2026-02-05 | 0.67 |
| Gemini 3.1 Pro | 2026-02-19 | 0.94 |
| GPT-5.4 | 2026-03-05 | 0.45 |

The last 7 all came in below prediction, with a geometric mean of 0.74, which is a warning that the line may run high. Mythos Preview (early) points the other way: it has no Epoch score, and on an interpolated score of 159.1 it came in 1.45× above the line.

**Sensitivity of the Astra estimate.** These are alternatives, not a distribution.

| Variant | Astra p80 | Note |
|---|---:|---|
| Last 10 models only | 3.6 h | |
| Quadratic in ECI | 4.1 h | curvature p = 0.083 |
| 5 points per doubling, from GPT-5.4 | 4.3 h | |
| Quadratic with interpolated Mythos | 6.1 h | curvature p = 0.26 |
| Line × recent backtest bias | 6.7 h | |
| OpenAI models only | 6.8 h | |
| **Pooled line (shown)** | **9.0 h** | |
| Drop tasks under 4 minutes | 9.2 h | METR-flagged modelling choice |
| Add interpolated Mythos to the line | 9.7 h | |
| Theil-Sen robust line | 12.0 h | |
| Drop tasks under 1 minute | 12.1 h | METR-flagged modelling choice |
| 5 points per doubling, from interpolated Mythos | 12.3 h | |
| Claude models only | 13.6 h | |

Vendor intercepts (p = 0.89) and a release-date term (p = 0.63) add nothing significant, so the pooled line stays.

## Does a coding-focused index do better?

No, on the data available. Domain indexes were built the way Epoch builds its domain-specific ECI: hold benchmark parameters fixed and refit each model's capability on a subset. The benchmark lists were chosen before looking at results.

| Index | Models | R² | LOO factor | Published ECI on same models | Astra p80 |
|---|---:|---:|---:|---|---:|
| ECI without METR's own benchmark | 20 | 0.970 | 1.39 | 0.971, 1.40 | 9.1 h |
| Software engineering benchmarks | 16 | 0.904 | 1.68 | 0.955, 1.44 | 11.4 h |
| Agentic benchmarks | 11 | 0.811 | 1.82 | 0.920, 1.52 | 5.6 h |

METR's data enters ECI as one benchmark, but removing it barely changes the estimate, so target leakage is negligible. Astra's ECI uses 24 benchmarks, 7 of them agentic: APEX-Agents, EBR-bench, FrontierCode, FrontierSWE, GSO-Bench, MirrorCode and Remote Labor Index.

This doesn't prove that better long-horizon coding tests would add nothing. It shows that the ones already in Epoch's data don't predict METR's results better than the full index.

## AECI estimate

AECI is Anthropic's fork of ECI, built mostly on internal benchmarks. Anthropic says its scores are not directly comparable with Epoch's, so the two never share a fit.

**Fit.** Eight Claude models with a published p80, using scores from one figure on one fit (METR's November 5 assessment):

ln(p80) = −22.6827 + 0.14709 × AECI, with R² 0.989 and residual SD 0.221.

Scores read from the figure are good to about 0.1 AECI. Three checks on the reading: Claude 3.5 Sonnet reads 129.96 against its anchor of 130, Model 4 reads 178.67 against METR's 178.6, and Opus 5.5 reads 174.67 against the 174.56 in the Haiku 5.5 system card.

**Refits.** Each refit moves the whole scale. Opus 5.5 went from 169.36 to 174.56 between the September and October fits. Never pool scores across fits. But the p80 estimates hold up, because the calibrators move with it:

| Fit | Line slope | Opus 5 score → p80 | Opus 5.5 score → p80 |
|---|---:|---:|---:|
| July | 0.182 | 162.10 → 9.2 h | |
| September | 0.168 | 165.18 → 10.1 h | 169.36 → 20.3 h |
| October | 0.149 | 169.33 → 9.8 h | 174.56 → 21.3 h |

These use the 7 calibrators common to all three fits. The shown estimate for Opus 5.5 is 19.9 h because it also includes Mythos Preview (early).

**Range for Opus 5 and 5.5.** Because shared scale movement is absorbed by the calibration, the score error uses Anthropic's "local" range rather than its "global" one: the Opus 5.5 local 95% range of 167.99–171.24, or SD 0.83. Its global range is 165.23–177.05.

**Range for Model 4.** Borrowing Opus 5.5's error would give 18.8–69.7 h, which is too narrow: Model 4's score rests on 15 benchmarks against Opus 5.5's 43, and METR's figure shows a much wider range for it, about 170.6–192.8, read here as 95%. The local range isn't published, so the shared part, measured from Opus 5.5 as global minus local variance, is removed from each side. That leaves SDs of 3.6 below and 6.2 above, and a range of 12.5–186 h. Using METR's whole range gives 11.4–235 h.

**How it compares with ECI.** On the same 7 Claude models, AECI fits METR better (R² 0.985, LOO 1.37) than ECI does (R² 0.972, LOO 1.52). That is a small sample, and AECI is vendor-run. The fit on 7 models predicted Mythos Preview (early) at 3.47 h against a measured 3.10 h. Forward tests are weaker: fitting earlier models and predicting the next, the ratios of actual to predicted were 1.08, 1.01, 0.67, 0.53 and 0.89, and only 3 of 5 fell inside the 90% range.

| Model | AECI | ECI | Gap | METR p80? |
|---|---:|---:|---:|---|
| Claude 3 Opus | 124.71 | 125.63 | −0.92 | yes |
| Claude 3.5 Sonnet | 130.00 | 130.00 | 0.00 | yes |
| Claude 3.5 Sonnet (October 2024) | 133.18 | 133.42 | −0.24 | yes |
| Claude 3.7 Sonnet | 141.73 | 140.99 | 0.74 | yes |
| Claude Opus 4 | 144.78 | 142.83 | 1.95 | yes |
| Claude Opus 4.5 | 152.31 | 151.82 | 0.49 | yes |
| Claude Opus 4.6 | 157.25 | 156.30 | 0.95 | yes |
| Claude Opus 4.7 | 160.27 | 157.55 | 2.72 | no |
| Claude Opus 4.8 | 163.41 | 159.89 | 3.52 | no |
| Claude Opus 5 | 169.33 | 164.45 | 4.88 | no |
| Claude Mythos 5.1 / Fable 5.1 | 172.51 | 166.90 | 5.61 | no |
| Claude Opus 5.5 | 174.56 | 168.36 | 6.20 | no |

On Epoch's index Opus 5.5 is 8.1 h (3.8–16.1 h), against 19.9 h on AECI. That gap is the main open question on the chart.

## AI 2027 scenario curve

**Checked against its authors.** The curve matches the [authors' grading sheet](https://docs.google.com/spreadsheets/d/1JfEJRIwGe7fSCIW14eC7q0sEhVWHEdetykVh9g9XnF8/edit?gid=1928509176#gid=1928509176):

| Check | Curve | Authors |
|---|---:|---:|
| At publication (2025-04-03) | 15.4 min | 15 min |
| At 2026.30 | 221 min | 231 min |
| Reaches 279 min | 2026.364 | 2026.35 |

Beyond the authors' graded window it is a mathematical continuation of their trajectory.

**Rebased to TH1.1.** The curve is on METR's older TH1.0 scale, and the published points are on TH1.1, so they can't be compared directly. The curve is scaled so that it matches TH1.1 at Claude 3.7 Sonnet, the best model when AI 2027 was published: 12.09 min ÷ 15.44 min = 0.783. The authors make the same adjustment with 2/3, from 15 to 10 min. METR's current file gives 12.09 min, so the chart uses that.

A constant factor is an approximation. The TH1.1 ÷ TH1.0 ratio across 15 models ranges from 0.37 to 1.37, and it rises over time. The authors note that they care more about the pace of progress than absolute values. Any comparison with the curve carries this uncertainty, on top of the ranges below.

**Weeks relative to the curve**, comparing each model's date with when the curve reached its estimate:

| Point | Central | From its range | With authors' 2/3 |
|---|---:|---:|---:|
| Mythos Preview (early), measured | 3.0 ahead | 13.1 ahead to 7.3 behind | 5.3 ahead |
| GPT-6 Astra, ECI | 4.6 behind | 2.7 ahead to 13.9 behind | 2.7 behind |
| Claude Opus 5.5, AECI | 1.0 ahead | 6.7 ahead to 5.4 behind | 2.6 ahead |
| Model 4, AECI | 5.9 ahead | 17.9 ahead to 4.0 behind | 7.3 ahead |

Public models plot at their public release date, while Model 4 plots at the date METR shows it reaching most Anthropic employees. Internal models come earlier than public ones, so public points can look further behind the curve than the labs are.

## Other evidence checked

**GPT-5.6 Sol.** METR's direct measurement is a p50, not a p80, and it isn't plotted: no model-independent conversion exists, and METR called none of its Sol numbers robust. It is still a useful check. A p50 fit on ECI predicts 20.9 h (12.4–35.3 h). METR found 11.3 h (95% CI 5–40 h) under standard scoring, and 71 h (13–11,400 h) when discarding cheating attempts. Both are consistent with the fit, but the intervals are wide enough to be a weak test.

**METR's acceleration assessment.** METR estimates that Anthropic's AECI has grown 1.9× as fast since October 2025 (95% CI 1.5–2.8×), and would not be surprised by 1.3× or 3×. Its own comparison across calibrations and model sets runs from 0.99× to 1.90×, with Epoch's ECI on public models at the bottom and AECI on Anthropic models at internal release dates at the top. Its robustness analyses of AECI find 1.1× to 2.9×. METR says the AECI trend could be partly an artifact of overfitting to the benchmarks, and that Anthropic redacted a majority of the evidence it found most informative. In August, AI Futures estimated overall AI R&D uplift at 1.2–1.26×.

## What changed from the September 7 audit

The audit (commit `453ed64`) was right about the main problems. Where later analysis replaced part of it, the reason is below.

| Audit decision | Now | Why |
|---|---|---|
| Compute the fit from dated data, not a hard-coded line | Kept | The old line can't be reproduced |
| No converted GPT-5.6 Sol point | Kept | See above |
| Label Epoch intervals as 90% | Kept | That is Epoch's level |
| Separate AECI series | Kept | Anthropic says the scales aren't comparable |
| Pan and zoom, with viewport tests | Kept | Still useful |
| Red curve flagged as an unvalidated reconstruction | Changed | It matches the authors' numbers, but it needed a TH1.1 rebase |
| "Index + fit envelope" bounds, with no joint coverage claim | Replaced | The Monte Carlo interval is a joint 90% range, and it held 11 of 12 forward tests |
| "Estimate bounds" selector, uncertainty on by default | Removed | Clutter; uncertainty is now one toggle, off by default |
| Frozen refit of ECI without METR, on the September input | Retired | Same question answered on November data: 9.1 h against 9.0 h |
| Frozen METR bootstrap artifacts | Retired | Regenerated by the pipeline from the same task data |
| Four separate documents | Consolidated | This file |

## Limitations

- **Extrapolation.** Astra sits 11 ECI points above the highest calibration model. Opus 5.5 and Model 4 sit 12 and 16 AECI points above theirs. The intervals assume the line keeps holding, and the sensitivity table shows it may not.
- **METR's measurement limits.** METR treats measurements above 16 h as unreliable, and its horizon page has been marked as no longer actively updated since 2026-09-08. Estimates above 16 h can't currently be confirmed with those tasks.
- **Benchmark saturation.** METR says Anthropic's internal benchmarks are increasingly saturated: Model 4 scores above 50% on all of those it was tested on. METR finds its acceleration estimate reasonably robust to this, but that is a claim about the trend, not about one model's score. Treat the Model 4 estimate as an indication.
- **Harness and effort.** Epoch aggregates reasoning settings, so a METR run and an Epoch score may not use the same configuration.
- **Vendor-run index.** AECI relies mostly on internal benchmarks that outsiders can't inspect.
- **Assumption behind the AECI ranges.** Treating shared scale movement as absorbed by the calibration rests on three refits. Model 4's own error is derived rather than published.
- **Few data points.** There are 12 ECI forward tests and 5 for AECI. Neither can establish calibration precisely.

## Reproducing

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pyyaml
.venv/bin/python scripts/horizon_analysis.py
npm test
```

`tests/horizonEstimates.test.js` checks that the JavaScript fits match the pipeline, and it fails if a refresh makes a claim in the chart's caption untrue. To refresh, replace the inputs in `docs/data` and the snapshots in `src/data/metrCalibration.js` and `src/data/aeciCalibration.js`, then rerun.

| Input | Source |
|---|---|
| `metr-benchmark-results-1_1.yaml.gz`, `metr-benchmark-results-1_0.yaml.gz` | METR's published results |
| `metr-task-results-2026-09-07.json.gz`, `metr-task-bootstrap-source.json` | METR's task-level results, with the model mapping |
| `epoch-eci-draws-2026-11-05.json.gz` | Epoch's ECI scores and 500 posterior draws |
| `epoch-eci-observations-2026-11-05.json.gz` | Epoch's benchmark parameters and observations |
| `aeci-fits.json` | AECI scores from three Anthropic fits, with links |

## Sources

- METR: [Time horizons](https://metr.org/time-horizons/), [TH1.1 results](https://metr.org/assets/benchmark_results_1_1.yaml), [TH1.1 announcement](https://metr.org/blog/2026-01-29-time-horizon-1-1/), [GPT-5.6 Sol report](https://metr.org/blog/2026-06-26-gpt-5-6-sol/), [Claude Opus 5.5 evaluation](https://metr.org/blog/2026-09-22-claude-opus-5-5/), [AI R&D acceleration assessment](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/), [note on redactions](https://x.com/METR_Evals/status/2118412194702598339)
- Epoch AI: [ECI](https://epoch.ai/eci), [methodology](https://epoch.ai/data/eci-documentation/methodology), [domain-specific ECI](https://epoch.ai/data/eci-documentation/domain-specific-eci), [model scores](https://epoch.ai/data/benchmarked_models.csv), [posterior draws](https://epoch.ai/data/eci_bootstraps.json), [benchmark parameters](https://epoch.ai/data/eci_benchmarks.csv), [benchmark observations](https://epoch.ai/data/processed_data_for_eci.csv)
- Anthropic: [Claude Opus 5 system card](https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf), [Claude Opus 5.5 system card](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf)
- AI Futures Project: [Q2.5 2026 timelines update](https://blog.aifutures.org/p/q25-2026-timelines-update-uplift), [grading sheet](https://docs.google.com/spreadsheets/d/1JfEJRIwGe7fSCIW14eC7q0sEhVWHEdetykVh9g9XnF8/edit?gid=1928509176#gid=1928509176)
