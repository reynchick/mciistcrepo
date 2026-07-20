import type { UserRole, User, Research, Faculty } from '@/types'

export type PermissionKey =
  | 'view_research'
  | 'create_research'
  | 'edit_research'
  | 'edit_own_research'
  | 'delete_research'
  | 'archive_research'
  | 'publish_research'
  | 'submit_research'
  | 'hard_delete_research'
  | 'manage_users'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'manage_faculty'
  | 'view_faculty'
  | 'create_faculty'
  | 'edit_faculty'
  | 'delete_faculty'
  | 'edit_own_profile'
  | 'manage_researchers'
  | 'manage_keywords'
  | 'manage_panelists'
  | 'manage_thematic_tags'
  | 'generate_compilation_reports'
  | 'generate_matrix_reports'
  | 'generate_productivity_reports'
  | 'generate_thematic_reports'
  | 'generate_statistics_reports'
  | 'view_logs'
  | 'view_audit_logs'
  | 'view_research_logs'
  | 'view_access_logs'
  | 'export_logs'
  | 'view_admin_dashboard'
  | 'view_staff_dashboard'
  | 'view_faculty_dashboard'
  | 'generate_reports'
  | 'view_reports'

export const AllPermissions: PermissionKey[] = [
  'view_research',
  'create_research',
  'edit_research',
  'edit_own_research',
  'delete_research',
  'archive_research',
  'publish_research',
  'submit_research',
  'hard_delete_research',
  'manage_users',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'manage_faculty',
  'view_faculty',
  'create_faculty',
  'edit_faculty',
  'delete_faculty',
  'edit_own_profile',
  'manage_researchers',
  'manage_keywords',
  'manage_panelists',
  'manage_thematic_tags',
  'generate_compilation_reports',
  'generate_matrix_reports',
  'generate_productivity_reports',
  'generate_thematic_reports',
  'generate_statistics_reports',
  'view_logs',
  'view_audit_logs',
  'view_research_logs',
  'view_access_logs',
  'export_logs',
  'view_admin_dashboard',
  'view_staff_dashboard',
  'view_faculty_dashboard',
  'generate_reports',
  'view_reports',
]

export const ROLES = {
  ADMIN: 'Administrator',
  STAFF: 'MCIIS Staff',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
} as const

export const PERMISSIONS = {
  VIEW_RESEARCH: 'view_research',
  CREATE_RESEARCH: 'create_research',
  EDIT_RESEARCH: 'edit_research',
  EDIT_OWN_RESEARCH: 'edit_own_research',
  DELETE_RESEARCH: 'delete_research',
  ARCHIVE_RESEARCH: 'archive_research',
  PUBLISH_RESEARCH: 'publish_research',
  SUBMIT_RESEARCH: 'submit_research',
  HARD_DELETE_RESEARCH: 'hard_delete_research',
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_FACULTY: 'manage_faculty',
  VIEW_FACULTY: 'view_faculty',
  CREATE_FACULTY: 'create_faculty',
  EDIT_FACULTY: 'edit_faculty',
  DELETE_FACULTY: 'delete_faculty',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  MANAGE_RESEARCHERS: 'manage_researchers',
  MANAGE_KEYWORDS: 'manage_keywords',
  MANAGE_PANELISTS: 'manage_panelists',
  MANAGE_THEMATIC_TAGS: 'manage_thematic_tags',
  GENERATE_COMPILATION_REPORTS: 'generate_compilation_reports',
  GENERATE_MATRIX_REPORTS: 'generate_matrix_reports',
  GENERATE_PRODUCTIVITY_REPORTS: 'generate_productivity_reports',
  GENERATE_THEMATIC_REPORTS: 'generate_thematic_reports',
  GENERATE_STATISTICS_REPORTS: 'generate_statistics_reports',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_RESEARCH_LOGS: 'view_research_logs',
  VIEW_ACCESS_LOGS: 'view_access_logs',
  EXPORT_LOGS: 'export_logs',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  VIEW_STAFF_DASHBOARD: 'view_staff_dashboard',
  VIEW_FACULTY_DASHBOARD: 'view_faculty_dashboard',
  GENERATE_REPORTS: 'generate_reports',
  VIEW_REPORTS: 'view_reports',
} as const

export const rolePermissions: Record<UserRole, Set<PermissionKey>> = {
  Administrator: new Set<PermissionKey>([
    'view_research',
    'create_research',
    'view_faculty',
    'edit_own_profile',
    'view_admin_dashboard',
    'view_reports',
    'generate_reports',
    'generate_compilation_reports',
    'generate_matrix_reports',
    'generate_productivity_reports',
    'generate_thematic_reports',
    'generate_statistics_reports',
    'view_logs',
    'view_audit_logs',
    'view_research_logs',
    'view_access_logs',
    'export_logs',
    'manage_users',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'manage_faculty',
    'create_faculty',
    'edit_faculty',
    'delete_faculty',
    'manage_researchers',
    'manage_keywords',
    'manage_panelists',
    'manage_thematic_tags',
  ]),
  'MCIIS Staff': new Set<PermissionKey>([
    'view_research',
    'create_research',
    'edit_research',
    'delete_research',
    'archive_research',
    'view_faculty',
    'manage_researchers',
    'manage_keywords',
    'manage_panelists',
    'manage_thematic_tags',
    'generate_matrix_reports',
    'generate_productivity_reports',
    'generate_thematic_reports',
    'view_research_logs',
    'view_staff_dashboard',
    'view_reports',
    'generate_reports',
  ]),
  Faculty: new Set<PermissionKey>([
    'view_research',
    'create_research',
    'edit_own_research',
    'archive_research',
    'view_faculty',
    'manage_researchers',
    'manage_keywords',
    'manage_panelists',
    'view_faculty_dashboard',
    'view_reports',
  ]),
  Student: new Set<PermissionKey>([
    'view_research',
    'view_faculty',
    'view_reports',
  ]),
}

export const canRole = (role: UserRole, permission: PermissionKey) => rolePermissions[role]?.has(permission) ?? false

/**
 * Role-appropriate URL for the read-only Faculty directory listing page.
 * Mirrors the role-prefixed routes registered in routes/web.php.
 */
export function facultyListRoute(role?: string | null): string {
  switch (role) {
    case ROLES.STAFF:
      return '/staff/faculty'
    case ROLES.FACULTY:
      return '/faculty/faculty-list'
    case ROLES.STUDENT:
      return '/student/faculty'
    default:
      return '/faculty'
  }
}

export function userCan(user: User, permission: string): boolean {
  const p = permission as PermissionKey
  if (!user) return false
  const r = user.role as UserRole | undefined
  if (r && canRole(r, p)) return true
  const roles = user.roles ?? []
  for (const rr of roles) {
    const name = rr?.name as UserRole | undefined
    if (name && canRole(name, p)) return true
  }
  return false
}

export function userHasRole(user: User, role: UserRole | UserRole[]): boolean {
  if (!user) return false
  const r = user.role as UserRole | undefined
  const list = Array.isArray(role) ? role : [role]
  if (r && list.includes(r)) return true
  const roles = user.roles ?? []
  return roles.some((rr) => list.includes(rr.name as UserRole))
}

export function userCanEditResearch(user: User, research: Research): boolean {
  if (!user || !research) return false
  const r = user.role as UserRole | undefined
  if (r === ROLES.ADMIN) return false
  if (r === ROLES.STAFF) return true
  if (r === ROLES.FACULTY) {
    const adviser = research.research_adviser ?? null
    const raw = user.faculty_id ?? null
    const fid = raw == null ? null : (() => {
      const n = Number(String(raw).replace(/[^0-9]/g, ''))
      return Number.isFinite(n) ? n : null
    })()
    return adviser != null && fid != null && adviser === fid
  }
  return false
}

export function userCanEditFacultyProfile(user: User, _faculty: Faculty): boolean {
  if (!user) return false
  // Only Administrator can edit faculty records
  const r = user.role as UserRole | undefined
  if (r === ROLES.ADMIN) return true
  return (user.roles ?? []).some((rr) => rr?.name === ROLES.ADMIN)
}

export function userCanDeleteUser(user: User, targetUser: User): boolean {
  if (!user || !targetUser) return false
  const r = user.role as UserRole | undefined
  if (r !== ROLES.ADMIN) return false
  if (user.id === targetUser.id) return false
  return true
}

export function canManageThematicTags(user: User): boolean {
  return userHasRole(user, ROLES.STAFF)
}

export function canViewLogs(user: User): boolean {
  return userCan(user, PERMISSIONS.VIEW_AUDIT_LOGS)
}

export function canGenerateReports(user: User): boolean {
  return (
    userCan(user, PERMISSIONS.GENERATE_COMPILATION_REPORTS) ||
    userCan(user, PERMISSIONS.GENERATE_MATRIX_REPORTS) ||
    userCan(user, PERMISSIONS.GENERATE_PRODUCTIVITY_REPORTS)
  )
}

export function canPublishResearch(user: User): boolean {
  return userCan(user, PERMISSIONS.PUBLISH_RESEARCH)
}

export function canSubmitResearch(user: User): boolean {
  return userCan(user, PERMISSIONS.SUBMIT_RESEARCH)
}

export function canArchiveResearch(user: User): boolean {
  return userCan(user, PERMISSIONS.ARCHIVE_RESEARCH)
}

export function canHardDeleteResearch(user: User): boolean {
  return userCan(user, PERMISSIONS.HARD_DELETE_RESEARCH)
}
