"""Reproduces every number behind the task-horizon chart. See docs/methodology.md.

Inputs are frozen snapshots in docs/data. Writes docs/data/horizon-analysis.json and
src/data/horizonEstimates.js. Needs numpy, scipy and pyyaml:

    python3 -m venv .venv && .venv/bin/pip install numpy scipy pyyaml
    .venv/bin/python scripts/horizon_analysis.py
"""
import datetime as dt
import gzip
import json
import math
from pathlib import Path

import numpy as np
import yaml
from scipy import stats
from scipy.optimize import minimize_scalar
from scipy.special import expit

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "docs/data"
SEED = 20261105
AS_OF = "2026-11-05"
AI_2027_PUBLISHED = "2025-04-03"
LEVEL = 0.90

JOIN = {
    "gpt_4": "GPT-4 (Mar 2023)", "gpt_4_1106_inspect": "GPT-4 Turbo (Nov 2023)",
    "claude_3_opus_inspect": "Claude 3 Opus", "gpt_4_turbo_inspect": "GPT-4 Turbo (Apr 2024)",
    "gpt_4o_inspect": "GPT-4o (May 2024)", "claude_3_5_sonnet_20240620_inspect": "Claude 3.5 Sonnet",
    "o1_preview": "o1-preview", "claude_3_5_sonnet_20241022_inspect": "Claude 3.5 Sonnet (October 2024)",
    "o1_inspect": "o1", "claude_3_7_sonnet_inspect": "Claude 3.7 Sonnet", "o3_inspect": "o3",
    "claude_4_opus_inspect": "Claude Opus 4", "claude_4_1_opus_inspect": "Claude Opus 4.1",
    "gpt_5_2025_08_07_inspect": "GPT-5", "gemini_3_pro": "Gemini 3 Pro",
    "claude_opus_4_5_inspect": "Claude Opus 4.5", "gpt_5_2": "GPT-5.2",
    "claude_opus_4_6_inspect": "Claude Opus 4.6", "gemini_3_1_pro": "Gemini 3.1 Pro", "gpt_5_4": "GPT-5.4",
}
AECI_METR_IDS = {
    "Claude 3 Opus": "claude_3_opus_inspect", "Claude 3.5 Sonnet": "claude_3_5_sonnet_20240620_inspect",
    "Claude 3.5 Sonnet (October 2024)": "claude_3_5_sonnet_20241022_inspect",
    "Claude 3.7 Sonnet": "claude_3_7_sonnet_inspect", "Claude Opus 4": "claude_4_opus_inspect",
    "Claude Opus 4.5": "claude_opus_4_5_inspect", "Claude Opus 4.6": "claude_opus_4_6_inspect",
}
MYTHOS_EARLY_AECI = 162.35
# Chosen before looking at results. SWE follows Epoch's published domain list, as far as those
# benchmarks are in the general fit. AGENTIC adds other long-running autonomous-work benchmarks.
SWE = {"PostTrainBench", "ExploitBench", "FrontierCode", "Terminal Bench", "Surface Evolver Bench",
       "Cybench", "WeirdML", "WeirdML v3", "Aider polyglot"}
AGENTIC = {"Terminal Bench", "FrontierCode", "FrontierSWE", "MirrorCode", "PostTrainBench", "GSO-Bench",
           "The Agent Company", "Remote Labor Index", "APEX-Agents", "ExploitBench", "Cybench", "EBR-bench"}


def year(date):
    d = dt.date.fromisoformat(date)
    start = dt.date(d.year, 1, 1)
    return d.year + (d - start).days / (dt.date(d.year + 1, 1, 1) - start).days


def scenario_hours_at(decimal_year):
    u = decimal_year - 2025
    log_seconds = (6.36588017 + 1.75547434 * u + 0.350855496 * u**2 + 0.0462100721 * u**3
                   + 0.0144760767 * u**4 + 0.0194798378 * u**5 + 0.00743193880 * u**6
                   + 0.000851343348 * u**7)
    return math.exp(log_seconds) / 3600


def scenario_hours(date):
    return scenario_hours_at(year(date))


def scenario_date_for(hours):
    start = dt.date(2024, 1, 1)
    days = [start + dt.timedelta(days=i) for i in range(1500)]
    return next((d.isoformat() for d in days if scenario_hours(d.isoformat()) >= hours), None)


def ols(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    n, mx = len(x), x.mean()
    sxx = ((x - mx) ** 2).sum()
    b = ((x - mx) * (y - y.mean())).sum() / sxx
    a = y.mean() - b * mx
    sse = ((y - a - b * x) ** 2).sum()
    return {"n": n, "intercept": a, "slope": b, "rSquared": 1 - sse / ((y - y.mean()) ** 2).sum(),
            "residualSd": math.sqrt(sse / (n - 2)), "meanX": mx, "sxx": sxx, "maxX": float(x.max())}


def predict(f, x):
    return f["intercept"] + f["slope"] * x


def prediction_se(f, x):
    return f["residualSd"] * np.sqrt(1 + 1 / f["n"] + (x - f["meanX"]) ** 2 / f["sxx"])


def loo_factor(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    errors = [y[i] - predict(ols(np.delete(x, i), np.delete(y, i)), x[i]) for i in range(len(x))]
    return float(np.exp(np.sqrt(np.mean(np.square(errors)))))


def round_floats(value, digits=4):
    if isinstance(value, dict):
        return {k: round_floats(v, digits) for k, v in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [round_floats(v, digits) for v in value]
    if isinstance(value, (float, np.floating)):
        return round(float(value), digits)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.bool_):
        return bool(value)
    return value


v11 = yaml.safe_load(gzip.open(DATA / "metr-benchmark-results-1_1.yaml.gz"))["results"]
v10 = yaml.safe_load(gzip.open(DATA / "metr-benchmark-results-1_0.yaml.gz"))["results"]
epoch = json.load(gzip.open(DATA / "epoch-eci-draws-2026-11-05.json.gz", "rt", encoding="utf-8"))["models"]
obs_file = json.load(gzip.open(DATA / "epoch-eci-observations-2026-11-05.json.gz", "rt", encoding="utf-8"))
aeci_fits = json.loads((DATA / "aeci-fits.json").read_text())["fits"]
p80_hours = lambda k: v11[k]["metrics"]["p80_horizon_length"]["estimate"] / 60
p50_hours = lambda k: v11[k]["metrics"]["p50_horizon_length"]["estimate"] / 60

ids = sorted(JOIN, key=lambda k: str(v11[k]["release_date"]))
dates = [str(v11[k]["release_date"]) for k in ids]
names = [JOIN[k] for k in ids]
X = np.array([epoch[n]["eci"] for n in names])
Y = np.log([p80_hours(k) for k in ids])
DRAWS = {n: np.array(m["draws"]) for n, m in epoch.items()}
CAL = np.array([DRAWS[n] for n in names]).T
FIT = ols(X, Y)
rng = np.random.default_rng(SEED)
t_noise = lambda df: stats.t.rvs(df, random_state=rng)
results = {"asOf": AS_OF, "level": LEVEL}

# 1. Predictive interval for the ECI estimates: Epoch's joint posterior draws, line uncertainty and
# model-to-model scatter. METR's own sampling error is added separately as a sensitivity.
def eci_interval(name, k=40000, train=None, y=None):
    train = np.arange(len(ids)) if train is None else train
    y = Y if y is None else y
    out = np.empty(k)
    for i in range(k):
        e = rng.integers(CAL.shape[0])
        f = ols(CAL[e][train], y[train])
        x = DRAWS[name][e]
        out[i] = predict(f, x) + t_noise(f["n"] - 2) * prediction_se(f, x)
    q = (1 - LEVEL) / 2
    return np.exp(np.quantile(out, [q, 1 - q]))


ECI_TARGETS = ["GPT-6 Astra", "Claude Opus 5.5", "GPT-6.1 Sol", "GPT-6.1 Terra", "GPT-5.6 Sol", "Claude Opus 5"]
estimates = {}
for name in ECI_TARGETS:
    low, high = eci_interval(name)
    estimates[name] = {"eci": epoch[name]["eci"], "date": epoch[name]["date"],
                       "hours": float(np.exp(predict(FIT, epoch[name]["eci"]))), "low": low, "high": high}
results["eci"] = {"fit": {k: v for k, v in FIT.items()}, "estimates": estimates, "looFactor": loo_factor(X, Y),
                  "calibration": [{"model": n, "date": d, "eci": x, "p80Hours": float(np.exp(y))}
                                  for n, d, x, y in zip(names, dates, X, Y)]}

# 2. Forward-chaining backtest: fit only on models released earlier, predict the next one.
def forward(x, y, start=8):
    rows = []
    for i in range(start, len(ids)):
        train = [j for j in range(i) if dates[j] < dates[i]]
        f = ols(x[train], y[train])
        half = stats.t.ppf(0.5 + LEVEL / 2, f["n"] - 2) * prediction_se(f, x[i])
        rows.append({"error": float(y[i] - predict(f, x[i])), "inside": bool(abs(y[i] - predict(f, x[i])) <= half), "width": float(2 * half)})
    return rows


def forward_recent(x, y, window, start=8):
    errors = []
    for i in range(start, len(ids)):
        train = [j for j in range(i) if dates[j] < dates[i]][-window:]
        f = ols(x[train], y[train])
        errors.append(float(y[i] - predict(f, x[i])))
    return errors


T = np.array([year(d) for d in dates])
summary = lambda e: {"rmseFactor": float(np.exp(np.sqrt(np.mean(np.square(e))))), "biasFactor": float(np.exp(np.mean(e)))}
eci_rows, date_rows = forward(X, Y), forward(T, Y)
anchored = []
for i in range(8, len(ids)):
    last = [j for j in range(i) if dates[j] < dates[i]][-1]
    anchored.append(float(Y[i] - (Y[last] + math.log(2) / 5 * (X[i] - X[last]))))
mc_inside = []
for i in range(8, len(ids)):
    train = np.array([j for j in range(i) if dates[j] < dates[i]])
    samples = np.empty(4000)
    for s in range(4000):
        e = rng.integers(CAL.shape[0])
        f = ols(CAL[e][train], Y[train])
        samples[s] = predict(f, CAL[e][i]) + t_noise(f["n"] - 2) * prediction_se(f, CAL[e][i])
    low, high = np.quantile(samples, [(1 - LEVEL) / 2, 1 - (1 - LEVEL) / 2])
    mc_inside.append(bool(low <= Y[i] <= high))
eci_errors = [r["error"] for r in eci_rows]
results["backtest"] = {
    "tests": len(eci_rows),
    "eci": {**summary(eci_errors), "coverageClassical": float(np.mean([r["inside"] for r in eci_rows])), "coverageMonteCarlo": float(np.mean(mc_inside))},
    "eciLast10": summary(forward_recent(X, Y, 10)),
    "dateOnly": summary([r["error"] for r in date_rows]),
    "anchorLastPlus5PointsPerDoubling": summary(anchored),
    "perModel": [{"model": names[8 + i], "date": dates[8 + i], "actualOverPredicted": float(np.exp(r["error"])), "inside": r["inside"]} for i, r in enumerate(eci_rows)],
    "lastSevenBelowPrediction": int(sum(e < 0 for e in eci_errors[-7:])),
    "lastSevenGeometricRatio": float(np.exp(np.mean(eci_errors[-7:]))),
}

# 3. Structural sensitivity of the Astra estimate.
astra = epoch["GPT-6 Astra"]["eci"]
xc, one = X - X.mean(), np.ones(len(X))
is_a = np.array(["claude" in k for k in ids], float)
is_g = np.array(["gemini" in k for k in ids], float)


def nested(design):
    beta = np.linalg.lstsq(design, Y, rcond=None)[0]
    sse = ((Y - design @ beta) ** 2).sum()
    base = (FIT["residualSd"] ** 2) * (len(Y) - 2)
    extra = design.shape[1] - 2
    p = 1 - stats.f.cdf(((base - sse) / extra) / (sse / (len(Y) - design.shape[1])), extra, len(Y) - design.shape[1])
    return beta, float(p)


beta_q, p_q = nested(np.c_[one, xc, xc**2])
beta_v, p_v = nested(np.c_[one, xc, is_a, is_g])
beta_d, p_d = nested(np.c_[one, xc, T - T.mean()])
# Mythos Preview (early) has no Epoch ECI; interpolate one from the AECI/ECI gap of its Claude neighbors.
oct_fit = aeci_fits["October (METR assessment, Haiku 5.5 card fit)"]["scores"]
a47, a48 = 160.27, 163.41
e47, e48 = epoch["Claude Opus 4.7"]["eci"], epoch["Claude Opus 4.8"]["eci"]
bridged = e47 + (MYTHOS_EARLY_AECI - a47) * (e48 - e47) / (a48 - a47)
mythos_p80 = p80_hours("claude_mythos_preview_early_inspect")
fb = ols(np.r_[X, bridged], np.r_[Y, math.log(mythos_p80)])
xb, yb = np.r_[X, bridged], np.r_[Y, math.log(mythos_p80)]
xbc = xb - xb.mean()
db = np.c_[np.ones(len(xb)), xbc, xbc**2]
bb = np.linalg.lstsq(db, yb, rcond=None)[0]
sse_b = ((yb - db @ bb) ** 2).sum()
p_qb = 1 - stats.f.cdf((fb["residualSd"] ** 2 * (len(yb) - 2) - sse_b) / (sse_b / (len(yb) - 3)), 1, len(yb) - 3)
recent10 = ols(X[-10:], Y[-10:])
ts = stats.theilslopes(Y, X)
claude = np.array(["claude" in k for k in ids])
openai = ~claude & ~is_g.astype(bool)
results["astraSensitivity"] = {
    "pooledLinear": float(np.exp(predict(FIT, astra))),
    "quadratic": {"hours": float(np.exp(beta_q @ [1, astra - X.mean(), (astra - X.mean()) ** 2])), "p": p_q},
    "quadraticWithMythos": {"hours": float(np.exp(bb @ [1, astra - xb.mean(), (astra - xb.mean()) ** 2])), "p": float(p_qb)},
    "vendorInterceptsP": p_v, "dateTermP": p_d,
    "withBridgedMythos": {"bridgedEci": float(bridged), "hours": float(np.exp(predict(fb, astra))), "mythosActualOverPredicted": float(mythos_p80 / np.exp(predict(FIT, bridged)))},
    "last10Models": float(np.exp(predict(recent10, astra))),
    "theilSen": float(np.exp(ts[1] + ts[0] * astra)),
    "openAiOnly": float(np.exp(predict(ols(X[openai], Y[openai]), astra))),
    "claudeOnly": float(np.exp(predict(ols(X[claude], Y[claude]), astra))),
    "lastBacktestBiasApplied": float(np.exp(predict(FIT, astra) + np.mean(eci_errors[-7:]))),
    "fiveEciPointsPerDoublingFromGpt54": float(np.exp(Y[-1] + math.log(2) / 5 * (astra - X[-1]))),
    "fiveEciPointsPerDoublingFromBridgedMythos": float(mythos_p80 * 2 ** ((astra - bridged) / 5)),
}

# 4. Does a coding-focused index predict METR better? Refit capability with Epoch's benchmark
# parameters held fixed, as its domain-specific ECI does.
params = {b["benchmark"]: (b["edi"], b["slope"]) for b in obs_file["benchmarks"]}
by_model = {}
for o in obs_file["observations"]:
    by_model.setdefault(o["model"], []).append((o["benchmark"], o["performance"]))


def capability(model, keep=None, drop=(), minimum=2):
    rows = [(b, p) for b, p in by_model.get(model, []) if b in params and (keep is None or b in keep) and b not in drop]
    if len(rows) < minimum:
        return None
    d = np.array([params[b][0] for b, _ in rows])
    s = np.array([params[b][1] for b, _ in rows])
    y = np.clip([p for _, p in rows], 0.001, 0.999)
    return minimize_scalar(lambda c: ((expit(s * (c - d)) - y) ** 2).sum(), bounds=(40, 230), method="bounded", options={"xatol": 1e-4}).x


def compare(label, fn):
    pairs = [(fn(n), epoch[n]["eci"], y) for n, y in zip(names, Y) if fn(n) is not None]
    sub, pub, y = map(np.array, zip(*pairs))
    f, g = ols(sub, y), ols(pub, y)
    target = fn("GPT-6 Astra")
    return {"label": label, "n": len(y), "rSquared": f["rSquared"], "looFactor": loo_factor(sub, y),
            "publishedEciSameModels": {"rSquared": g["rSquared"], "looFactor": loo_factor(pub, y)},
            "astraHours": float(np.exp(predict(f, target))) if target is not None else None}


results["indexComparison"] = [
    compare("ECI without METR's benchmark", lambda n: capability(n, drop={"METR Time Horizons"})),
    compare("Software engineering benchmarks", lambda n: capability(n, keep=SWE)),
    compare("Agentic benchmarks", lambda n: capability(n, keep=AGENTIC)),
]
frontier = {}
for n in ["GPT-6 Astra", "Claude Opus 5.5"]:
    rows = by_model[n]
    frontier[n] = {"benchmarks": len(rows), "agentic": sorted(b for b, _ in rows if b in AGENTIC),
                   "scoring90PercentOrMore": sum(p >= 0.9 for _, p in rows),
                   "harderThanModel": sorted(b for b, _ in rows if params.get(b, (0,))[0] > epoch[n]["eci"])}
results["frontierBenchmarkCoverage"] = frontier

# 5. AECI estimates. Same-fit calibration on Claude models with a published p80.
oct_scores = {**oct_fit}
ax = np.array([oct_scores[m] for m in AECI_METR_IDS] + [MYTHOS_EARLY_AECI])
ay = np.log([p80_hours(k) for k in AECI_METR_IDS.values()] + [mythos_p80])
AFIT = ols(ax, ay)
# Anthropic's "local" 95% range for Opus 5.5 (167.99-171.24) is the model-specific error once the
# whole frontier's shared movement is removed; refits show that shared movement barely affects p80.
LOCAL_SD = (171.24 - 167.99) / (2 * 1.96)


# Model 4 rests on 15 benchmarks against Opus 5.5's 43, so it needs its own error. METR's figure gives
# only its 95% global range (170.6-192.8). Remove the shared part, taken as Opus 5.5's global range
# (165.23-177.05) less its local range, one side at a time.
def own_sd(global_half, opus_global_half, opus_local_half):
    return math.sqrt(global_half**2 - (opus_global_half**2 - opus_local_half**2)) / 1.96


MODEL_4_SD = (own_sd(178.6 - 170.6, 169.36 - 165.23, 169.36 - 167.99),
              own_sd(192.8 - 178.6, 177.05 - 169.36, 171.24 - 169.36))
MODEL_4_FULL_SD = ((178.6 - 170.6) / 1.96, (192.8 - 178.6) / 1.96)
SCORE_SD = {"Claude Opus 5": (LOCAL_SD, LOCAL_SD), "Claude Opus 5.5": (LOCAL_SD, LOCAL_SD),
            "Anthropic Model 4 (internal)": MODEL_4_SD}


def aeci_interval(score, sd, k=40000):
    z = rng.standard_normal(k)
    xi = score + z * np.where(z > 0, sd[1], sd[0])
    samples = predict(AFIT, xi) + stats.t.rvs(AFIT["n"] - 2, size=k, random_state=rng) * prediction_se(AFIT, xi)
    return np.exp(np.quantile(samples, [(1 - LEVEL) / 2, 1 - (1 - LEVEL) / 2]))


aeci_estimates = {}
for model, sd in SCORE_SD.items():
    x = oct_scores[model]
    low, high = aeci_interval(x, sd)
    aeci_estimates[model] = {"aeci": x, "hours": float(np.exp(predict(AFIT, x))), "low": low, "high": high}
across = {}
for label, fit in aeci_fits.items():
    f = ols([fit["scores"][m] for m in AECI_METR_IDS], np.log([p80_hours(k) for k in AECI_METR_IDS.values()]))
    across[label] = {"slope": f["slope"], "rSquared": f["rSquared"],
                     "hours": {m: float(np.exp(predict(f, fit["scores"][m]))) for m in ["Claude Mythos 5", "Claude Opus 5", "Claude Opus 5.5"] if m in fit["scores"]},
                     "scores": {m: fit["scores"][m] for m in ["Claude Opus 5", "Claude Opus 5.5"] if m in fit["scores"]}}
same7 = list(AECI_METR_IDS)
a7 = np.array([oct_scores[m] for m in same7])
e7 = np.array([epoch[m]["eci"] for m in same7])
y7 = np.log([p80_hours(AECI_METR_IDS[m]) for m in same7])
f7 = ols(a7, y7)
e7f = ols(e7, y7)
afwd = []
for i in range(3, len(ax)):
    f = ols(ax[:i], ay[:i])
    half = stats.t.ppf(0.5 + LEVEL / 2, f["n"] - 2) * prediction_se(f, ax[i])
    afwd.append({"actualOverPredicted": float(np.exp(ay[i] - predict(f, ax[i]))), "inside": bool(abs(ay[i] - predict(f, ax[i])) <= half)})
known = {**oct_scores, "Claude Opus 4.7": a47, "Claude Opus 4.8": a48, "Claude Fable 5.1": oct_scores["Claude Mythos 5.1"]}
gaps = [{"model": m, "aeci": known[m], "eci": epoch[m]["eci"], "gap": known[m] - epoch[m]["eci"]}
        for m in same7 + ["Claude Opus 4.7", "Claude Opus 4.8", "Claude Opus 5", "Claude Fable 5.1", "Claude Opus 5.5"]]
results["aeci"] = {
    "fit": AFIT, "estimates": aeci_estimates, "localSd": LOCAL_SD, "model4Sd": MODEL_4_SD,
    "model4WithFullMetrRange": aeci_interval(oct_scores["Anthropic Model 4 (internal)"], MODEL_4_FULL_SD),
    "model4UsingOpus55Error": aeci_interval(oct_scores["Anthropic Model 4 (internal)"], (LOCAL_SD, LOCAL_SD)), "acrossFits": across, "aeciMinusEci": gaps,
    "predictedMythosEarlyFromEarlierModels": float(np.exp(predict(f7, MYTHOS_EARLY_AECI))), "measuredMythosEarly": mythos_p80,
    "headToHeadSameSevenClaudeModels": {
        "aeci": {"rSquared": f7["rSquared"], "looFactor": loo_factor(a7, y7)},
        "epochEci": {"rSquared": e7f["rSquared"], "looFactor": loo_factor(e7, y7), "opus55Hours": float(np.exp(predict(e7f, epoch["Claude Opus 5.5"]["eci"])))},
    },
    "forwardTests": afwd,
}

# 6. Scenario curve: check it against its authors' numbers, then put it on TH1.1.
anchor = "claude_3_7_sonnet_inspect"
factor = p80_hours(anchor) / scenario_hours(AI_2027_PUBLISHED)
ratio_rows = []
for k, m in v11.items():
    alias = k.replace("_inspect", "").replace("_2025_08_07", "").replace("_20240620", "")
    if alias in v10 and "p80_horizon_length" in v10[alias]["metrics"] and str(m["release_date"]) >= "2023-01-01":
        ratio_rows.append({"model": k, "date": str(m["release_date"]), "v11OverV10": m["metrics"]["p80_horizon_length"]["estimate"] / v10[alias]["metrics"]["p80_horizon_length"]["estimate"]})
ratio_rows.sort(key=lambda r: r["date"])


def lag_weeks(hours, date, scale=None):
    raw = scenario_date_for(hours / (scale or factor))
    return (dt.date.fromisoformat(date) - dt.date.fromisoformat(raw)).days / 7 if raw else None


checks = {"minutesAtPublication": scenario_hours(AI_2027_PUBLISHED) * 60, "authorsSayMinutes": 15,
          "minutesAt2026_3": scenario_hours("2026-04-20") * 60, "authorsPredictedMinutesAt2026_3": 231}
reach = next(y / 1000 for y in range(2025000, 2028000) if scenario_hours_at(y / 1000) * 60 >= 279)
checks.update({"yearCurveReaches279Minutes": reach, "authorsSayYear": 2026.35})
lag_points = {
    "Mythos Preview (early), measured": (mythos_p80, v11["claude_mythos_preview_early_inspect"]["metrics"]["p80_horizon_length"]["ci_low"] / 60,
                                         v11["claude_mythos_preview_early_inspect"]["metrics"]["p80_horizon_length"]["ci_high"] / 60, "2026-04-07"),
    "GPT-6 Astra, ECI": (*(estimates["GPT-6 Astra"][k] for k in ("hours", "low", "high")), "2026-09-03"),
    "Claude Opus 5.5, AECI": (*(aeci_estimates["Claude Opus 5.5"][k] for k in ("hours", "low", "high")), "2026-09-22"),
    "Anthropic Model 4, AECI": (*(aeci_estimates["Anthropic Model 4 (internal)"][k] for k in ("hours", "low", "high")), "2026-09-25"),
}
results["scenario"] = {
    "rebaseFactor": factor, "authorsFactor": 2 / 3, "checksAgainstAuthors": checks, "v11OverV10": ratio_rows,
    "hoursAsOf": scenario_hours(AS_OF) * factor, "rawHoursAsOf": scenario_hours(AS_OF),
    "lagWeeks": {label: lag_weeks(hours, date) for label, (hours, _, _, date) in lag_points.items()},
    "lagWeeksFromRange": {label: [lag_weeks(high, date), lag_weeks(low, date)] for label, (_, low, high, date) in lag_points.items()},
    "lagWeeksWithAuthorsFactor": {label: lag_weeks(hours, date, 2 / 3) for label, (hours, _, _, date) in lag_points.items()},
}

# 7. The one direct measurement after Mythos Preview: GPT-5.6 Sol's p50.
p50 = np.log([p50_hours(k) for k in ids])
f50 = ols(X, p50)
sol = epoch["GPT-5.6 Sol"]["eci"]
half = stats.t.ppf(0.5 + LEVEL / 2, f50["n"] - 2) * prediction_se(f50, sol)
ratios = np.exp(Y - p50)
results["solCheck"] = {"predictedP50": float(np.exp(predict(f50, sol))), "predictedLow": float(np.exp(predict(f50, sol) - half)), "predictedHigh": float(np.exp(predict(f50, sol) + half)),
                       "metrStandardP50": 11.3, "metrStandardCi": [5, 40], "metrDiscardCheatingP50": 71, "metrDiscardCheatingCi": [13, 11400],
                       "p80OverP50Median": float(np.median(ratios)), "p80OverP50Since2025": [float(ratios[T >= 2025].min()), float(ratios[T >= 2025].max())]}

# 8. Sensitivity: add METR's task-level sampling error, drawn jointly across models.
meta = json.loads((DATA / "metr-task-bootstrap-source.json").read_text())
source = json.loads(gzip.decompress((DATA / "metr-task-results-2026-09-07.json.gz").read_bytes()))
alias_for = {v: k for k, v in meta["modelAliases"].items()}
agents = [source["agents"][alias_for[k]] for k in ids]
tasks = sorted({t["task_id"] for a in agents for t in a["tasks"]})
index = {t: i for i, t in enumerate(tasks)}
n_m, n_t = len(ids), len(tasks)
lx, runs, wins, weight = np.zeros((n_m, n_t)), np.zeros((n_m, n_t), int), np.zeros((n_m, n_t), int), np.zeros((n_m, n_t))
for i, a in enumerate(agents):
    for t in a["tasks"]:
        j = index[t["task_id"]]
        lx[i, j], runs[i, j], wins[i, j], weight[i, j] = np.log2(t["human_minutes"]), t["n_runs"], t["n_successes"], t["task_weight"]
    weight[i] /= weight[i].sum()
share = wins / np.maximum(1, runs)
start = np.array([[a["intercept"], a["coefficient"]] for a in agents])


def p80_logs(success, w):
    a, b = start[:, 0].copy(), start[:, 1].copy()
    for _ in range(50):
        p = expit(a[:, None] + b[:, None] * lx)
        r, v = w * (p - success), w * p * (1 - p)
        ga, gb = r.sum(1), (r * lx).sum(1) + 1e-5 * b
        haa, hab, hbb = v.sum(1), (v * lx).sum(1), (v * lx * lx).sum(1) + 1e-5
        det = haa * hbb - hab * hab
        da, db = (hbb * ga - hab * gb) / det, (haa * gb - hab * ga) / det
        step = np.maximum(1, np.maximum(abs(da) / 3, abs(db)))
        a, b = a - da / step, b - db / step
        if np.max(abs(da) + abs(db)) < 1e-8:
            break
    return np.log(2) * (np.log(4) - a) / b - np.log(60)


base = p80_logs(share, weight)
families = {}
for j, t in enumerate(tasks):
    families.setdefault(t.split("/")[0], []).append(j)
family_list = list(families.values())
draws = []
for _ in range(2000):
    counts = np.zeros(n_t, int)
    for f in rng.integers(len(family_list), size=len(family_list)):
        members = family_list[f]
        counts += np.bincount(rng.choice(members, size=len(members), replace=True), minlength=n_t)
    sampled = runs * counts
    draws.append(p80_logs(rng.binomial(sampled, share) / np.maximum(1, sampled), weight * counts))
draws = np.array(draws) - base + Y
samples = np.empty(20000)
for i in range(len(samples)):
    e, m = rng.integers(CAL.shape[0]), rng.integers(draws.shape[0])
    f = ols(CAL[e], draws[m])
    x = DRAWS["GPT-6 Astra"][e]
    samples[i] = predict(f, x) + t_noise(f["n"] - 2) * prediction_se(f, x)
# 9. Also test METR's flagged p80 modelling choices.
def alternative(mask=None):
    w = weight if mask is None else weight * mask
    return p80_logs(share, w)


alt = {}
for label, values in {"Drop tasks under 1 minute": alternative(lx >= 0), "Drop tasks under 4 minutes": alternative(lx >= 2)}.items():
    f = ols(X, values)
    alt[label] = {"astraHours": float(np.exp(predict(f, astra))), "rSquared": f["rSquared"]}
results["metrSamplingSensitivity"] = {"astraInterval": np.exp(np.quantile(samples, [0.05, 0.95])).tolist(), "alternatives": alt, "reconstructionMaxError": float(np.max(abs(np.exp(base - Y) - 1)))}

results = round_floats(results)
(DATA / "horizon-analysis.json").write_text(json.dumps(results, indent=2) + "\n")
site = {
    "asOf": AS_OF, "level": LEVEL,
    "eci": {k: {x: results["eci"]["estimates"][k][x] for x in ("hours", "low", "high")} for k in ["GPT-6 Astra"]},
    "aeci": {k: {x: results["aeci"]["estimates"][k][x] for x in ("hours", "low", "high")} for k in results["aeci"]["estimates"]},
    "backtest": {"tests": results["backtest"]["tests"], "coverage": results["backtest"]["eci"]["coverageMonteCarlo"], "rmseFactor": results["backtest"]["eci"]["rmseFactor"]},
    "scenarioRebaseFactor": results["scenario"]["rebaseFactor"],
    "lagWeeks": results["scenario"]["lagWeeks"],
    "lagWeeksFromRange": results["scenario"]["lagWeeksFromRange"],
}
(ROOT / "src/data/horizonEstimates.js").write_text(
    "// Generated by scripts/horizon_analysis.py; see docs/methodology.md. Do not edit by hand.\n"
    f"export default {json.dumps(site, indent=2)};\n")
print("wrote docs/data/horizon-analysis.json and src/data/horizonEstimates.js")
