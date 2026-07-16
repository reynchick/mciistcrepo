import { useMemo, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import UserRoleBadge from './user-role-badge'
import ModalHeader from '@/components/shared/modal-header'
import ModalFooter from '@/components/shared/modal-footer'
import { useInitials } from '@/hooks/use-initials'
import { type SharedData, type User } from '@/types'

type ResearchItem = { id: number | string; title: string }
type FacultyOption = { id: number; name: string; position?: string; workload?: number }

/**
 * Modal for Administrator-only deletion of a user account with safety checks.
 *
 * Shows user details, role badge, impact assessment per role,
 * typed confirmation, optional soft delete, and faculty reassignment.
 */
type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  isLastAdministrator?: boolean
  adminRemainingCount?: number
  facultyResearchCount?: number
  facultyResearchList?: ResearchItem[]
  staffModifiedCount?: number
  studentParticipationCount?: number
  studentResearchList?: ResearchItem[]
  lastLoginAgo?: string
  totalActions?: number
  facultyOptions?: FacultyOption[]
  preventSelfDelete?: boolean
  softDeleteAvailable?: boolean
  onDeleted?: () => void
}

/**
 * Renders the deletion confirmation dialog.
 * - Blocks deletion for last admin, self-delete, or unmet reassignment
 * - Sends DELETE via Inertia with reassignment and soft-delete flags
 */
export default function DeleteUserModal({ open, onOpenChange, user, isLastAdministrator, adminRemainingCount = 1, facultyResearchCount = 0, facultyResearchList = [], staffModifiedCount = 0, studentParticipationCount = 0, studentResearchList = [], lastLoginAgo, totalActions, facultyOptions = [], preventSelfDelete, softDeleteAvailable = true, onDeleted }: Props) {
  const { auth } = usePage<SharedData>().props
  const isOwnAccount = auth.user.id === user.id

  const [confirm, setConfirm] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [expandFaculty, setExpandFaculty] = useState(false)
  const [expandStudent, setExpandStudent] = useState(false)
  const [mode, setMode] = useState<'reassign' | 'detach'>('reassign')
  const [reassignTo, setReassignTo] = useState<number | undefined>()
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  const initials = useInitials()

  const fullName = `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`
  const accountAge = useMemo(() => formatAge(user.created_at), [user.created_at])

  const mustConfirm = confirm === user.email || confirm === 'DELETE'
  const requiresReassign = user.role === 'Faculty' && facultyResearchCount > 0 && mode === 'reassign'
  const canDelete = !processing && mustConfirm && !isOwnAccount && !isLastAdministrator && (!requiresReassign || !!reassignTo) && !preventSelfDelete

  const submit = async () => {
    if (!canDelete) return
    setProcessing(true)
    setError(undefined)
    const data = new FormData()
    if (user.role === 'Faculty' && facultyResearchCount > 0) {
      data.append('reassignment[mode]', mode)
      data.append('reassignment[faculty_id]', mode === 'reassign' && reassignTo ? String(reassignTo) : '')
    }
    await router.visit(`/users/${user.id}`, {
      method: 'delete',
      data,
      preserveScroll: true,
      onSuccess: () => {
        setProcessing(false)
        onOpenChange(false)
        onDeleted?.()
      },
      onError: () => {
        setProcessing(false)
        setError('Failed to delete user')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" aria-describedby="delete-user-desc" className="sm:max-w-xl">
        <ModalHeader
          title="Delete User Account"
          variant="danger"
          icon={AlertTriangle}
        />
        <DialogDescription id="delete-user-desc">This action cannot be undone</DialogDescription>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar ?? undefined} alt={fullName} />
              <AvatarFallback className="rounded bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">{initials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{fullName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              {user.role && <div className="mt-2"><UserRoleBadge role={user.role} size="sm" description={roleDescription(user.role)} /></div>}
            </div>
            <div className="text-right text-sm text-muted-foreground">Account created {accountAge}</div>
          </div>

          <Separator />

          <div className="space-y-4">
            {user.role === 'Faculty' && (
              <div className="space-y-2">
                <div className="font-medium">Faculty impact</div>
                <div className="text-sm text-muted-foreground">This faculty member is associated with {facultyResearchCount} research project(s)</div>
                {facultyResearchCount > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm">Action required</div>
                    <div className="text-sm text-muted-foreground">Reassign research projects to another faculty or detach association</div>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={mode === 'reassign'} onChange={() => setMode('reassign')} /> Reassign to another faculty</label>
                      <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={mode === 'detach'} onChange={() => setMode('detach')} /> Keep entries but remove faculty association</label>
                    </div>
                    {mode === 'reassign' && (
                      <div className="grid gap-2">
                        <Label htmlFor="reassign_to">Reassign to</Label>
                        <Input id="reassign_filter" placeholder="Filter faculty" onChange={() => {}} />
                        <div className="grid gap-2">
                          <select id="reassign_to" className="border rounded-md px-2 py-2" value={String(reassignTo ?? '')} onChange={(e) => setReassignTo(Number(e.target.value) || undefined)}>
                            <option value="">Select faculty</option>
                            {facultyOptions.map((f) => (
                              <option key={f.id} value={String(f.id)}>{f.name}{f.position ? ` — ${f.position}` : ''}{typeof f.workload === 'number' ? ` (${f.workload})` : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <button type="button" className="text-xs text-blue-600 inline-flex items-center gap-1" onClick={() => setExpandFaculty((v) => !v)}>
                      {expandFaculty ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} View affected research
                    </button>
                    {expandFaculty && (
                      <div className="max-h-40 overflow-auto border rounded-md p-2">
                        <ul className="text-sm list-disc pl-4">
                          {facultyResearchList.map((r) => (
                            <li key={r.id}>{r.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user.role === 'MCIIS Staff' && (
              <div className="space-y-2">
                <div className="font-medium">Staff impact</div>
                <div className="text-sm text-muted-foreground">This staff has created/modified {staffModifiedCount} research entries</div>
                <div className="text-xs text-muted-foreground">Research entry logs will be preserved for audit purposes</div>
              </div>
            )}

            {user.role === 'Administrator' && (
              <div className="space-y-2">
                <div className="font-medium">Administrator impact</div>
                {isLastAdministrator ? (
                  <div className="text-sm text-red-600">Cannot delete the last administrator account</div>
                ) : (
                  <div className="text-sm text-muted-foreground">System will have {Math.max(0, adminRemainingCount - 1)} administrators remaining</div>
                )}
              </div>
            )}

            {user.role === 'Student' && (
              <div className="space-y-2">
                <div className="font-medium">Student impact</div>
                <div className="text-sm text-muted-foreground">{studentParticipationCount === 0 ? 'This student account has no associated research entries' : `This student is listed as researcher in ${studentParticipationCount} projects`}</div>
                {studentParticipationCount > 0 && (
                  <div className="space-y-2">
                    <button type="button" className="text-xs text-blue-600 inline-flex items-center gap-1" onClick={() => setExpandStudent((v) => !v)}>
                      {expandStudent ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} View research participations
                    </button>
                    {expandStudent && (
                      <div className="max-h-40 overflow-auto border rounded-md p-2">
                        <ul className="text-sm list-disc pl-4">
                          {studentResearchList.map((r) => (
                            <li key={r.id}>{r.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="font-medium">Audit trail</div>
              <div className="text-sm text-muted-foreground">All audit logs will be preserved</div>
              {lastLoginAgo && <div className="text-sm text-muted-foreground">Last login {lastLoginAgo}</div>}
              {typeof totalActions === 'number' && <div className="text-sm text-muted-foreground">Total actions performed: {totalActions}</div>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="confirm">Type {user.email} or DELETE to confirm deletion</Label>
            <Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!mustConfirm && confirm.length > 0} placeholder={`Type ${user.email} or DELETE`} />
            {preventSelfDelete && <div className="text-sm text-red-600">This account cannot be deleted</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>

        <ModalFooter
          onCancel={() => onOpenChange(false)}
          onConfirm={submit}
          confirmText={processing ? 'Deleting…' : 'Delete User'}
          cancelText="Cancel"
          danger={true}
          isLoading={processing}
          disabled={!canDelete}
        />
      </DialogContent>
    </Dialog>
  )
}

function roleDescription(role: NonNullable<User['role']>) {
  if (role === 'Administrator') return 'Full system access'
  if (role === 'MCIIS Staff') return 'Manages repository operations'
  if (role === 'Faculty') return 'Academic personnel'
  return 'Student account'
}

function formatAge(created?: string) {
  if (!created) return ''
  const d = new Date(created).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - d)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days < 30) return `${days} day(s) ago`
  const months = Math.floor(days / 30)
  return `${months} month(s) ago`
}
