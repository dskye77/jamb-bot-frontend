import Card from './Card.jsx'

export default function StatBox({ label, value, color = '#00ff87', sub }) {
  return (
    <Card style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{sub}</div>}
    </Card>
  )
}