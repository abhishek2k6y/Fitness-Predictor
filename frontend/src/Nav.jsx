import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Logo from './Logo.jsx'

const LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'estimate', label: 'Predictor' },
  { id: 'how', label: 'How it works' },
  { id: 'model', label: 'The model' },
  { id: 'about', label: 'About' },
]

export default function Nav() {
  const [active, setActive] = useState('top')
  const [hover, setHover] = useState(null)
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })
  const refs = useRef({})
  const lockUntil = useRef(0)

  // Scroll-spy: the active link is the last section whose top has passed the header.
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return
      const y = window.scrollY + 140
      let cur = 'top'
      for (const l of LINKS) {
        const el = document.getElementById(l.id)
        if (el && el.offsetTop <= y) cur = l.id
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = 'about'
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])

  const target = hover || active
  const measure = () => {
    const el = refs.current[target]
    if (el) setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth && p.ready ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: true }))
  }
  useLayoutEffect(measure, [target])
  useEffect(() => {
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [target])

  const go = (id) => {
    setActive(id)
    lockUntil.current = Date.now() + 900
  }

  return (
    <nav className="nav" aria-label="Main">
      <a className="brand" href="#top" onClick={() => go('top')}><Logo />Fitness Predictor</a>
      <div className="links" onMouseLeave={() => setHover(null)}>
        <span className={`pill-bg${pill.ready ? ' ready' : ''}`} style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} />
        {LINKS.map((l) => (
          <a key={l.id} href={`#${l.id}`} ref={(el) => (refs.current[l.id] = el)}
            className={target === l.id ? 'on' : ''} aria-current={active === l.id ? 'page' : undefined}
            onMouseEnter={() => setHover(l.id)} onFocus={() => setHover(l.id)} onBlur={() => setHover(null)}
            onClick={() => go(l.id)}>{l.label}</a>
        ))}
      </div>
      <a className="btn mini" href="#estimate" onClick={() => go('estimate')}>Start estimate</a>
    </nav>
  )
}
