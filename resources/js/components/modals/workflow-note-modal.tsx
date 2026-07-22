import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ConfirmationModal from '@/components/modals/confirmation-modal'
import { Archive, RotateCcw, Send, Trash2 } from 'lucide-react'

type WorkflowAction = 'return' | 'archive' | 'restore' | 'requestMetadata' | 'hardDelete'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: WorkflowAction | null
  onConfirm: (note: string) => void | Promise<void>
  isLoading?: boolean
}

const actionMeta: Record<WorkflowAction, { title: string; description: string; confirmText: string; placeholder: string; danger?: boolean; icon: typeof Archive }> = {
  return: {
    title: 'Return for revision',
    description: 'Add a note for the researcher so they can address the requested changes.',
    confirmText: 'Return',
    placeholder: 'Enter the revision note or feedback...',
    icon: Send,
  },
  archive: {
    title: 'Archive research',
    description: 'Provide a short reason for archiving this research.',
    confirmText: 'Archive',
    placeholder: 'Why is this research being archived?',
    danger: true,
    icon: Archive,
  },
  restore: {
    title: 'Restore research',
    description: 'Add a brief note before restoring the archived record.',
    confirmText: 'Restore',
    placeholder: 'Optional restoration note...',
    icon: RotateCcw,
  },
  requestMetadata: {
    title: 'Request adviser metadata',
    description: 'Send a request to the adviser with a short note.',
    confirmText: 'Send request',
    placeholder: 'What metadata or clarification is needed?',
    icon: Send,
  },
  hardDelete: {
    title: 'Hard delete research',
    description: 'This action permanently removes the research record.',
    confirmText: 'Delete permanently',
    placeholder: 'Why should this record be permanently deleted?',
    danger: true,
    icon: Trash2,
  },
}

export default function WorkflowNoteModal({ open, onOpenChange, action, onConfirm, isLoading = false }: Props) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) setNote('')
  }, [open])

  if (!action) return null

  const meta = actionMeta[action]

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={meta.title}
      description={meta.description}
      confirmText={meta.confirmText}
      cancelText="Cancel"
      danger={meta.danger}
      icon={meta.icon}
      isLoading={isLoading}
      onConfirm={() => onConfirm(note)}
    >
      <div className="space-y-2">
        <Label htmlFor="workflow-note">Note</Label>
        <Textarea
          id="workflow-note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          placeholder={meta.placeholder}
          disabled={isLoading}
        />
      </div>
    </ConfirmationModal>
  )
}
