# Fitness Predictor: 6MWT distance and VO2 max from simple measures

IDP project, School of Healthcare and Allied Sciences, GD Goenka University.
React frontend, Flask API and scikit-learn models. No login. No data is stored.

## Data and validation
- `data/dataset.csv` holds **28 real participants** (17 women, 11 men, ages 41 to 54) with 11 input measures and two outcomes:
  6-minute walk test (6MWT) distance and VO2 max.
- `train.py` scores seven models plus a mean-only baseline with **leave-one-out cross-validation**: each participant is
  predicted by a model trained on the other 27. The best model per outcome (highest R2) is refitted on all records.
- Current results (see `model/metrics.json`): 6MWT, gradient boosting, R2 0.57, MAE 31.1 m; VO2 max, ridge, R2 0.40,
  MAE 3.4 ml/kg/min. The VO2 max gain over the baseline is not statistically reliable at this sample size.
- The "likely range" shown by the app is the estimate plus or minus 1.28 x the leave-one-out RMSE (about 80%).
- Limits: small sample, single age band, no external validation. Screening estimate only, not a diagnosis.

## Run (production)
```
pip install -r requirements.txt
python train.py                        # retrain after any change to data/dataset.csv (writes model/)
python app.py                          # http://localhost:5000   (or: gunicorn -w 2 -b 0.0.0.0:8000 app:app)
python -m unittest discover tests      # smoke tests for the API
```
The built React app is already in `static/`, so Node is not needed to run it.

## Develop the frontend
```
cd frontend && npm install
npm run dev                            # http://localhost:5173, proxies /api to Flask on :5000
npm run build                          # outputs into ../static
```

## API
`POST /api/predict` (JSON: age, sex, height, weight, waist, rhr, sbp, dbp, activity, sleep), `GET /api/metrics`, `GET /api/health`.

## Updating the data
Keep the same columns as `data/dataset.csv`, use real participant data only, then re-run `python train.py` and restart the server.
