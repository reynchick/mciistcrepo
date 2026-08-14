import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ConfirmationModal from '@/components/modals/confirmation-modal'
import { Archive, RotateCcw, Send, Trash2 } from 'lucide-react'

type WorkflowAction = 'return' | 'archive' | 'restore' | 'requestMetadata' | 'hardDelete'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: WorkflowAction | null
  onConfirm: (note: string, confirmation?: string) => void | Promise<void>
  isLoading?: boolean
}

const actionMeta: Record<WorkflowAction, { title: string; description: string; confirmText: string; placeholder: string; danger?: boolean; icon: typeof Archive; fieldLabel: string; required?: boolean; confirmationLabel?: string }> = {
  return: {
    title: 'Return for revision',
    description: 'Add a note for the researcher so they can address the requested changes.',
    confirmText: 'Return',
    placeholder: 'Enter the revision note or feedback...',
    icon: Send,
    fieldLabel: 'Revision note',
    required: true,
  },
  archive: {
    title: 'Archive research',
    description: 'Provide a short reason for archiving this research.',
    confirmText: 'Archive',
    placeholder: 'Why is this research being archived?',
    danger: true,
    icon: Archive,
    fieldLabel: 'Archive reason',
    required: true,
  },
  restore: {
    title: 'Restore research',
    description: 'Add a brief note before restoring the archived record.',
    confirmText: 'Restore',
    placeholder: 'Enter a restoration note...',
    icon: RotateCcw,
    fieldLabel: 'Restoration note',
    required: true,
  },
  requestMetadata: {
    title: 'Request adviser metadata',
    description: 'Send a request to the adviser with a short note.',
    confirmText: 'Send request',
    placeholder: 'What metadata or clarification is needed?',
    icon: Send,
    fieldLabel: 'Request note',
    required: true,
  },
  hardDelete: {
    title: 'Hard delete research',
    description: 'This action permanently removes the research record.',
    confirmText: 'Delete permanently',
    placeholder: 'Why should this record be permanently deleted?',
    danger: true,
    icon: Trash2,
    fieldLabel: 'Reason',
    required: true,
    confirmationLabel: 'Type DELETE to confirm',
  },
}

export default function WorkflowNoteModal({ open, onOpenChange, action, onConfirm, isLoading = false }: Props) {
  const [note, setNote] = useState('')
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (!open) {
      setNote('')
      setConfirmation('')
    }
  }, [open])

  if (!action) return null

  const meta = actionMeta[action]
  const isValid = useMemo(() => {
    const hasNote = note.trim().length > 0
    if (action !== 'hardDelete') return hasNote
    return hasNote && confirmation.trim() === 'DELETE'
  }, [action, confirmation, note])

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
      confirmDisabled={!isValid || isLoading}
      onConfirm={() => onConfirm(note.trim(), action === 'hardDelete' ? confirmation.trim() : undefined)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workflow-note">{meta.fieldLabel}</Label>
          <Textarea
            id="workflow-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            placeholder={meta.placeholder}
            disabled={isLoading}
            aria-required={meta.required}
          />
        </div>
        {meta.confirmationLabel && (
          <div className="space-y-2">
            <Label htmlFor="workflow-delete-confirmation">{meta.confirmationLabel}</Label>
            <Input
              id="workflow-delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.currentTarget.value)}
              placeholder="DELETE"
              disabled={isLoading}
              aria-required="true"
            />
          </div>
        )}
      </div>
    </ConfirmationModal>
  )
}
