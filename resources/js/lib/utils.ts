import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Debounce a function call by the specified wait time in milliseconds
 */
export function debounce<T extends unknown[]>(fn: (...args: T) => void, wait: number) {
  let t: number | undefined
  const wrapped = (...args: T) => {
    if (t) clearTimeout(t)
    t = window.setTimeout(() => fn(...args), wait)
  }
  ;(wrapped as typeof wrapped & { cancel: () => void }).cancel = () => {
    if (t) clearTimeout(t)
  }
  return wrapped as typeof wrapped & { cancel: () => void }
}

/**
 * Format phone number to Philippine mobile format
 * Supports: 09XX-XXX-XXXX and +63 9XXXXXXXXX
 */
export function formatPhone(v: string): string {
  const s = v.replace(/\D/g, '')
  if (s.startsWith('63')) return `+63 ${s.slice(2, 3)}${s.slice(3)}`
  if (s.length <= 11 && s.startsWith('09')) return `${s.slice(0, 4)}-${s.slice(4, 7)}-${s.slice(7, 11)}`.replace(/-$/, '')
  return v
}

/**
 * Capitalize first letter of a string
 */
export function formatNameCap(v: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v
}
