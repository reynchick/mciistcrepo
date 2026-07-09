import { useState, useMemo } from 'react'
import { debounce } from '@/lib/utils'
import { validateEmailDomain } from '@/lib/validation'

type EmailStatus = 'idle' | 'checking' | 'available' | 'taken'

interface UseEmailValidationOptions {
  mode: 'create' | 'edit'
  initialId?: number
  endpoint?: string
}

/**
 * Custom hook for email validation with uniqueness checking
 */
export function useEmailValidation({ mode, initialId, endpoint = '/users/check-email' }: UseEmailValidationOptions) {
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')

  const checkEmailUnique = useMemo(
    () =>
      debounce(async (email: string) => {
        if (!email || !validateEmailDomain(email)) {
          setEmailStatus('idle')
          return
        }
        setEmailStatus('checking')
        try {
          const url = `${endpoint}?email=${encodeURIComponent(email)}${mode === 'edit' && initialId ? `&ignore=${initialId}` : ''}`
          const res = await fetch(url)
          if (!res.ok) throw new Error('failed')
          const json = await res.json()
          setEmailStatus(json?.unique ? 'available' : 'taken')
        } catch {
          setEmailStatus('idle')
        }
      }, 500),
    [mode, initialId, endpoint]
  )

  return {
    emailStatus,
    checkEmailUnique,
    setEmailStatus,
  }
}
