import { useEffect, useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { type Faculty, type SharedData } from '@/types'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import ModalHeader from '@/components/shared/modal-header';
import ModalFooter from '@/components/shared/modal-footer';

type Strategy = 'reassign' | 'delete_research'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  faculty: Faculty & { avatar?: string | null }
  associatedCount?: number
  hasOngoing?: boolean
  onSuccessHref?: string
}

export default function DeleteFacultyModal({ open, onOpenChange, faculty, associatedCount = 0, hasOngoing = false, onSuccessHref = '/faculties' }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((r) => r.name === 'Administrator') ?? auth.user.role === 'Administrator'
  const isFaculty = auth.user.role === 'Faculty' || auth.user.roles?.some((r) => r.name === 'Faculty')
  const isOwn = !!(isFaculty && auth.user.faculty_id && faculty.faculty_id && auth.user.faculty_id === faculty.faculty_id)

  const name = useMemo(() => [faculty.first_name, faculty.middle_name, faculty.last_name].filter(Boolean).join(' '), [faculty])
  const initials = useMemo(() => `${(faculty.first_name || '').charAt(0)}${(faculty.last_name || '').charAt(0)}`.toUpperCase() || 'F', [faculty])

  const [strategy, setStrategy] = useState<Strategy>('reassign')
  const [targetFacultyId, setTargetFacultyId] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!open) {
      setStrategy('reassign')
      setTargetFacultyId('')
      setConfirmText('')
      setError(undefined)
      setProcessing(false)
    }
  }, [open])

  const canDelete = isAdmin && !isOwn
  const requiresConfirm = confirmText === 'DELETE' || confirmText.trim() === name.trim()
  const impactText = associatedCount > 0 ? `This faculty is associated with ${associatedCount} research project${associatedCount === 1 ? '' : 's'}` : 'No associated research records found'

  const onDelete = () => {
    setError(undefined)
    setProcessing(true)
    const data: Record<string, any> = { strategy }
    if (strategy === 'reassign' && targetFacultyId) data['target_faculty_id'] = targetFacultyId
    router.delete(`/faculties/${faculty.id}`, {
      preserveScroll: true,
      data,
      onSuccess: () => {
        setProcessing(false)
        onOpenChange(false)
        window.location.href = onSuccessHref
      },
      onError: () => {
        setProcessing(false)
        setError('Failed to delete faculty. Please review options or try again.')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog">
        <ModalHeader
          title="Delete Faculty Profile"
          variant="danger"
          icon={AlertTriangle}
        />
        <DialogDescription>This action cannot be undone</DialogDescription>

        {!canDelete && (
          <Alert variant="destructive">
            <AlertTitle>Insufficient permissions</AlertTitle>
            <AlertDescription>Only Administrators can delete faculty. You cannot delete your own profile.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={faculty.avatar ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium line-clamp-1">{name}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{faculty.position || '-'}</p>
            </div>
          </div>

          <div className="rounded-md border p-3 bg-red-50">
            <p className="text-sm font-medium text-red-700">{impactText}</p>
            {hasOngoing && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><ShieldAlert className="h-4 w-4" />Ongoing projects detected. Extra confirmation required.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>What should happen to associated research?</Label>
            <label className="flex items-center gap-2">
              <input type="radio" name="strategy" value="reassign" checked={strategy === 'reassign'} onChange={() => setStrategy('reassign')} />
              <span className="text-sm">Keep research entries and reassign to another faculty</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="strategy" value="delete_research" checked={strategy === 'delete_research'} onChange={() => setStrategy('delete_research')} />
              <span className="text-sm">Delete research entries</span>
            </label>
          </div>

          {strategy === 'reassign' && (
            <div className="grid gap-2">
              <Label htmlFor="target_faculty">Reassign to faculty ID</Label>
              <Input id="target_faculty" value={targetFacultyId} onChange={(e) => setTargetFacultyId(e.target.value)} placeholder="e.g., 42" />
              <p className="text-xs text-muted-foreground">Provide the target faculty ID for reassignment</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="confirm">Type the name or "DELETE" to confirm</Label>
            <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={name} />
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Destructive</Badge>
              <span className="text-xs text-muted-foreground">This will permanently remove the faculty profile</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <ModalFooter
          onCancel={() => onOpenChange(false)}
          onConfirm={onDelete}
          confirmText="Delete"
          cancelText="Cancel"
          danger={true}
          isLoading={processing}
          disabled={!canDelete || !requiresConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}
