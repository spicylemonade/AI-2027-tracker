"""Reproduce the central ECI ablation using a local checkout of Epoch's code.

See docs/aeci-follow-up.md for the pinned commit and dependency instructions.
This script does not change the chart's frozen output automatically.
"""
import argparse
import gzip
import hashlib
import io
from pathlib import Path
import subprocess
import sys

PINNED_COMMIT = "e937446cd8ac0e910ea578516b1cab2b00c06d25"
INPUT_SHA256 = "42e7fc2c369e6725eaaa34d74517acc09835b3f03f9262912998c812c2148ecd"
ROOT = Path(__file__).resolve().parent.parent

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--eci-source", type=Path, required=True)
parser.add_argument("--output-dir", type=Path, required=True)
args = parser.parse_args()
commit = subprocess.check_output(["git", "-C", str(args.eci_source), "rev-parse", "HEAD"], text=True).strip()
if commit != PINNED_COMMIT:
    raise ValueError(f"Use the documented Epoch code commit {PINNED_COMMIT}, got {commit}")
payload = gzip.decompress((ROOT / "docs/data/epoch-eci-input-2026-09-07.csv.gz").read_bytes())
if hashlib.sha256(payload).hexdigest() != INPUT_SHA256:
    raise ValueError("The archived input does not match the audited snapshot")

sys.path.insert(0, str(args.eci_source.resolve() / "src"))
import pandas as pd
from eci.fitting import fit_eci_model

data = pd.read_csv(io.BytesIO(payload))
without_metr = data[data.benchmark != "METR Time Horizons"]
assert len(data) == 2842 and len(data) - len(without_metr) == 36
assert without_metr.groupby("Model").size().min() >= 4
args.output_dir.mkdir(parents=True, exist_ok=True)
for label, frame in [("full", data), ("without-metr", without_metr)]:
    scores, _, _ = fit_eci_model(frame, bootstrap_samples=0)
    scores.to_csv(args.output_dir / f"{label}-eci.csv", index=False)
    astra = scores.loc[scores.Model == "GPT-6 Astra", "eci"].item()
    print(f"{label}: {len(frame)} observations; Astra ECI = {astra:.9f}")
