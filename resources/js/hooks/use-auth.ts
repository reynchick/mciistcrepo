import { useEffect, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import type { SharedData, User as SharedUser } from '@/types'

export type AuthUser = {
  userID: number
  studentID?: string
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  email: string
  contactNumber: string
  role: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'
  facultyID?: number
  createdTimestamp: string
  avatar?: string
}

export interface UseAuthReturn {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  role: string | null
  isFaculty: boolean
  facultyID: number | null
}

function toAuthUser(u: SharedUser | undefined): AuthUser | null {
  if (!u || !u.id) return null
  const first = u.first_name ?? ''
  const middle = (u.middle_name ?? '') || ''
  const last = u.last_name ?? ''
  const full = [first, middle, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  const facultyIDNum = (() => {
    const raw = u.faculty_id ?? null
    if (raw == null) return undefined
    const n = Number(String(raw).replace(/[^0-9]/g, ''))
    return Number.isFinite(n) ? n : undefined
  })()
  return {
    userID: u.id,
    studentID: u.student_id ?? undefined,
    firstName: first,
    middleName: middle || undefined,
    lastName: last,
    fullName: full,
    email: u.email ?? '',
    contactNumber: u.contact_number ?? '',
    role: (u.role ?? u.roles?.[0]?.name ?? 'Student') as AuthUser['role'],
    facultyID: facultyIDNum,
    createdTimestamp: u.created_at ?? '',
    avatar: u.avatar ?? undefined,
  }
}

export function useAuth(): UseAuthReturn {
  const page = usePage<SharedData>()
  const [navigating, setNavigating] = useState(false)

  const activeRole = useMemo(() => {
    const raw = page.props?.active_role
      ?? page.props?.auth?.active_role
      ?? page.props?.auth?.activeRole
      ?? null

    return typeof raw === 'string' && raw ? raw : null
  }, [page.props?.active_role, page.props?.auth?.active_role, page.props?.auth?.activeRole])

  useEffect(() => {
    const onStart = () => setNavigating(true)
    const onFinish = () => setNavigating(false)
    if (typeof document !== 'undefined') {
      document.addEventListener('inertia:start', onStart as EventListener)
      document.addEventListener('inertia:finish', onFinish as EventListener)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('inertia:start', onStart as EventListener)
        document.removeEventListener('inertia:finish', onFinish as EventListener)
      }
    }
  }, [])

  const user = useMemo(() => toAuthUser(page.props.auth?.user), [page.props.auth?.user])
  const role = useMemo(() => {
    if (activeRole) return activeRole

    const roles = page.props.auth?.user?.roles?.map((roleEntry) => roleEntry.name).filter(Boolean) ?? []
    const priority = ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'] as const

    for (const roleName of priority) {
      if (roles.includes(roleName)) return roleName
    }

    return user?.role ?? null
  }, [activeRole, page.props.auth?.user?.roles, user?.role])
  const isAuthenticated = useMemo(() => !!user, [user])
  const isFaculty = useMemo(() => role === 'Faculty', [role])
  const facultyID = useMemo(() => (user?.facultyID ?? null) as number | null, [user])
  const isLoading = navigating

  return { user, isAuthenticated, isLoading, role, isFaculty, facultyID }
}
