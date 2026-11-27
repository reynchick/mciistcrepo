import { AlertCircle, Check, Loader2, Minus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type RoleOption = { id: number; name: string; description?: string }

interface RoleChangeConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  addedRoles: RoleOption[]
  removedRoles: RoleOption[]
  isLastAdminWarning?: boolean
  isOwnAccountWarning?: boolean
  isLoading?: boolean
}

function RoleRow({ role, kind }: { role: RoleOption; kind: 'added' | 'removed' }) {
  const added = kind === 'added'

  return (
    <li className="flex items-start gap-3 px-3 py-2.5 text-left">
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
          added
            ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
        }`}
      >
        {added ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold text-foreground ${added ? '' : 'line-through opacity-60'}`}>{role.name}</p>
        {role.description && (
          <p className={`text-xs text-muted-foreground ${added ? '' : 'line-through opacity-60'}`}>{role.description}</p>
        )}
      </div>

      <span
        className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide ${
          added ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
        }`}
      >
        {added ? 'Adding' : 'Removing'}
      </span>
    </li>
  )
}

export default function RoleChangeConfirmation({
  open,
  onOpenChange,
  onConfirm,
  addedRoles,
  removedRoles,
  isLastAdminWarning = false,
  isOwnAccountWarning = false,
  isLoading = false,
}: RoleChangeConfirmationProps) {
  const hasChanges = addedRoles.length > 0 || removedRoles.length > 0

  if (!hasChanges) return null

  const danger = isLastAdminWarning || isOwnAccountWarning

  const message = isLastAdminWarning
    ? 'This is the only Administrator account. Assign the role to another user first.'
    : isOwnAccountWarning
      ? 'You will lose access to this admin panel after saving. Are you sure?'
      : 'These role changes will affect what this user can access and do in the system.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-2xl p-6 text-center sm:max-w-md">
        {/* Icon with a soft halo */}
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ${
            danger ? 'bg-red-50 dark:bg-red-950/40' : 'bg-amber-50 dark:bg-amber-950/40'
          }`}
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full ${
              danger ? 'bg-red-100 dark:bg-red-950/70' : 'bg-amber-100 dark:bg-amber-950/70'
            }`}
          >
            <AlertCircle className={`size-5 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
        </div>

        <DialogTitle className="mt-4 text-center text-xl font-bold tracking-tight">Confirm Role Changes</DialogTitle>
        <DialogDescription className="mx-auto mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
          {message}
        </DialogDescription>

        {/* Summary of what changes */}
        <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/50">
          {addedRoles.map((role) => (
            <RoleRow key={`added-${role.id}`} role={role} kind="added" />
          ))}
          {removedRoles.map((role) => (
            <RoleRow key={`removed-${role.id}`} role={role} kind="removed" />
          ))}
        </ul>

        <p className="mt-3 text-xs italic text-muted-foreground">
          These changes will be recorded in the activity log and audited.
        </p>

        {/* Buttons side by side, confirm first (same as the reference) */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLastAdminWarning || isLoading}
            className={`h-10 w-full text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0047AB] hover:bg-[#003B91]'
            }`}
          >
            {isLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Confirm Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="h-10 w-full shadow-none">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}