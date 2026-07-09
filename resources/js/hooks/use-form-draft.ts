import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'

type DraftOptions = {
  key: string
  data: Record<string, any>
  enabled?: boolean
  debounceMs?: number
}

/**
 * Smart form draft management hook
 * 
 * Behavior:
 * - ✅ Tracks if form is dirty
 * - ✅ Warns user on browser close/refresh if form has unsaved changes
 * - ✅ Does NOT persist drafts after browser close
 * - ✅ Components handle Inertia navigation warnings
 */
export function useFormDraft({ key, data, enabled = true, debounceMs = 800 }: DraftOptions) {
  const dirtyRef = useRef(false)
  const debounceTimerRef = useRef<number | undefined>(undefined)
  const initialDataRef = useRef<string>('')

  // Clear any old drafts on mount and capture initial state
  useEffect(() => {
    if (!enabled) return
    localStorage.removeItem(key)
    initialDataRef.current = JSON.stringify(data)
  }, []) // Only run on mount

  // Track if form is dirty (debounced)
  useEffect(() => {
    if (!enabled) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      const currentData = JSON.stringify(data)
      dirtyRef.current = currentData !== initialDataRef.current
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [data, enabled, debounceMs])

  // Warn user on browser close/refresh
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled])

  return {
    clearDraft: () => {
      dirtyRef.current = false
    },
    hasDraft: () => {
      return false
    },
    getDraft: () => {
      return null
    },
    isDirty: () => dirtyRef.current,
  }
}
