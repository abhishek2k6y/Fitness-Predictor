import { useEffect, useState } from 'react'
import { predict, getMetrics } from './api'
import Results from './Results.jsx'
import ModelInfo from './ModelInfo.jsx'
import Hero from './Hero.jsx'
import Nav from './Nav.jsx'
import Logo from './Logo.jsx'
import './styles.css'

const LIM = { age: [18, 90], height: [120, 220], weight: [30, 250], waist: [20, 200], rhr: [35, 140], sbp: [80, 220], dbp: [40, 140], activity: [0, 10], sleep: [2, 14] }
const EMPTY = { age: '', sex: '', height: '', weight: '', waist: '', rhr: '', sbp: '', dbp: '', activity: 5, sleep: '' }
const EXAMPLE = { age: 47, sex: 'Female', height: 166, weight: 72, waist: 82, rhr: 68, sbp: 125, dbp: 79, activity: 5.5, sleep: 7.2 }

function NumField({ id, label, unit, hint, step = 1, value, error, onChange }) {
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label} <span className="u">{unit}</span></label>
      <input id={id} type="number" inputMode="decimal" step={step} min={LIM[id][0]} max={LIM[id][1]}
        value={value} onChange={(e) => onChange(id, e.target.value)} aria-invalid={!!error} />
      {hint && <div className="hint">{hint}</div>}
      <div className="err">{error}</div>
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState({ state: 'idle', data: null })
  const [metrics, setMetrics] = useState(null)
  const [metricsFailed, setMetricsFailed] = useState(false)

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => setMetricsFailed(true))
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const bmi = form.height > 0 && form.weight > 0 ? (form.weight / (form.height / 100) ** 2).toFixed(1) + ' kg/m²' : 'Enter height and weight'
  const dist = metrics && { mwt: metrics.targets.mwt.dist, vo2: metrics.targets.vo2.dist }
  const props = (id) => ({ id, value: form[id], error: errors[id], onChange: set })

  function validate() {
    const e = {}
    Object.entries(LIM).forEach(([k, [lo, hi]]) => {
      const v = form[k]
      if (v === '' || v === null) e[k] = 'Enter a value.'
      else if (+v < lo || +v > hi) e[k] = `Enter a value from ${lo} to ${hi}.`
    })
    if (!form.sex) e.sex = 'Select a sex.'
    setErrors(e)
    return e
  }

  async function submit(ev) {
    ev.preventDefault()
    const e = validate()
    const first = Object.keys(e)[0]
    if (first) return document.getElementById(first)?.focus()
    setResult({ state: 'loading', data: null })
    try {
      const body = { ...form }
      Object.keys(LIM).forEach((k) => (body[k] = +form[k]))
      const { status, ok, data } = await predict(body)
      if (status === 422) { setErrors(data.errors); return setResult({ state: 'idle', data: null }) }
      if (!ok) throw new Error()
      setResult({ state: 'done', data })
      if (window.innerWidth < 860) document.getElementById('out')?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      setResult({ state: 'error', data: null })
    }
  }

  const loading = result.state === 'loading'
  const reset = () => { setForm(EMPTY); setErrors({}); setResult({ state: 'idle', data: null }) }
  return (
    <>
      <a className="skip" href="#estimate">Skip to the predictor</a>
      <Nav />

      <header className="hero" id="top">
        <div className="hero-copy">
          <span className="badge"><i /> Built on real participant data</span>
          <h1>Know how far you can walk, before you walk it.</h1>
          <p>Estimate your 6-minute walk distance and aerobic fitness (VO2 max) from ten measurements you can take at home. No lab, no treadmill, no account.</p>
          <div className="cta">
            <a className="btn primary" href="#estimate">Start my estimate</a>
            <a className="btn light" href="#how">See how it works</a>
          </div>
          <ul className="trust">
            <li><b>{metrics ? metrics.n : 28}</b> real participants</li>
            <li><b>Leave-one-out</b> validated</li>
            <li><b>Nothing stored</b> on our side</li>
          </ul>
        </div>
        <Hero />
      </header>

      <main>
        <section className="section" id="estimate">
          <div className="section-head">
            <h2>Your measurements</h2>
            <p>Takes about three minutes. Every value is checked against safe limits before the estimate runs.</p>
          </div>
          <div className="grid">
            <form className="card" onSubmit={submit} noValidate>
              <fieldset><legend>Profile</legend>
                <div className="row">
                  <NumField {...props('age')} label="Age" unit="years" />
                  <div className={`field${errors.sex ? ' invalid' : ''}`}>
                    <label id="sexl">Sex</label>
                    <div className="seg" role="radiogroup" aria-labelledby="sexl">
                      {['Female', 'Male'].map((s) => (
                        <label key={s}>
                          <input type="radio" name="sex" id={s === 'Female' ? 'sex' : undefined} checked={form.sex === s} onChange={() => set('sex', s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                    </div>
                    <div className="err">{errors.sex}</div>
                  </div>
                </div>
              </fieldset>
              <fieldset><legend>Body measurements</legend>
                <div className="row">
                  <NumField {...props('height')} label="Height" unit="cm" step={0.1} />
                  <NumField {...props('weight')} label="Weight" unit="kg" step={0.1} />
                </div>
                <div className="row">
                  <NumField {...props('waist')} label="Waist circumference" unit="cm" step={0.1} hint="Measure at the navel, after breathing out." />
                  <div className="field"><label>BMI <span className="u">calculated</span></label><div className="bmi" aria-live="polite">{bmi}</div></div>
                </div>
              </fieldset>
              <fieldset><legend>Heart rate and blood pressure</legend>
                <div className="row">
                  <NumField {...props('rhr')} label="Resting heart rate" unit="bpm" hint="After 5 minutes of sitting rest." />
                  <NumField {...props('sbp')} label="Systolic BP" unit="mmHg" />
                  <NumField {...props('dbp')} label="Diastolic BP" unit="mmHg" />
                </div>
              </fieldset>
              <fieldset><legend>Lifestyle</legend>
                <div className="row">
                  <div className={`field${errors.activity ? ' invalid' : ''}`}>
                    <label htmlFor="activity">Physical activity score: <strong>{form.activity}</strong> of 10</label>
                    <input id="activity" type="range" min="0" max="10" step="0.5" value={form.activity} onChange={(e) => set('activity', e.target.value)} />
                    <div className="hint">0 is mostly sitting. 10 is very active every day.</div>
                  </div>
                  <NumField {...props('sleep')} label="Sleep duration" unit="hours per night" step={0.1} />
                </div>
              </fieldset>
              <div className="actions">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Estimating…' : 'Estimate my fitness'}</button>
                <button className="btn light" type="button" onClick={() => { setForm(EXAMPLE); setErrors({}) }}>Use example</button>
                <button className="btn text" type="button" onClick={reset}>Clear form</button>
              </div>
            </form>
            <aside className="card side" id="out" aria-live="polite">
              <Results state={result.state} data={result.data} dist={dist} />
            </aside>
          </div>
        </section>

        <section className="section" id="how">
          <div className="section-head">
            <h2>From a tape measure to an estimate</h2>
            <p>Three steps, and nothing leaves your browser except the numbers you enter.</p>
          </div>
          <ol className="steps">
            <li><span className="n">1</span><h3>Measure</h3><p>Height, weight, waist, resting heart rate and blood pressure. A tape and a home cuff are enough.</p></li>
            <li><span className="n">2</span><h3>Estimate</h3><p>Models trained on real participant records predict your walk distance and VO2 max, with a likely range.</p></li>
            <li><span className="n">3</span><h3>Compare</h3><p>See where you sit against the training group, and whether your result falls in the typical band.</p></li>
          </ol>
        </section>

        <section className="section" id="model">
          <div className="section-head">
            <h2>How the model was built</h2>
            <p>Every score below was measured on people the model had not seen during training.</p>
          </div>
          {metrics && (
            <div className="stats">
              <div className="stat sun"><b>{metrics.targets.mwt.results.find((r) => r.model === metrics.targets.mwt.best).r2}</b><span>R² for walk distance</span></div>
              <div className="stat mint"><b>{metrics.targets.mwt.results.find((r) => r.model === metrics.targets.mwt.best).mae} m</b><span>average error, walk distance</span></div>
              <div className="stat lilac"><b>{metrics.targets.vo2.results.find((r) => r.model === metrics.targets.vo2.best).r2}</b><span>R² for VO2 max</span></div>
              <div className="stat coral"><b>{metrics.n}</b><span>real participants</span></div>
            </div>
          )}
          <details className="card tables">
            <summary>Compare all seven models</summary>
            <ModelInfo metrics={metrics} failed={metricsFailed} />
            {metrics && <p className="hint">Trained on {metrics.n} real participant records (ages {metrics.age_range[0]} to {metrics.age_range[1]}). Estimates are most reliable for adults in that age range.</p>}
          </details>
        </section>
      </main>

      <footer className="foot" id="about">
        <div className="foot-in">
          <div>
            <a className="brand" href="#top"><Logo invert />Fitness Predictor</a>
          </div>
          <p className="legal"><strong>Screening estimate only.</strong> Not a medical diagnosis. Small sample, single age band, no external validation.</p>
        </div>
      </footer>
    </>
  )
}
