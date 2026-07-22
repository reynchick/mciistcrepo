import { useMemo } from 'react'
import { useAuth, type AuthUser } from '@/hooks/use-auth'
import type { Faculty, Research } from '@/types'
import { canRole, type PermissionKey } from '@/lib/permissions'

type UsePermissionsReturn = {
  user: AuthUser | null
  role: string | null
  is: (role: string) => boolean
  isAdmin: () => boolean
  isStaff: () => boolean
  isFaculty: () => boolean
  isStudent: () => boolean
  can: (permission: PermissionKey) => boolean
  canView: (entity: string) => boolean
  canCreate: (entity: string) => boolean
  canEdit: (entity: string, item?: unknown) => boolean
  canDelete: (entity: string, item?: unknown) => boolean
  canEditResearch: (research: Research) => boolean
  canEditFacultyProfile: (faculty: Faculty) => boolean
  canManageUsers: () => boolean
  canViewLogs: () => boolean
  canGenerateReports: () => boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { user, role } = useAuth()

  const isAdminRole = useMemo(() => role === 'Administrator', [role])
  const isStaffRole = useMemo(() => role === 'MCIIS Staff', [role])
  const isFacultyRole = useMemo(() => role === 'Faculty', [role])
  const isStudentRole = useMemo(() => role === 'Student', [role])

  const is = (r: string) => (role ?? '').toLowerCase() === r.toLowerCase()

  const can = (permission: PermissionKey) => {
    if (!role) return false
    return canRole(role as any, permission)
  }

  const canView = (entity: string) => can((`view_${entity}` as PermissionKey))
  const canCreate = (entity: string) => can((`create_${entity}` as PermissionKey))
  const canEdit = (entity: string, item?: unknown) => {
    const key = (`edit_${entity}` as PermissionKey)
    if (entity === 'research' && item) return canEditResearch(item as Research)
    if (entity === 'faculty' && item) return canEditFacultyProfile(item as Faculty)
    return can(key)
  }
  const canDelete = (entity: string, _item?: unknown) => can((`delete_${entity}` as PermissionKey))

  const canEditResearch = (research: Research) => {
    if (isAdminRole || isStaffRole) return true
    if (isFacultyRole) {
      const adviser = research.research_adviser ?? null
      return adviser != null && user?.facultyID != null && adviser === user.facultyID
    }
    return false
  }

  const canEditFacultyProfile = (_faculty: Faculty) => {
    // Only Administrator can edit faculty records
    return isAdminRole
  }

  const canManageUsers = () => can('manage_users')
  const canViewLogs = () => can('view_logs')
  const canGenerateReports = () => can('generate_reports')

  return {
    user,
    role,
    is,
    isAdmin: () => isAdminRole,
    isStaff: () => isStaffRole,
    isFaculty: () => isFacultyRole,
    isStudent: () => isStudentRole,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canEditResearch,
    canEditFacultyProfile,
    canManageUsers,
    canViewLogs,
    canGenerateReports,
  }
}
