import { useEffect, useId, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import type { ResearcherChangeSummary } from '@/types/models'
import { workflowCopy } from '@/lib/research-workflow-copy'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary?: ResearcherChangeSummary | null
  removalOnly?: boolean
  onChoose: (action: 'save_only' | 'send_invitations') => void | Promise<void>
  isLoading?: boolean
  submittedRecord?: boolean
  restoredDraft?: boolean
}

const sections = [
  { key: 'added', title: 'New researchers to invite' },
  { key: 'changed_emails', title: 'Changed email addresses' },
  { key: 'expired', title: 'Expired invitations' },
  { key: 'archive_revoked', title: 'Access revoked by archive' },
  { key: 'removed', title: 'Removed researchers' },
] as const

export default function ResearchSaveDecisionModal({ open, onOpenChange, summary, removalOnly = false, onChoose, isLoading = false, submittedRecord = false, restoredDraft = false }: Props) {
  const titleId = useId()
  const descriptionId = useId()
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const groups = useMemo(() => sections.filter((section) => (summary?.[section.key] ?? []).length > 0), [summary])

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const activeElement = document.querySelector<HTMLElement>('[data-dialog-close]')
    activeElement?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [isLoading, onOpenChange, open])

  const renderDetail = (sectionKey: string, person: (typeof summary)[keyof typeof summary]) => {
    if (!person) return null

    if (sectionKey === 'changed_emails') {
      return `${person.old_email ?? 'unknown'} → ${person.new_email ?? 'unknown'}`
    }

    return person.email ?? person.name
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-lg" aria-describedby={descriptionId} aria-labelledby={titleId}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle id={titleId}>{removalOnly ? 'Researcher access change' : 'Researcher access changes'}</DialogTitle>
          </div>
          <DialogDescription id={descriptionId}>
            {removalOnly ? workflowCopy.removedResearcher : 'These researcher access changes need your decision before the save can continue.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
          {groups.length > 0 ? groups.map((section) => (
            <div key={section.key} className="space-y-2">
              <div className="font-medium">{section.title}</div>
              <ul className="space-y-1">
                {(summary?.[section.key] ?? []).map((person, index) => {
                  const detail = renderDetail(section.key, person)
                  return (
                    <li key={`${section.key}-${index}`} className="flex items-start justify-between gap-3 rounded-sm bg-background/70 px-2 py-1">
                      <span>{person.name || 'Researcher'}</span>
                      {detail ? <span className="text-muted-foreground">{detail}</span> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )) : (
            <p className="text-muted-foreground">No additional researcher changes were detected.</p>
          )}
          {submittedRecord && (
            <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
              {workflowCopy.submittedNotice}
            </div>
          )}
          {restoredDraft && (
            <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
              {workflowCopy.restoredDraftNotice}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} data-dialog-close>
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
