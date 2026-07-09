import { useEffect, useRef, useState } from 'react'
import { Archive } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ConfirmationModal from '@/components/modals/confirmation-modal'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  program?: string
  year?: number
  onArchive: (reason?: string) => Promise<void> | void
  isLoading?: boolean
}

export default function ArchiveModal({
  open,
  onOpenChange,
  title,
  program,
  year,
  onArchive,
  isLoading = false,
}: Props) {
  const [reason, setReason] = useState('')
  const firstRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (open && firstRef.current) {
      firstRef.current.focus()
    }
    if (!open) {
      setReason('')
    }
  }, [open])

  const handleArchive = async () => {
    await Promise.resolve(onArchive(reason))
  }

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title="Archive research"
      description="This action hides the research from public view."
      confirmText="Archive"
      cancelText="Cancel"
      danger={true}
      icon={Archive}
      onConfirm={handleArchive}
    >
      <div className="space-y-3">
        <div className="text-sm">
          <div className="font-medium">{title}</div>
          <div className="text-muted-foreground">
            {[program, year].filter(Boolean).join(' • ')}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Archive reason</Label>
          <Textarea
            ref={firstRef}
            id="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            disabled={isLoading}
            placeholder="Why are you archiving this research?"
          />
        </div>
      </div>
    </ConfirmationModal>
  )
}
