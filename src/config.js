// Vite uses import.meta.env, not process.env
// Set these in a .env file at the project root:
//   VITE_API_URL=https://jamb-bot-production.up.railway.app   ← no port!
//   VITE_DASHBOARD_TOKEN=your-secret-token

const rawUrl = import.meta.env.VITE_API_URL

// Strip any explicit port when using https — Railway only exposes 443
export const API_BASE = rawUrl.startsWith('https://')
  ? rawUrl.replace(/:\d+$/, '')   // remove :3001 or any port suffix
  : rawUrl

// ws:// for http, wss:// for https — no port on Railway
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws'

export const TOKEN = import.meta.env.VITE_DASHBOARD_TOKEN || ''