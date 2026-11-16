"""Fitness Predictor: train and compare models for 6MWT distance and VO2 max.  Run: python train.py

Validation: leave-one-out cross-validation (LOOCV) on every record. Each participant is predicted by a
model fitted to all the other participants, with scaling and tuning repeated inside every fit. The pooled
predictions give R2, MAE and RMSE. With a few dozen records a fixed hold-out set (for example 6 people)
gives unstable scores, so LOOCV is used instead. A mean-only baseline is scored the same way, because any
useful model must beat it. The best candidate (highest LOOCV R2) is refitted on all records for deployment,
and its LOOCV RMSE sets the width of the interval shown by the app.
"""
import json, warnings, joblib, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, StackingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from lightgbm import LGBMRegressor

warnings.filterwarnings("ignore")
B = Path(__file__).parent
df = pd.read_csv(B / "data" / "dataset.csv")
if len(df) < 10:
    raise SystemExit("Dataset has too few records to train and validate a model.")
df["Sex_Male"] = (df["Sex"] == "Male").astype(int)
FEATURES = ["Age", "Sex_Male", "Height_cm", "Weight_kg", "BMI", "Waist_Circumference_cm",
            "Resting_Heart_Rate_bpm", "Systolic_BP_mmHg", "Diastolic_BP_mmHg",
            "Physical_Activity_Score", "Sleep_Duration_hours"]
TARGETS = {"mwt": "6MWT_Distance_m", "vo2": "VO2_Max_ml_kg_min"}
BASELINE = "Mean baseline"

_lasso = lambda: make_pipeline(StandardScaler(), LassoCV(cv=5, max_iter=20000))
_gbm = lambda: GradientBoostingRegressor(n_estimators=300, max_depth=2, learning_rate=0.03, subsample=0.7, random_state=42)
_lgbm = lambda: LGBMRegressor(n_estimators=400, learning_rate=0.02, num_leaves=4, min_child_samples=20, subsample=0.7,
                              subsample_freq=1, colsample_bytree=0.8, reg_lambda=5, random_state=42, verbose=-1)
CANDIDATES = {
    "Ridge (tuned)": lambda: make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-3, 3, 25))),
    "Lasso (tuned)": _lasso,
    "Polynomial ridge": lambda: make_pipeline(StandardScaler(), PolynomialFeatures(2), StandardScaler(), RidgeCV(alphas=np.logspace(-1, 4, 25))),
    "Random forest": lambda: RandomForestRegressor(300, min_samples_leaf=5, random_state=42, n_jobs=-1),
    "Gradient boosting": _gbm,
    "LightGBM": _lgbm,
    "Stacking ensemble": lambda: StackingRegressor([("lasso", _lasso()), ("gbm", _gbm()), ("lgbm", _lgbm())], final_estimator=RidgeCV(), cv=5),
}

def score(make, X, y):
    pred = cross_val_predict(make(), X, y, cv=LeaveOneOut())
    return {"r2": round(float(r2_score(y, pred)), 3), "mae": round(float(mean_absolute_error(y, pred)), 2),
            "rmse": round(float(np.sqrt(mean_squared_error(y, pred))), 2)}

X = df[FEATURES]
bundle = {"name": "Fitness Predictor", "features": FEATURES, "models": {}, "rmse": {}, "targets": {}}
report = {"name": "Fitness Predictor", "n": int(len(df)), "validation": "leave-one-out", "features": FEATURES,
          "age_range": [int(df["Age"].min()), int(df["Age"].max())], "targets": {}}
for key, col in TARGETS.items():
    y = df[col]
    base = {"model": BASELINE, **score(lambda: DummyRegressor(), X, y)}
    rows = []
    for name, make in CANDIDATES.items():
        rows.append({"model": name, **score(make, X, y)})
        print(f"  {key:3s} {name:18s} {rows[-1]}", flush=True)
    best = max(rows, key=lambda r: r["r2"])
    final = CANDIDATES[best["model"]]().fit(X, y)   # refit on all records for deployment
    bundle["models"][key] = final; bundle["rmse"][key] = best["rmse"]
    bundle["targets"][key] = np.sort(y.values)
    q = y.quantile([0.01, .1, .25, .5, .75, .9, .99]).round(1).tolist()
    gain = round(100 * (base["mae"] - best["mae"]) / base["mae"])
    report["targets"][key] = {"column": col, "best": best["model"], "baseline": base, "mae_gain_pct": int(gain),
                              "results": rows, "dist": dict(zip(["p1", "p10", "p25", "p50", "p75", "p90", "p99"], q))}
    print(f"{key}: best = {best['model']}  R2 {best['r2']}  MAE {best['mae']}  (baseline MAE {base['mae']}, {gain}% lower)")
bundle["ranges"] = {f: [float(X[f].min()), float(X[f].max())] for f in FEATURES}
(B / "model").mkdir(exist_ok=True)
joblib.dump(bundle, B / "model" / "model.joblib")
(B / "model" / "metrics.json").write_text(json.dumps(report, indent=2))
print("Saved model/model.joblib and model/metrics.json")
