export default function Pill({ children, color = '#00ff87' }) {
  return (
    <span
      style={{
        background: color + '22',
        border: `1px solid ${color}`,
        color,
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        fontFamily: 'monospace',
      }}
    >
      {children}
    </span>
  )
}