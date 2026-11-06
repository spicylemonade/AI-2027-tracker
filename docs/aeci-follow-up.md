# AECI and Astra: deeper review, 2026-09-07

> Numbers in this document describe the 2026-09-07 snapshot. For current values, see the [November 2026 refresh](november-2026-refresh.md). The chart's AECI series now uses METR's November figure instead of the Opus 5 card figure described below.

Astra uses published Epoch ECI directly: the central p80 estimate is 11.56 h, with transformed 90% ECI endpoints of 5.88–24.23 h. Those input-only bounds omit calibration uncertainty. The [uncertainty audit](uncertainty-audit.md) now makes a broader 3.1–48.3 h index-plus-fit prediction envelope the default. AECI is used only for Claude models with scores in Anthropic's own papers.

The cross-scale Astra experiments below are retained as research history, not adopted forecasts. The ECI→AECI→METR conversion adds an unnecessary vendor-transfer assumption and has been removed from the chart, its sensitivity table, and the calculation code. It should not be used to push Astra's estimate above a desired threshold.

## What Anthropic actually reports

Anthropic's [Mythos Preview system card, section 2.3.6, pp. 41–43](https://www-cdn.anthropic.com/08ab9158070959f88f296514c21b7facce6f52bc.pdf) describes jointly fitting internal evaluations and public Epoch benchmark observations with item response theory (IRT). This does connect the scales. However, the overlap is sparse, benchmark composition differs, and configurations such as reasoning settings can be treated differently. The benchmark bars in its figure map benchmark accuracy onto AECI; they are not a published ECI-to-METR conversion.

The [Opus 5 system card, section 2.3.3, pp. 29–30](https://www-cdn.anthropic.com/b514064af1408018e64b1ad24e7d5e75850b4ffd/Claude%20Opus%205%20System%20Card.pdf) explicitly reports Opus 5 AECI 162.1, with a 95% interval of 158.0–167.3, and Mythos 5 AECI 161.3, with a 95% interval of 157.3–165.4. Its figure gives historical model scores on the same refitted snapshot. Those historical values were digitized to 0.1 AECI; they are approximations, not tabulated results. The card also says each update globally refits the index, so scores from different card snapshots should not be casually pooled.

## Historical cross-scale calibration experiment (not adopted)

The single Opus 5 card snapshot provides 11 Claude models that also have an Epoch ECI in the saved September 7 dataset:

| Model | AECI | Epoch ECI | Included in p80 calibration? |
| --- | ---: | ---: | --- |
| Claude 3 Opus | ≈126.0 | 126.90 | Yes |
| Claude 3.5 Sonnet | 130.0 (anchor) | 130.00 | Yes |
| Claude 3.5 Sonnet (October 2024) | ≈133.4 | 133.57 | Yes |
| Claude 3.7 Sonnet | ≈139.6 | 141.19 | Yes |
| Claude Opus 4 | ≈142.1 | 142.70 | Yes |
| Claude Sonnet 4.5 | ≈145.9 | 146.84 | No published p80 in the saved METR snapshot |
| Claude Opus 4.5 | ≈148.3 | 150.08 | Yes |
| Claude Opus 4.6 | ≈152.8 | 155.25 | Yes |
| Claude Opus 4.7 | ≈155.2 | 156.11 | No published p80 in the saved METR snapshot |
| Claude Opus 4.8 | ≈156.6 | 158.24 | No published p80 in the saved METR snapshot |
| Claude Opus 5 | 162.1 (reported) | 162.33 | No published p80 in the saved METR snapshot |

An affine OLS fit of these 11 pairs gives:

```text
AECI ≈ 2.818204 + 0.973671 × Epoch ECI
R² = 0.996372
```

That is a very strong relationship within this Claude sample. It supports using an estimated conversion, while preserving uncertainty about transfer to another vendor. It does not support substituting the raw number 169.23 directly into an AECI regression.

The seven same-named overlaps with METR give:

```text
ln(p80 hours) ≈ -27.239394 + 0.181744 × AECI
R² = 0.979168
```

This predicts approximately 5.44 h for full Mythos Preview, 7.97 h for Mythos 5, and 9.22 h for Opus 5. These are local AECI-based predictions, not horizons published by Anthropic. In particular, the 5.44 h prediction is higher than METR's 3.10 h for an **early** Mythos Preview checkpoint; the checkpoint mismatch prevents treating that comparison as a clean held-out validation result.

For Astra, the 11-model scale conversion infers AECI ≈167.59 from Epoch ECI 169.23. Passing that through the seven-model horizon fit gives **25.02 h p80**. This is two extrapolations: across vendor/scale and beyond the AECI range with measured horizons. It is not a published Anthropic evaluation of Astra. If the early Mythos result is included as a proxy for full Mythos Preview, the estimate falls to **17.59 h**. If only the seven historical horizon-overlap models are used to estimate the scale conversion, it is **19.06 h**. These are sensitivity variants, not independent votes.

## How much does METR's inclusion in ECI matter?

The initial audit correctly identified direct target overlap but did not measure its effect. That effect is now tested by refitting the full IRT model, including both model capabilities and benchmark parameters, with Epoch's own code.

- Pinned source commit: `e937446cd8ac0e910ea578516b1cab2b00c06d25` in [epoch-research/eci-public](https://github.com/epoch-research/eci-public/tree/e937446cd8ac0e910ea578516b1cab2b00c06d25).
- Input: 2,842 observations, 267 models, 59 benchmarks from [Epoch's processed input](https://epoch.ai/data/processed_data_for_eci.csv).
- Remove all 36 METR observations, leaving 58 benchmarks. All models retain at least four observations.
- Refit using official default settings and anchors; no bootstrap intervals are computed for this sensitivity check.
- The full-data run reproduces published scores to rounding: Astra ECI 169.228987 versus published 169.23.

| Underlying ECI fit | Astra ECI | Pooled p80 regression prediction | p80 regression R² |
| --- | ---: | ---: | ---: |
| Full IRT refit | 169.228987 | 11.5567 h | 0.967101 |
| METR excluded before IRT refit | 169.230598 | 11.4554 h | 0.965339 |

The direct METR contribution barely changes this result. The historical ECI–METR relationship survives its removal; it is not merely an artifact of including the target benchmark. This does not eliminate model-family dependence, correlated benchmarks, harness differences, extrapolation risk, or the need for held-out predictive testing.

## Astra estimate sensitivity

| Calibration assumption | Astra p80 |
| --- | ---: |
| All 21 matched models, published Epoch ECI | 11.56 h |
| Same overlap, ECI fully refitted without METR | 11.46 h |
| Only the 12 models released from 2025 onward | 4.41 h |
| Only the 11 OpenAI models | 8.32 h |
| Only the eight Claude models on Epoch's scale | 20.73 h |
| Continue the slope between GPT-4 and o3 only | 20.90 h |
| Eleven-model ECI→AECI transfer, seven-model AECI→p80 | 25.02 h |
| Same transfer, including early Mythos as a horizon proxy | 17.59 h |

The last two, the Claude-only fit, and the two-anchor continuation support estimates above 15 h. Each makes a stronger assumption about which historical relationship should transfer to Astra. There is no defensible reason to select a method solely because it clears 15 h, nor to treat the pooled 11.56 h as definitive. The numerical range across these models is not a confidence interval, and the methods are not equally well supported or statistically independent.

## What Astra's direct evaluations add

The [Astra system card](https://deploymentsafety.openai.com/gpt-6-astra), sections 10.1.2.5 and 10.1.3.1, contains evidence of substantial long-task capability:

- Astra scores 78.05% on internal research debugging; the evaluation describes 41 real bugs whose original fixes took researchers hours to days. This supports long-task competence but does not publish a duration distribution or success-by-duration curve from which METR p80 can be identified.
- In expert-supervised cyber testing, a browser exploit took 29 agent-hours initially and another 12 to adapt; an OS exploit took 12 agent-hours. These are selected runs, with expert interaction and no corresponding distribution of human completion times. They cannot establish an autonomous METR p80.
- UK AISI's 30.9-minute result is explicitly a **non-agentic, no-chain-of-thought math horizon**. It measures something different from METR's software-task horizon.

These results strengthen the plausibility of long autonomous work, but none converts directly into a measured “greater than 15 h p80.” Actual time spent running, the longest successful example, mean accuracy on a mixed task set, p50, and p80 are different quantities.

## Local implementation and reproduction

The chart includes purple AECI approximations only for Claude models. Astra's point, headline, and input bounds use Epoch directly; there is no inferred Astra AECI or transfer marker. The headline now shows approximately 11.6 h alongside a 3.1–48.3 h index-plus-fit envelope, with the old 5.9–24.2 h input-only range available through the bounds selector. Capped uncertainty bars are enabled on a fresh page load. The method section includes six sensitivity cases using ECI, with the rejected AECI transfers omitted.

The default bars now combine reported index endpoints with conditional regression prediction limits. They still do not represent complete horizon confidence intervals. The historical Mythos Preview figure reading lacks an input interval, so its prediction limits hold AECI fixed.

`npm run audit:metr` reproduces the active direct regressions and reports the frozen ECI sensitivity outputs. It does not calculate the rejected Astra-to-AECI transfer. `npm test` verifies calculations and data integrity. The raw IRT input is archived as `docs/data/epoch-eci-input-2026-09-07.csv.gz`; its uncompressed SHA-256 is `42e7fc2c369e6725eaaa34d74517acc09835b3f03f9262912998c812c2148ecd`.

To reproduce the underlying IRT ablation, use a separate Python environment with NumPy, pandas, SciPy, and tqdm, and a checkout of Epoch's repository at the pinned commit:

```bash
python scripts/refit-eci-without-metr.py --eci-source /path/to/eci-public --output-dir /tmp/eci-refit
```

The audited run used Python 3.12, NumPy 2.3.5, SciPy 1.18.1, and tqdm 4.70.0. The wrapper verifies the source commit and archived input hash, and writes both full and METR-excluded score tables. Its outputs do not silently update the chart's saved snapshot.
