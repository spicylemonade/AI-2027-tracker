"""Joint bootstrap of public METR task aggregates; a sensitivity diagnostic.

Shared family/task draws preserve cross-model measurement dependence. Binomial
resampling of empirical successes exactly resamples binary attempts. ECI scores,
human durations and the success-curve specification remain fixed.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from scipy.special import expit

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--draws", type=int, default=10000)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
if args.draws < 100:
    raise ValueError("Use at least 100 draws")
metadata = json.loads((ROOT / "docs/data/metr-task-bootstrap-source.json").read_text())
payload = gzip.decompress((ROOT / "docs/data/metr-task-results-2026-09-07.json.gz").read_bytes())
if hashlib.sha256(payload).hexdigest() != metadata["parsedJsonSha256"]:
    raise ValueError("Source snapshot hash mismatch")
source = json.loads(payload)
points = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {ECI_CALIBRATION_POINTS as p} from './src/data/metrProgress.js'; console.log(JSON.stringify(p));",
], cwd=ROOT, text=True))
by_id = {metadata["modelAliases"].get(alias): row for alias, row in source["agents"].items()}
tasks = sorted({t["task_id"] for p in points for t in by_id[p["id"]]["tasks"]})
task_index = {t: i for i, t in enumerate(tasks)}
n_models, n_tasks = len(points), len(tasks)
x = np.zeros((n_models, n_tasks))
n = np.zeros_like(x, dtype=int)
k = np.zeros_like(x, dtype=int)
w = np.zeros_like(x)
for i, point in enumerate(points):
    for task in by_id[point["id"]]["tasks"]:
        j = task_index[task["task_id"]]
        x[i, j] = np.log2(task["human_minutes"])
        n[i, j], k[i, j] = task["n_runs"], task["n_successes"]
        w[i, j] = task["task_weight"]
    w[i] /= w[i].sum()
y = k / np.maximum(1, n)
start = np.array([[by_id[p["id"]]["intercept"], by_id[p["id"]]["coefficient"]] for p in points])


def solve(successes, weights):
    """Vectorized Newton fit of the source weighted logistic objective."""
    intercept, slope = start[:, 0].copy(), start[:, 1].copy()
    for _ in range(50):
        probability = expit(intercept[:, None] + slope[:, None] * x)
        residual = weights * (probability - successes)
        variance = weights * probability * (1 - probability)
        ga = residual.sum(1)
        gb = (residual * x).sum(1) + 1e-5 * slope
        haa, hab = variance.sum(1), (variance * x).sum(1)
        hbb = (variance * x * x).sum(1) + 1e-5
        determinant = haa * hbb - hab * hab
        da = (hbb * ga - hab * gb) / determinant
        db = (haa * gb - hab * ga) / determinant
        step = np.maximum(1, np.maximum(abs(da) / 3, abs(db)))
        intercept -= da / step
        slope -= db / step
        if np.max(abs(da) + abs(db)) < 1e-8:
            break
    else:
        raise ValueError("A logistic bootstrap fit did not converge")
    if np.any(slope >= 0):
        raise ValueError("A bootstrap fit does not have a decreasing success curve")
    return np.log(2) * (np.log(4) - intercept) / slope - np.log(60)


base = solve(y, w)
published = np.log([p["hours"] for p in points])
max_error = float(np.max(abs(np.exp(base - published) - 1)))
if max_error > 0.001:
    raise ValueError(f"Reconstruction differs from published values by {max_error}")
print(f"Reconstructed {n_models} horizons; maximum relative error {max_error:.6%}", flush=True)

families = {}
for j, task in enumerate(tasks):
    families.setdefault(task.split("/")[0], []).append(j)
family_members = list(families.values())
rng = np.random.default_rng(739421)
draws = []
for replicate in range(args.draws):
    counts = np.zeros(n_tasks, dtype=int)
    for family in rng.integers(len(family_members), size=len(family_members)):
        members = family_members[family]
        counts += np.bincount(rng.choice(members, size=len(members), replace=True), minlength=n_tasks)
    sampled_n = n * counts
    sampled_y = rng.binomial(sampled_n, y) / np.maximum(1, sampled_n)
    # Keep original normalization, as METR's bootstrap does.
    draws.append(solve(sampled_y, w * counts))
    if (replicate + 1) % 1000 == 0:
        print(f"Completed {replicate + 1} draws", flush=True)

# Recenter tiny source-rounding/solver differences on the published estimates.
draws = np.array(draws) - base + published
if not np.all(np.isfinite(draws)):
    raise ValueError("Non-finite bootstrap horizons")
eci = np.array([p["eci"] for p in points])
centered_eci = eci - eci.mean()
slopes = ((draws - draws.mean(1)[:, None]) * centered_eci).sum(1) / (centered_eci ** 2).sum()
intercepts = draws.mean(1) - slopes * eci.mean()
astra = intercepts + slopes * 169.23
result = {
    "method": "Joint family/task/attempt bootstrap; shared task draws across all models",
    "draws": args.draws, "seed": 739421,
    "nModels": n_models, "nTasks": n_tasks, "nFamilies": len(family_members),
    "source": metadata,
    "maxReconstructionRelativeError": max_error,
    "indexHeldFixed": 169.23,
    "astraRegressionHours": dict(zip(["low", "median", "high"], np.exp(np.quantile(astra, [.05, .5, .95])).tolist())),
    "percentileMass": 0.9,
    "medianPairwiseLogHorizonCorrelation": float(np.median(np.corrcoef(draws.T)[np.triu_indices(n_models, k=1)])),
    "limitations": ["ECI calibration and target scores held fixed", "No new-model prediction residual added",
                    "Human durations held fixed", "Fixed logistic success curve", "Local reconstruction, not official METR bootstrap output"],
    "marginalChecks": [{"id": p["id"], "reconstructedHours": float(np.exp(h)), "publishedHours": p["hours"],
                        "bootstrap95LowHours": float(np.exp(np.quantile(d, .025))),
                        "bootstrap95HighHours": float(np.exp(np.quantile(d, .975)))}
                       for p, h, d in zip(points, base, draws.T)],
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({key: result[key] for key in ["nModels", "nTasks", "nFamilies", "astraRegressionHours", "medianPairwiseLogHorizonCorrelation"]}, indent=2))
