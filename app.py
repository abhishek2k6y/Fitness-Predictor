"""Flask backend. Run: python app.py  (dev)  |  gunicorn app:app  (production)"""
import json, joblib, numpy as np, pandas as pd
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory

B = Path(__file__).parent
app = Flask(__name__, static_folder=str(B / "static"), static_url_path="/static")
bundle = joblib.load(B / "model" / "model.joblib")
metrics = json.loads((B / "model" / "metrics.json").read_text())

# Hard limits reject impossible entries; training ranges only trigger a warning.
LIMITS = {"age": (18, 90, "Age"), "height": (120, 220, "Height"), "weight": (30, 250, "Weight"),
          "waist": (20, 200, "Waist circumference"), "rhr": (35, 140, "Resting heart rate"),
          "sbp": (80, 220, "Systolic BP"), "dbp": (40, 140, "Diastolic BP"),
          "activity": (0, 10, "Physical activity score"), "sleep": (2, 14, "Sleep duration")}
COLS = {"age": "Age", "height": "Height_cm", "weight": "Weight_kg", "waist": "Waist_Circumference_cm",
        "rhr": "Resting_Heart_Rate_bpm", "sbp": "Systolic_BP_mmHg", "dbp": "Diastolic_BP_mmHg",
        "activity": "Physical_Activity_Score", "sleep": "Sleep_Duration_hours"}

def band(p):
    return "Below the typical range" if p < 25 else "Within the typical range" if p <= 75 else "Above the typical range"

@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.get("/api/health")
def health():
    return jsonify(status="ok")

@app.get("/api/metrics")
def get_metrics():
    return jsonify(metrics)

@app.post("/api/predict")
def predict():
    d = request.get_json(silent=True) or {}
    errors, vals = {}, {}
    for k, (lo, hi, label) in LIMITS.items():
        try:
            v = float(d.get(k))
            if not np.isfinite(v): raise ValueError
        except (TypeError, ValueError):
            errors[k] = f"{label} is required."; continue
        if not lo <= v <= hi: errors[k] = f"{label} must be between {lo} and {hi}."
        vals[k] = v
    if d.get("sex") not in ("Male", "Female"): errors["sex"] = "Select a sex."
    if errors: return jsonify(errors=errors), 422

    bmi = vals["weight"] / (vals["height"] / 100) ** 2
    row = {COLS[k]: vals[k] for k in COLS}
    row.update(Sex_Male=int(d["sex"] == "Male"), BMI=round(bmi, 1))
    x = pd.DataFrame([[row[f] for f in bundle["features"]]], columns=bundle["features"])

    warnings = [f"{LIMITS[k][2]} is outside the range the model was trained on."
                for k, c in COLS.items() if not bundle["ranges"][c][0] <= vals[k] <= bundle["ranges"][c][1]]
    if not bundle["ranges"]["BMI"][0] <= bmi <= bundle["ranges"]["BMI"][1]:
        warnings.append("BMI is outside the range the model was trained on.")

    out = {}
    for key, model in bundle["models"].items():
        pred = float(model.predict(x)[0]); r = bundle["rmse"][key] * 1.28   # ~80% interval
        ref = bundle["targets"][key]
        pct = float(np.searchsorted(ref, pred) / len(ref) * 100)
        out[key] = {"value": round(pred, 1), "low": round(pred - r, 1), "high": round(pred + r, 1),
                    "percentile": round(pct), "band": band(pct)}
    return jsonify(bmi=round(bmi, 1), predictions=out, warnings=warnings)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
