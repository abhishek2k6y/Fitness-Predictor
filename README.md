# Fitness Predictor

**Estimate 6-minute walk distance and VO₂ max from ten simple clinic measures.**

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/API-Flask-000000?logo=flask)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)
![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikitlearn&logoColor=white)
![Validation](https://img.shields.io/badge/Validation-Leave--one--out%20CV-1F3864)

Fitness Predictor is a research prototype that predicts two measures of functional capacity, the **6-minute walk test (6MWT) distance** and **VO₂ max**, from quantities that can be taken in a basic health check: age, sex, height, weight, waist circumference, resting heart rate, blood pressure, a physical-activity score and sleep duration.

The aim is a low-cost screening aid for settings where a timed walk test or a laboratory VO₂ max test is impractical. It is **not** a diagnostic tool.

---

## Key results

All figures come from leave-one-out cross-validation (LOOCV) on 28 participants and are stored in [`model/metrics.json`](model/metrics.json).

| Outcome | Best model | R² | Mean absolute error | Baseline error (guessing the average) | Improvement |
|---|---|---|---|---|---|
| 6MWT distance | Gradient boosting | 0.57 | 31.1 m | 50.2 m | **38% smaller** |
| VO₂ max | Ridge (tuned) | 0.40 | 3.4 ml/kg/min | 4.1 ml/kg/min | 16% smaller (not statistically reliable) |

- For 6MWT, the improvement over guessing the average is statistically significant (Wilcoxon signed-rank on per-participant errors, p ≈ 0.003).
- For VO₂ max, the same test gives p ≈ 0.16, so the gain at this sample size should be treated as indicative only.
- The app reports a **likely range** around each estimate: the prediction ± 1.28 × the LOOCV RMSE, which corresponds to roughly 80% coverage.

---

## Features

- **Two predictions in one form**: 6MWT distance (m) and VO₂ max (ml/kg/min), each with a likely range.
- **Cohort percentile and band**: shows where the estimate falls relative to the study cohort (below, within or above the typical range).
- **Input validation**: impossible entries are rejected with field-level messages; values outside the training range still return a result but with an explicit warning.
- **Transparent model details**: the interface exposes the validation method and the comparison of all candidate models.
- **Privacy by design**: no login and no storage of entered data.
- **Reproducible training**: one command retrains and re-validates every model from the CSV.

---

## How it works

1. `train.py` reads [`data/dataset.csv`](data/dataset.csv) and derives BMI and a sex indicator.
2. Seven candidate models and a mean-only baseline are scored per outcome with LOOCV: each participant is predicted by a model fitted on the other 27, with scaling and tuning repeated inside every fit.
   Candidates: tuned ridge, tuned lasso, polynomial ridge, random forest, gradient boosting, LightGBM and a stacking ensemble.
3. The model with the highest LOOCV R² is refitted on all records and saved to `model/model.joblib`; its LOOCV RMSE sets the width of the displayed range.
4. `app.py` loads the saved bundle and serves predictions through a JSON API and the built React interface.

LOOCV is used instead of a fixed hold-out set because, with a few dozen records, a small test split gives unstable scores.

---

## Quick start

Requires Python 3.9 or newer. Node.js is **not** needed to run the app, because the built frontend is already in `static/`.

```bash
git clone https://github.com/<your-username>/fitness-estimator.git
cd fitness-estimator

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python train.py                    # optional: retrain and refresh model/
python app.py                      # http://localhost:5000
```

Production serving:

```bash
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

Run the API smoke tests:

```bash
python -m unittest discover tests
```

### Frontend development

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173, proxies /api to Flask on :5000
npm run build                      # writes the production build into ../static
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict` | Returns BMI, both predictions with ranges, and any warnings |
| `GET` | `/api/metrics` | Returns the validation metrics for all models |
| `GET` | `/api/health` | Liveness check |

**Request**

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 46, "sex": "Female", "height": 153.3, "weight": 56.3,
    "waist": 69.7, "rhr": 66, "sbp": 121, "dbp": 75,
    "activity": 6.1, "sleep": 7.4
  }'
```

**Response**

```json
{
  "bmi": 24.0,
  "predictions": {
    "mwt": { "value": 591.5, "low": 539.4, "high": 643.5, "percentile": 46, "band": "Within the typical range" },
    "vo2": { "value": 50.3,  "low": 45.4,  "high": 55.3,  "percentile": 43, "band": "Within the typical range" }
  },
  "warnings": []
}
```

Invalid input returns HTTP `422` with an `errors` object keyed by field.

**Inputs and accepted ranges**

| Field | Meaning | Accepted range |
|---|---|---|
| `age` | Years | 18 to 90 |
| `sex` | `"Male"` or `"Female"` | n/a |
| `height` | cm | 120 to 220 |
| `weight` | kg | 30 to 250 |
| `waist` | Waist circumference, cm | 20 to 200 |
| `rhr` | Resting heart rate, bpm | 35 to 140 |
| `sbp` / `dbp` | Systolic / diastolic blood pressure, mmHg | 80 to 220 / 40 to 140 |
| `activity` | Physical activity score | 0 to 10 |
| `sleep` | Hours per night | 2 to 14 |

---

## Project structure

```
fitness-estimator/
├── app.py                 Flask API and static file server
├── train.py               Model comparison, LOOCV validation, final fit
├── requirements.txt
├── data/dataset.csv       28 participants, 11 input measures, 2 outcomes
├── model/
│   ├── model.joblib       Fitted models, feature list, training ranges, RMSE
│   └── metrics.json       Validation results for every candidate model
├── frontend/              React 18 + Vite source
├── static/                Built frontend served by Flask
└── tests/test_api.py      API smoke tests
```

---

## Dataset

`data/dataset.csv` contains **28 participants** (17 women, 11 men) aged 41 to 54. Each row has age, sex, height, weight, BMI, waist circumference, resting heart rate, systolic and diastolic blood pressure, physical-activity score and sleep duration, together with the measured 6MWT distance and VO₂ max.

To retrain on new data, keep the same column names, use real participant data only, run `python train.py`, and restart the server.

---

## License

Add a `LICENSE` file before publishing (for example MIT for the code). Check the data-sharing terms for `data/dataset.csv` separately.
