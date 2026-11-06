# November 2026 refresh

Data as of 2026-11-05. This updates the numbers in the [September audit](metr-methodology.md). The method is unchanged except where noted.

## Sources

| Source | Status |
| --- | --- |
| [METR-Horizon-v1.1](https://metr.org/assets/benchmark_results_1_1.yaml) | Unchanged, same SHA-256. METR's [time-horizon page](https://metr.org/time-horizons/) says it is no longer actively updated (changelog entry dated 2026-09-08). The last published p80 is still Mythos Preview (early), so every later chart point is an estimate. |
| [Epoch model data](https://epoch.ai/data/benchmarked_models.csv) | New snapshot. Epoch refits jointly, so all rows were replaced together. |
| [METR's assessment of AI R&D acceleration at Anthropic](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/) | New source of the AECI series. |

## Epoch ECI estimates

```text
ln(p80 hours) = -22.2044 + 0.14433 × ECI
n = 20, in-sample R² = 0.971, residual SD = 0.313, calibration ECI range up to 157.82
```

GPT-5.3 Codex has no ECI in this snapshot, so it left the calibration (21 models became 20). No substitute was used.

| Model | ECI | p80 estimate | Index + fit envelope |
| --- | ---: | ---: | ---: |
| GPT-6 Astra | 169.07 | 9.00 h | 3.20–27.16 h |
| Claude Opus 5.5 | 168.36 | 8.12 h | 2.94–24.21 h |
| Gemini 4 Argon | 166.45 | 6.17 h | 2.31–17.62 h |
| Claude Opus 5 | 164.45 | 4.62 h | 1.79–12.68 h |
| GPT-5.6 Sol | 162.99 | 3.74 h | 1.49–9.83 h |
| GPT-5.4 Pro | 160.21 | 2.51 h | 0.98–6.78 h |
| DeepSeek V4.1 Flash 1017 | 159.31 | 2.20 h | 0.89–5.70 h |

Astra moved from 11.56 h to 9.00 h even though its own score barely changed (169.23 to 169.07). The refit raised recent calibration models more than older ones, which flattened the slope from 0.1545 to 0.1443.

Other fits for Astra: 2025+ models only 4.23 h, OpenAI models only 6.82 h, Claude models only 13.61 h, leave-one-out range 8.51–10.72 h. The hard-coded line the site used before the audit would give 14.74 h, but it cannot be reproduced from the data and is not used.

## AECI estimates

The AECI series was rebuilt from METR's main figure, replacing the July Opus 5 system card figure. All scores come from one fit, and the scale moves between fits. Opus 5.5 is 169.36 in its September system card and 174.56 on the October fit, so scores from different documents must not be pooled. See `src/data/aeciCalibration.js` for the digitization and its checks.

```text
ln(p80 hours) = -22.6827 + 0.14709 × AECI
n = 8, in-sample R² = 0.989
```

Mythos Preview (early) now enters the calibration, because METR's figure shows that snapshot separately. Without it the fit is n = 7, and estimates rise about 6–8%.

| Model | AECI | p80 estimate | Bounds |
| --- | ---: | ---: | ---: |
| Mythos Preview | 165.65 | 5.38 h | 1.42–27.03 h |
| Mythos 5 | 168.63 | 8.34 h | 2.06–53.41 h |
| Opus 5 | 169.33 | 9.24 h | 5.31–16.07 h (prediction limits only) |
| Opus 5.5 | 174.56 | 19.95 h | 11.04–36.03 h (prediction limits only) |
| Model 4 (internal) | 178.6 | 36.13 h | 6.35–618.28 h |

METR draws no interval for models it marks as not on the frontier, so those bounds hold AECI fixed and understate the uncertainty. Model 4 is 16 AECI points beyond any model with a measured p80, is unreleased, and scores above 50% on all of its benchmarks, which METR says makes it nervous about measuring AECI at this level.

## Left at the September snapshot

- `src/data/eciMetrAblation.js`: the full ECI refit without METR. Re-running it needs Epoch's code and input data, and the result was a small effect (11.56 h to 11.46 h).
- `src/data/metrTaskBootstrapAudit.js`: the joint task bootstrap, with ECI held at 169.23. METR's task data has not changed. Re-running it needs NumPy and SciPy.

Neither appears on the site. Both are labeled with their snapshot date in the audit output.

## Reproducing

Run `npm run audit:metr` for the fits and sensitivity checks, and `npm test` for numerical and data-integrity checks. Expected values in the tests were recomputed separately in Python from the METR YAML and the Epoch rows, and they match the JavaScript.
