const META = {
  mwt: { title: '6-minute walk distance', unit: 'metres', short: 'm', tint: 'sun' },
  vo2: { title: 'Aerobic fitness (VO2 max)', unit: 'ml/kg/min', short: 'ml/kg/min', tint: 'mint' },
}

function Result({ id, p, dist }) {
  const m = META[id]
  const lo = dist ? dist.p1 : p.low
  const hi = dist ? dist.p99 : p.high
  const pos = Math.max(3, Math.min(97, ((p.value - lo) / (hi - lo)) * 100))
  const tone = p.percentile < 25 ? 'low' : p.percentile > 75 ? 'high' : ''
  return (
    <section className={`res tint-${m.tint}`}>
      <h3>{m.title}</h3>
      <div className="big">{p.value}<small>{m.unit}</small></div>
      <p className="hint">Likely range {p.low} to {p.high} {m.short}, about 80% of the time.</p>
      <div className="track" role="img" aria-label={`Position among the training group: ${p.percentile}th percentile`}>
        <div className="typical" />
        <div className="mark" style={{ left: `${pos}%` }}><span>{p.value}</span></div>
      </div>
      <div className="scale"><span>{lo}</span><span>Training group</span><span>{hi}</span></div>
      <p className="verdict">
        <span className={`pill ${tone}`}>{p.band}</span>
        <span className="hint">Higher than {p.percentile}% of the training group</span>
      </p>
    </section>
  )
}

export default function Results({ state, data, dist }) {
  if (state === 'loading')
    return <div className="empty"><div className="pulse" /><strong>Working out your estimate</strong>This takes a moment.</div>
  if (state === 'error')
    return <div className="warn" role="alert">The estimate could not be completed. Check your connection and try again.</div>
  if (!data)
    return (
      <div className="empty">
        <svg className="empty-ico" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#e3f1ea" /><path d="M10 38c6-16 12-16 18-2s12 14 18-10" fill="none" stroke="#123b38" strokeWidth="4" strokeLinecap="round" /></svg>
        <strong>Your estimate will appear here</strong>
        Fill in your measurements, or use the example to see how it works.
      </div>
    )
  return (
    <>
      <Result id="mwt" p={data.predictions.mwt} dist={dist?.mwt} />
      <Result id="vo2" p={data.predictions.vo2} dist={dist?.vo2} />
      {data.warnings.length > 0 && (
        <div className="warn" role="alert">
          {data.warnings.map((w) => <div key={w}>{w}</div>)}
          Treat these estimates with extra caution.
        </div>
      )}
      <p className="note">
        BMI {data.bmi}. This is a screening estimate, not a diagnosis. If the result is low or you have
        symptoms, get a full assessment from a health professional.
      </p>
    </>
  )
}
