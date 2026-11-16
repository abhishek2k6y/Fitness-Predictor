// Illustrated arch: a 30 m walking track, the setting of the 6-minute walk test.
export default function Hero() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="blob b-sun" /><span className="blob b-mint" />
      <span className="blob b-coral" /><span className="blob b-lilac" />
      <div className="arch">
        <svg viewBox="0 0 420 520" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9efe6" /><stop offset="1" stopColor="#f7ecd2" />
            </linearGradient>
          </defs>
          <rect width="420" height="520" fill="url(#sky)" />
          <circle cx="300" cy="130" r="52" fill="#f2b33d" opacity=".9" />
          <path d="M0 330c60-50 110-40 170-10s120 20 250-40v240H0z" fill="#a7d3c4" />
          <path d="M0 370c80-40 140-20 210 0s140 10 210-30v180H0z" fill="#7fbba9" />
          <g transform="translate(0 0)">
            <path d="M-20 470 L110 372 H470 L400 470 Z" fill="#ecd9a6" />
            <path d="M92 386 H455" stroke="#123b38" strokeWidth="2" strokeDasharray="14 12" opacity=".35" />
            <g stroke="#123b38" strokeWidth="3" opacity=".5">
              <path d="M120 372 L84 470" /><path d="M392 372 L376 470" />
            </g>
          </g>
          <g className="walker"><g transform="translate(210 352)">
            <circle cx="0" cy="-34" r="13" fill="#ee7b6a" />
            <path d="M0 -20 V30" stroke="#123b38" strokeWidth="9" strokeLinecap="round" />
            <path d="M0 -10 L-18 12 M0 -10 L19 6" stroke="#123b38" strokeWidth="7" strokeLinecap="round" />
            <path d="M0 28 L-18 68 M0 28 L20 66" stroke="#123b38" strokeWidth="8" strokeLinecap="round" />
          </g></g>
          <path d="M40 150c30-28 50 22 80-6s40-30 70-6" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".6" />
        </svg>
        <div className="chip chip-a"><b>30 m</b>walking track</div>
        <div className="chip chip-b"><b>6 min</b>at your own pace</div>
      </div>
    </div>
  )
}
