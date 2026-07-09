import { AlertCircle, Check } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ModalHeader from '@/components/shared/modal-header'
import ModalFooter from '@/components/shared/modal-footer'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ModalHeader
          title="Confirm Role Changes"
          variant={isLastAdminWarning || isOwnAccountWarning ? 'danger' : 'warning'}
          icon={AlertCircle}
        />

        <div className="space-y-4">
          {isLastAdminWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot Remove Last Administrator</AlertTitle>
              <AlertDescription>
                This is the only Administrator account. Assign the role to another user first.
              </AlertDescription>
            </Alert>
          )}

          {isOwnAccountWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Removing Your Own Permissions</AlertTitle>
              <AlertDescription>
                You will lose access to this admin panel after saving. Are you sure?
              </AlertDescription>
            </Alert>
          )}

          {!isLastAdminWarning && !isOwnAccountWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permission Impact</AlertTitle>
              <AlertDescription>
                These role changes will affect what this user can access and do in the system.
              </AlertDescription>
            </Alert>
          )}

          {addedRoles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                Adding
              </h4>
              <ul className="space-y-1 ml-6">
                {addedRoles.map((role) => (
                  <li key={role.id} className="text-sm text-foreground">
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {removedRoles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                Removing
              </h4>
              <ul className="space-y-1 ml-6">
                {removedRoles.map((role) => (
                  <li key={role.id} className="text-sm text-foreground line-through opacity-60">
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs italic text-muted-foreground">
            These changes will be recorded in the activity log and audited.
          </div>
        </div>

        <ModalFooter
          onCancel={() => onOpenChange(false)}
          onConfirm={onConfirm}
          confirmText="Confirm Changes"
          cancelText="Cancel"
          danger={isOwnAccountWarning}
          isLoading={isLoading}
          disabled={isLastAdminWarning}
        />
      </DialogContent>
    </Dialog>
  )
}
