import { useState, useEffect, useRef, useCallback } from 'react'
import { WS_URL } from '../config.js'

export function useWebSocket(onSnapshot, onEvent) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === 1) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onclose = () => {
      setConnected(false)
      setTimeout(connect, 3000) // auto-reconnect
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'snapshot') {
          onSnapshot(msg.data)
        } else {
          onEvent(msg)
        }
      } catch {}
    }

    ws.onerror = () => ws.close()
  }, [onSnapshot, onEvent])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  return connected
}