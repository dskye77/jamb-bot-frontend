import { API_BASE, TOKEN } from './config.js'

export async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API_BASE + path, opts)
  return res.json()
}