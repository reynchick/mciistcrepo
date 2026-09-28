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
 *
 * By default the badge is just a colored background + text (no border, no icon).
 * Pass `showIcon` to bring the icon back.
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
  Administrator: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'MCIIS Staff': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Faculty: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  Student: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

const sizeStyles: Record<Size, string> = {
  xs: 'text-[11px] px-3 py-1.5',
  sm: 'text-xs px-3.5 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
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
function UserRoleBadge({ role, size = 'md', showIcon = false, iconOnly = false, description, onClick, className }: Props) {
  const Icon = iconFor(role)
  // Icon-only mode has nothing else to show, so it always renders the icon
  const displayIcon = showIcon || iconOnly
  const base = `${roleStyles[role]} ${sizeStyles[size]} inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border-0 font-medium leading-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring`
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
      {displayIcon && <Icon className="h-3.5 w-3.5" aria-hidden />}
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