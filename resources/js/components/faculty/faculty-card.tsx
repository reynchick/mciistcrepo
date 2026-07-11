import { useMemo } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { type Faculty, type SharedData } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Eye, Edit2, Trash2 } from 'lucide-react'

type Variant = 'list' | 'grid' | 'compact'

interface Props {
  faculty: Faculty & { avatar?: string | null }
  variant?: Variant
  researchCount?: number
  onDelete?: (faculty: Faculty) => void
  className?: string
}

export default function FacultyCard({ faculty, variant = 'grid', researchCount, onDelete, className }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((r) => r.name === 'Administrator') ?? auth.user.role === 'Administrator'
  const isFaculty = auth.user.role === 'Faculty' || auth.user.roles?.some((r) => r.name === 'Faculty')
  const isOwn = !!(isFaculty && auth.user.faculty_id && faculty.faculty_id && auth.user.faculty_id === faculty.faculty_id)

  const name = buildName(faculty)
  const initials = getInitials(faculty)
  const color = useMemo(() => colorFromString(name), [name])

  const hrefView = `/faculty/${faculty.id}`
  const hrefEdit = `/faculty/${faculty.id}/edit`

  const Layout = (
    <article className={['group transition hover:shadow-sm rounded-lg border bg-background', className].filter(Boolean).join(' ')}>
      <Link href={hrefView} className="absolute inset-0" aria-label={`View ${name}`} />
      <Card className="border-0 shadow-none">
        <CardContent className={variant === 'list' ? 'p-4 flex items-center gap-4' : variant === 'compact' ? 'p-3 flex items-center gap-3' : 'p-4 space-y-3'}>
          {variant === 'grid' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={faculty.avatar ?? undefined} alt={name} />
                  <AvatarFallback style={{ backgroundColor: color, color: '#fff' }}>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium line-clamp-1">{name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{faculty.position || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {researchCount !== undefined && (
                  <Badge variant="secondary">{researchCount} Research Projects</Badge>
                )}
                {faculty.orcid && <Badge variant="outline">ORCID</Badge>}
                <Actions hrefView={hrefView} hrefEdit={hrefEdit} canEdit={isAdmin || isOwn} canDelete={isAdmin} onDelete={() => onDelete?.(faculty)} />
              </div>
            </div>
          )}

          {variant === 'list' && (
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarImage src={faculty.avatar ?? undefined} alt={name} />
                <AvatarFallback style={{ backgroundColor: color, color: '#fff' }}>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium line-clamp-1">
                  <Link href={hrefView} className="hover:underline">{name}</Link>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-1">{faculty.position || '-'}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{faculty.designation || ''}</div>
                <div className="text-xs line-clamp-1">{faculty.field_of_specialization || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {researchCount !== undefined && (
                  <Badge variant="secondary">{researchCount}</Badge>
                )}
                <Actions hrefView={hrefView} hrefEdit={hrefEdit} canEdit={isAdmin || isOwn} canDelete={isAdmin} onDelete={() => onDelete?.(faculty)} />
              </div>
            </div>
          )}

          {variant === 'compact' && (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={faculty.avatar ?? undefined} alt={name} />
                <AvatarFallback style={{ backgroundColor: color, color: '#fff' }}>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-1">{name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{faculty.position || '-'}</div>
              </div>
              <Actions hrefView={hrefView} hrefEdit={hrefEdit} canEdit={isAdmin || isOwn} canDelete={isAdmin} onDelete={() => onDelete?.(faculty)} />
            </div>
          )}
        </CardContent>
      </Card>
    </article>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{Layout}</TooltipTrigger>
        <TooltipContent>
          <div className="grid gap-1">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{faculty.email || 'No email'}</div>
            <div className="text-xs text-muted-foreground">{faculty.contact_number || 'No contact'}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function Actions({ hrefView, hrefEdit, canEdit, canDelete, onDelete }: { hrefView: string; hrefEdit: string; canEdit: boolean; canDelete: boolean; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label="View profile" asChild>
        <Link href={hrefView}><Eye className="h-4 w-4" /></Link>
      </Button>
      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions"><Edit2 className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && <DropdownMenuItem asChild><Link href={hrefEdit}>Edit</Link></DropdownMenuItem>}
            {canDelete && <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function buildName(f: Faculty) {
  return [f.first_name, f.middle_name, f.last_name].filter(Boolean).join(' ')
}

function getInitials(f: Faculty) {
  const a = (f.first_name || '').charAt(0)
  const b = (f.last_name || '').charAt(0)
  return `${a}${b}`.toUpperCase() || 'F'
}

function colorFromString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 80% 50%)`
}
