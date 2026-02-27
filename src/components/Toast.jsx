export default function Toast({ messages }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
      }}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            background: m.type === 'error' ? '#ff6b6b22' : '#00ff8722',
            border: `1px solid ${m.type === 'error' ? '#ff6b6b' : '#00ff87'}`,
            color: m.type === 'error' ? '#ff6b6b' : '#00ff87',
            padding: '10px 16px',
            borderRadius: 10,
            fontFamily: 'monospace',
            fontSize: 13,
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  )
}