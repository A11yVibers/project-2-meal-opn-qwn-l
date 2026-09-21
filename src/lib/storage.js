import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'mealplanner.v1.'

export function readStore(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

export function writeStore(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function usePersistentState(key, initial) {
  const [state, setState] = useState(() => {
    const stored = readStore(key, null)
    if (stored === null) return typeof initial === 'function' ? initial() : initial
    return typeof initial === 'function' ? { ...initial(), ...stored } : stored
  })

  useEffect(() => {
    writeStore(key, state)
  }, [key, state])

  const reset = useCallback(() => {
    setState(typeof initial === 'function' ? initial() : initial)
  }, [initial])

  return [state, setState, reset]
}

export function createId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
