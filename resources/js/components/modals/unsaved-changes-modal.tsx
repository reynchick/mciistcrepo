import { useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import ConfirmationModal from '@/components/modals/confirmation-modal'

interface UnsavedChangesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onLeave: () => void | Promise<void>
  onStay: () => void
  isLoading?: boolean
  leaveButtonText?: string
  stayButtonText?: string
}

/**
 * Modal for warning users about unsaved changes.
 * Replaces browser's native confirmation dialogs with a branded, consistent UI.
 * Built on top of ConfirmationModal for design consistency.
 */
export default function UnsavedChangesModal({
  open,
  onOpenChange,
  title = 'Discard changes?',
  description = 'You have unsaved changes. If you leave now, all changes will be lost.',
  onLeave,
  onStay,
  isLoading = false,
  leaveButtonText = 'Discard Changes',
  stayButtonText = 'Keep Editing',
}: UnsavedChangesModalProps) {
  // Track when the close is coming from a confirmed leave action so we don't
  // run the stay logic during the same close event.
  const closingFromConfirmRef = useRef(false)

  const handleLeave = async () => {
    closingFromConfirmRef.current = true
    await Promise.resolve(onLeave())
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (closingFromConfirmRef.current) {
        closingFromConfirmRef.current = false
      } else if (!isLoading) {
        onStay()
      }
    }
    onOpenChange(newOpen)
  }

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      confirmText={leaveButtonText}
      cancelText={stayButtonText}
      icon={AlertCircle}
      onConfirm={handleLeave}
      onCancel={() => {
        closingFromConfirmRef.current = false
        onStay()
      }}
    />
  )
}
