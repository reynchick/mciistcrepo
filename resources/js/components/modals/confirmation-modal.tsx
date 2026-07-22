import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Info, Trash2 } from 'lucide-react'
import ModalHeader from '@/components/shared/modal-header'
import ModalFooter from '@/components/shared/modal-footer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  icon?: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
  onConfirm: () => Promise<void> | void
  onCancel?: () => void
  isLoading?: boolean
}

export default function ConfirmationModal({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', danger, icon, children, onConfirm, onCancel, isLoading: externalLoading = false }: Props) {
  const [loading, setLoading] = useState(false)
  const confirmRef = useRef<HTMLButtonElement | null>(null)
  const Icon = icon ?? (danger ? Trash2 : Info)

  useEffect(() => {
    if (open) setLoading(false)
  }, [open])

  const handleCancel = () => {
    if (loading || externalLoading) return
    if (onCancel) onCancel()
    onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (loading || externalLoading) return
    setLoading(true)
    await Promise.resolve(onConfirm())
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onOpenChange(false)
          if (e.key === 'Enter') handleConfirm()
        }}
      >
        <ModalHeader
          title={title}
          variant={danger ? 'danger' : 'default'}
          icon={Icon}
        />
        {description && (
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
        )}
        {children}
        <ModalFooter
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          confirmText={confirmText}
          cancelText={cancelText}
          danger={danger}
          isLoading={loading || externalLoading}
        />
      </DialogContent>
    </Dialog>
  )
}

export type { Props as ConfirmationModalProps }
