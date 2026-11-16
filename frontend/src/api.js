export async function predict(body) {
  const res = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

export async function getMetrics() {
  const res = await fetch('/api/metrics')
  if (!res.ok) throw new Error('metrics unavailable')
  return res.json()
}
