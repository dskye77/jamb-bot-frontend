// Vite uses import.meta.env, not process.env
// Set these in a .env file at the project root:
//   VITE_API_URL=https://your-railway-url:3001
//   VITE_DASHBOARD_TOKEN=your-secret-token

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws'
export const TOKEN = import.meta.env.VITE_DASHBOARD_TOKEN || ''