import { Trash2 } from 'lucide-react'
import ConfirmationModal from '@/components/modals/confirmation-modal'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  itemName?: string
  onDelete: () => Promise<void> | void
  isLoading?: boolean
}

export default function DeleteModal({
  open,
  onOpenChange,
  title,
  itemName,
  onDelete,
  isLoading = false,
}: Props) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={itemName ? `Delete "${itemName}"? This action cannot be undone.` : 'This action cannot be undone.'}
      confirmText="Delete"
      cancelText="Cancel"
      danger={true}
      icon={Trash2}
      onConfirm={onDelete}
    />
  )
}
