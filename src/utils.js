export function fmtUptime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m`
}

export function fmtMb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export function shortId(chatId = '') {
  if (chatId.includes('@g.us')) return `Group …${chatId.slice(-14, -5)}`
  if (chatId.includes('@lid')) return `User …${chatId.slice(-12, -4)}`
  return chatId.slice(-12)
}

export function timeSince(ts) {
  if (!ts) return '—'
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export const NEON = ['#00ff87', '#00d4ff', '#ff6b6b', '#ffd93d', '#c77dff', '#ff9f1c']
export const BAR_COLORS = ['#00ff87', '#00d4ff', '#c77dff', '#ff6b6b', '#ffd93d']