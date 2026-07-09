import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Shield, Briefcase, GraduationCap, UserCheck } from 'lucide-react'

type Role = 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'
type Size = 'xs' | 'sm' | 'md' | 'lg'

/**
 * A compact, accessible badge for displaying a user's role with role-specific styling.
 *
 * Props allow controlling size variants, icon visibility, icon-only mode (with tooltip),
 * and optional click interaction for use in filters or tables.
 */
type Props = {
  role: Role
  size?: Size
  showIcon?: boolean
  iconOnly?: boolean
  description?: string
  onClick?: () => void
  className?: string
}

const roleStyles: Record<Role, string> = {
  Administrator: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
  'MCIIS Staff': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  Faculty: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  Student: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
}

const sizeStyles: Record<Size, string> = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

function iconFor(role: Role) {
  if (role === 'Administrator') return Shield
  if (role === 'MCIIS Staff') return Briefcase
  if (role === 'Faculty') return GraduationCap
  return UserCheck
}

/**
 * Renders a role badge.
 * - Emits tooltip when `description` is provided or `iconOnly` is true
 * - Keyboard-accessible when `onClick` is supplied (Enter/Space)
 */
function UserRoleBadge({ role, size = 'md', showIcon = true, iconOnly = false, description, onClick, className }: Props) {
  const Icon = iconFor(role)
  const base = `${roleStyles[role]} ${sizeStyles[size]} inline-flex items-center gap-1 rounded-md border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring` 
  const content = (
    <Badge
      className={`${base} ${className ?? ''}`}
      aria-label={`${role}${description ? ` — ${description}` : ''}`}
      role="status"
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {!iconOnly && <span>{role}</span>}
    </Badge>
  )

  if (description || iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{description ?? role}</TooltipContent>
      </Tooltip>
    )
  }
  return content
}

export default memo(UserRoleBadge)
