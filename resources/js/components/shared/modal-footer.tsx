import { DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ModalFooterProps {
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  cancelText?: string
  confirmText?: string
  danger?: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export default function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  danger = false,
  isLoading = false,
  disabled = false,
  className,
}: ModalFooterProps) {
  return (
    <DialogFooter className={cn('gap-2 sm:gap-0', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading || disabled}
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        variant={danger ? 'destructive' : 'default'}
        onClick={onConfirm}
        disabled={isLoading || disabled}
      >
        {isLoading ? 'Working…' : confirmText}
      </Button>
    </DialogFooter>
  )
}
