import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

type SummaryEntry = {
  name?: string | null
  email?: string | null
  old_email?: string | null
  new_email?: string | null
}

type Summary = {
  added?: SummaryEntry[]
  changed_emails?: SummaryEntry[]
  expired?: SummaryEntry[]
  archive_revoked?: SummaryEntry[]
  removed?: SummaryEntry[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary?: Summary | null
  removalOnly?: boolean
  onChoose: (action: 'save_only' | 'send_invitations') => void | Promise<void>
  isLoading?: boolean
}

const buildPeople = (summary?: Summary | null) => {
  if (!summary) return []

  const people: Array<{ label: string; detail?: string }> = []

  ;(summary.added ?? []).forEach((item) => {
    people.push({ label: item.name ?? 'New researcher', detail: item.email ?? undefined })
  })

  ;(summary.changed_emails ?? []).forEach((item) => {
    people.push({ label: item.name ?? 'Researcher', detail: `${item.old_email ?? 'unknown'} → ${item.new_email ?? 'unknown'}` })
  })

  ;(summary.expired ?? []).forEach((item) => {
    people.push({ label: item.name ?? 'Researcher', detail: item.email ?? undefined })
  })

  ;(summary.archive_revoked ?? []).forEach((item) => {
    people.push({ label: item.name ?? 'Researcher', detail: item.email ?? undefined })
  })

  ;(summary.removed ?? []).forEach((item) => {
    people.push({ label: item.name ?? 'Researcher', detail: 'Access will be removed' })
  })

  return people
}

export default function ResearchSaveDecisionModal({ open, onOpenChange, summary, removalOnly = false, onChoose, isLoading = false }: Props) {
  const people = buildPeople(summary)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>{removalOnly ? 'Researcher access change' : 'Researcher access changes'}</DialogTitle>
          </div>
          <DialogDescription>
            {removalOnly
              ? 'This researcher will lose access to this research. Choose how you want to save the change.'
              : 'These researcher access changes need your decision before the save can continue.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
          {people.length > 0 ? (
            <ul className="space-y-2">
              {people.map((person, index) => (
                <li key={`${person.label}-${index}`} className="flex items-start justify-between gap-3">
                  <span>{person.label}</span>
                  {person.detail ? <span className="text-muted-foreground">{person.detail}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No additional researcher changes were detected.</p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {removalOnly ? (
            <Button type="button" onClick={() => onChoose('save_only')} disabled={isLoading}>
              Save changes
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onChoose('save_only')} disabled={isLoading}>
                Save only
              </Button>
              <Button type="button" onClick={() => onChoose('send_invitations')} disabled={isLoading}>
                Save & send invitations
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
