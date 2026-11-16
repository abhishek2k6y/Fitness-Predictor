// Heart with a pulse line: the app's mark. `invert` is for dark backgrounds.
export default function Logo({ invert = false }) {
  const bg = invert ? '#f2b33d' : '#123b38'
  const heart = invert ? '#123b38' : '#f2b33d'
  const line = invert ? '#f2b33d' : '#123b38'
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill={bg} />
      <path d="M16 26.5C6 19.5 5 12.5 9.4 9.6c3-1.9 5.4-.2 6.6 2 1.2-2.2 3.6-3.9 6.6-2 4.4 2.9 3.4 9.9-6.6 16.9z" fill={heart} />
      <path d="M7.5 17.2h5l2.2-4.2 3.1 7.4 2-3.2h4.7" fill="none" stroke={line} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
