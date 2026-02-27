export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '18px 20px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}