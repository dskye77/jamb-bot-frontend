export default function ProgressBar({ value, max, color = '#00ff87' }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  )
}