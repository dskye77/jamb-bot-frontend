import { useRef, useEffect } from 'react'
import { shortId } from '../utils.js'

function colorFor(type) {
  if (type.includes('error') || type.includes('stop') || type.includes('disable')) return '#ff6b6b'
  if (type.includes('start') || type.includes('enable')) return '#00ff87'
  if (type.includes('config') || type.includes('ai')) return '#00d4ff'
  return '#888'
}

export default function EventLog({ events }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [events])

  return (
    <div
      ref={ref}
      style={{
        height: 220,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {events.length === 0 && <div style={{ color: '#444' }}>No events yet…</div>}
      {[...events].reverse().map((e, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            padding: '3px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <span style={{ color: '#444', flexShrink: 0 }}>{new Date(e.ts).toLocaleTimeString()}</span>
          <span style={{ color: colorFor(e.type), flexShrink: 0 }}>{e.type}</span>
          <span
            style={{
              color: '#555',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {e.data?.chatId ? shortId(e.data.chatId) : ''}
          </span>
        </div>
      ))}
    </div>
  )
}