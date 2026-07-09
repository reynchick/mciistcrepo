import { useState, useEffect } from 'react'
import { validateEmailDomain } from '@/lib/validation'

type FacultyLookupStatus = 'idle' | 'checking' | 'found' | 'not-found' | 'error'

interface FacultyLookupState {
  status: FacultyLookupStatus
  facultyId?: string
}

interface UseFacultyLookupOptions {
  isFacultyRole: boolean
  email: string
  onFacultyFound?: (data: { faculty_id: string; first_name?: string; middle_name?: string; last_name?: string }) => void
  endpoint?: string
}

/**
 * Custom hook for looking up faculty information by email
 * Auto-fetches faculty data when Faculty role is selected and valid email is provided
 */
export function useFacultyLookup({ isFacultyRole, email, onFacultyFound, endpoint = '/api/faculty/by-email' }: UseFacultyLookupOptions) {
  const [facultyLookup, setFacultyLookup] = useState<FacultyLookupState>({ status: 'idle' })

  useEffect(() => {
    if (!isFacultyRole) {
      setFacultyLookup({ status: 'idle' })
      return
    }

    if (!email || !validateEmailDomain(email)) {
      setFacultyLookup({ status: 'idle' })
      return
    }

    const normalizedEmail = email.toLowerCase().trim()
    const controller = new AbortController()

    const fetchFaculty = async () => {
      setFacultyLookup({ status: 'checking' })
      try {
        const res = await fetch(`${endpoint}?email=${encodeURIComponent(normalizedEmail)}`, { signal: controller.signal })
        if (!res.ok) throw new Error('lookup failed')
        const json = await res.json()

        if (json?.exists) {
          setFacultyLookup({ status: 'found', facultyId: json.faculty_id })
          onFacultyFound?.(json)
        } else {
          setFacultyLookup({ status: 'not-found' })
        }
      } catch (err) {
        if (controller.signal.aborted) return
        setFacultyLookup({ status: 'error' })
      }
    }

    fetchFaculty()
    return () => controller.abort()
  }, [isFacultyRole, email, onFacultyFound, endpoint])

  return {
    facultyLookup,
    setFacultyLookup,
  }
}
