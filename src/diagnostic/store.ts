// store.ts — Persists the most recent "Teach Blaze" diagnostic result so the
// parent report survives a reload and can be reopened from Settings. External
// store (subscribe / getSnapshot), same pattern as game/store + profile/store.

import { useSyncExternalStore } from 'react'
import type { DiagnosticResult } from './inference'

const STORAGE_KEY = 'phonicsforge.diagnostic.v1'

function loadInitial(): DiagnosticResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DiagnosticResult
  } catch {
    // ignore — no prior result
  }
  return null
}

let state: DiagnosticResult | null = loadInitial()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export const diagnosticStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot(): DiagnosticResult | null {
    return state
  },
  save(result: DiagnosticResult): void {
    state = result
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    } catch {
      // session-only if storage is unavailable
    }
    emit()
  },
  reset(): void {
    state = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    emit()
  },
}

export function useDiagnosticResult(): DiagnosticResult | null {
  return useSyncExternalStore(diagnosticStore.subscribe, diagnosticStore.getSnapshot)
}
