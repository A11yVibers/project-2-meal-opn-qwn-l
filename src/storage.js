import { useEffect, useState } from 'react'

const PREFIX = 'mealplanner-v1:'

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => loadState(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(state))
    } catch { /* storage full or unavailable */ }
  }, [key, state])
  return [state, setState]
}

export function uid(prefix = 'U') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
