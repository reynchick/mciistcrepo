import { useEffect, useMemo, useRef, useState } from 'react'

export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((...args: Parameters<T>) => void) & {
  cancel: () => void
  flush: () => void
}

export type DebounceOptions = {
  delay?: number
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

function parseOptions(options?: number | DebounceOptions): Required<DebounceOptions> {
  if (typeof options === 'number') return { delay: options, leading: false, trailing: true, maxWait: Infinity }
  const o = options ?? {}
  return {
    delay: o.delay ?? 300,
    leading: o.leading ?? false,
    trailing: o.trailing ?? true,
    maxWait: o.maxWait ?? Infinity,
  }
}

export function useDebounce<T>(value: T, options?: number | DebounceOptions): T {
  const { delay } = parseOptions(options)
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(callback: T, options?: number | DebounceOptions): DebouncedFunction<T> {
  const { delay, leading, trailing, maxWait } = parseOptions(options)
  const cbRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCallTimeRef = useRef<number | null>(null)
  const lastInvokeTimeRef = useRef<number | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    lastArgsRef.current = null
    lastCallTimeRef.current = null
  }

  const invoke = () => {
    if (!lastArgsRef.current) return
    cbRef.current(...lastArgsRef.current)
    lastInvokeTimeRef.current = Date.now()
    lastArgsRef.current = null
  }

  const flush = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    invoke()
  }

  const startTimer = (wait: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (trailing) invoke()
    }, wait)
  }

  const debounced = useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      const now = Date.now()
      lastArgsRef.current = args
      lastCallTimeRef.current = now

      const sinceLastInvoke = lastInvokeTimeRef.current == null ? Infinity : now - lastInvokeTimeRef.current

      const shouldInvokeLeading = leading && timerRef.current == null
      if (shouldInvokeLeading) {
        cbRef.current(...args)
        lastInvokeTimeRef.current = now
      }

      const wait = delay
      const remainingMax = Math.max(0, maxWait - sinceLastInvoke)

      if (trailing) startTimer(Math.min(wait, remainingMax))

      if (!trailing && !leading) {
        const gp = (globalThis as any).process
        const isProd = ((typeof gp !== 'undefined' && gp?.env?.NODE_ENV === 'production')
          || (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.MODE === 'production'))
        if (!isProd) console.warn('useDebouncedCallback: either leading or trailing should be true')
      }
    }
    ;(fn as DebouncedFunction<T>).cancel = cancel
    ;(fn as DebouncedFunction<T>).flush = flush
    return fn as DebouncedFunction<T>
  }, [delay, leading, trailing, maxWait])

  useEffect(() => () => cancel(), [])

  return debounced
}
