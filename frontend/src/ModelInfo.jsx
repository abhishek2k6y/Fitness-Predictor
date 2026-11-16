const TITLES = { mwt: '6-minute walk distance', vo2: 'VO2 max' }
const UNITS = { mwt: 'm', vo2: 'ml/kg/min' }

export default function ModelInfo({ metrics, failed }) {
  if (failed) return <p className="hint">Model details are unavailable right now.</p>
  if (!metrics) return <p className="hint">Loading…</p>
  return (
    <div>
      <p className="hint">
        {metrics.n} real participant records, {metrics.features.length} input features. Every model was scored with
        leave-one-out validation: each person is predicted by a model trained on the other {metrics.n - 1}, so no
        score is measured on data the model has seen. The best model per target (highest R²) is highlighted.
        An R² of 0 means no better than guessing the group average, and below 0 means worse.
      </p>
      {Object.entries(metrics.targets).map(([k, t]) => (
        <div key={k}>
          <h3 className="tbl-title">{TITLES[k]}</h3>
          <div className="tbl-wrap"><table>
            <thead><tr><th>Model</th><th>R²</th><th>MAE ({UNITS[k]})</th><th>RMSE ({UNITS[k]})</th></tr></thead>
            <tbody>
              {t.baseline && (
                <tr className="base">
                  <td>{t.baseline.model} (reference)</td><td>{t.baseline.r2}</td><td>{t.baseline.mae}</td><td>{t.baseline.rmse}</td>
                </tr>
              )}
              {t.results.map((r) => (
                <tr key={r.model} className={r.model === t.best ? 'best' : ''}>
                  <td>{r.model}</td><td>{r.r2}</td><td>{r.mae}</td><td>{r.rmse}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {t.mae_gain_pct != null && (
            <p className="hint">
              The best model's average error is {t.mae_gain_pct}% lower than guessing the group average.
              {t.mae_gain_pct < 25 && ' The gain is small, so treat this estimate as rough.'}
            </p>
          )}
        </div>
      ))}
      <p className="hint">
        MAE is the average size of the error and RMSE penalises large errors more. The likely range shown with each
        estimate is the estimate plus or minus 1.28 times the RMSE (about 80% of the time).
      </p>
    </div>
  )
}
