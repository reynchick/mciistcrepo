import { useState, useMemo } from 'react'
import { debounce } from '@/lib/utils'
import { validateStudentId } from '@/lib/validation'

type StudentIdStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

interface UseStudentIdValidationOptions {
  mode: 'create' | 'edit'
  initialId?: number
  endpoint?: string
}

/**
 * Custom hook for student ID validation with uniqueness checking
 */
export function useStudentIdValidation({ mode, initialId, endpoint = '/users/check-student-id' }: UseStudentIdValidationOptions) {
  const [studentIdStatus, setStudentIdStatus] = useState<StudentIdStatus>('idle')

  const checkStudentIdUnique = useMemo(
    () =>
      debounce(async (sid: string) => {
        const validationError = validateStudentId(sid)
        if (!sid || validationError !== undefined) {
          setStudentIdStatus('idle')
          return
        }
        setStudentIdStatus('checking')
        try {
          const url = `${endpoint}?student_id=${encodeURIComponent(sid)}${mode === 'edit' && initialId ? `&ignore=${initialId}` : ''}`
          const res = await fetch(url)
          if (!res.ok) throw new Error('Server error')
          const json = await res.json()
          setStudentIdStatus(json?.unique ? 'available' : 'taken')
        } catch (err) {
          console.error('Student ID validation error:', err)
          setStudentIdStatus('error')
        }
      }, 500),
    [mode, initialId, endpoint]
  )

  return {
    studentIdStatus,
    checkStudentIdUnique,
    setStudentIdStatus,
  }
}
