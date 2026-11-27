import { router } from '@inertiajs/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import UserForm from './user-form'

type RoleOption = { id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleOption[]
  adminCount?: number
}

export default function UserCreateModal({ open, onOpenChange, roles, adminCount = 1 }: Props) {
  const close = () => onOpenChange(false)
  const refresh = () => {
    close()
    router.get('/users', {}, { preserveScroll: true, preserveState: false })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90dvh,760px)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:!max-w-5xl">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
          <DialogTitle>Add new user</DialogTitle>
          <DialogDescription>Create an account and assign roles without leaving User Management.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <UserForm
            mode="create"
            roles={roles}
            adminCount={adminCount}
            onCancelAction={close}
            onSuccessAction={refresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
