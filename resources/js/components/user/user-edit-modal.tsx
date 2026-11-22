import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import DeleteUserModal from '@/components/user/delete-user-modal'
import { type User } from '@/types'
import { router } from '@inertiajs/react'
import { ChevronDown, ChevronRight, History, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import UserForm, { type RoleOption, type UserInitial } from './user-form'

type AuditEvent = {
  id: number
  action_type: string
  created_at: string
  modified_by?: { id: number; first_name: string; last_name: string }
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  metadata?: Record<string, any>
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserInitial
  roles: RoleOption[]
  adminCount?: number
}

const HIDDEN_FIELDS = ['updated_at', 'created_at', 'password', 'remember_token']

/* ------------------------------ helpers ------------------------------ */

const toLabel = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const fmtFull = (value: string) => {
  const d = new Date(value)
  return `${fmtDate(d)} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

// Short format: 52m ago, 1h ago, 3d ago
const timeAgo = (value: string) => {
  const date = new Date(value)
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return fmtDate(date)
}

const ACTION_TITLES: Record<string, string> = {
  created: 'Account created',
  updated: 'Profile updated',
  deleted: 'Account deleted',
  restored: 'Account restored',
  role_changed: 'Roles changed',
  roles_changed: 'Roles changed',
}

const getTitle = (event: AuditEvent) => ACTION_TITLES[event.action_type] ?? toLabel(event.action_type)

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'None'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const getChanges = (event: AuditEvent) => {
  const next = event.new_values ?? {}
  const prev = event.old_values ?? {}
  const keys = Array.from(new Set([...Object.keys(next), ...Object.keys(prev)])).filter((k) => !HIDDEN_FIELDS.includes(k))
  return keys.map((key) => ({ field: toLabel(key), from: formatValue(prev[key]), to: formatValue(next[key]) }))
}

/* ------------------------------ component ----------------------------- */

export default function UserEditModal({ open, onOpenChange, user, roles, adminCount = 1 }: Props) {
  const [showDelete, setShowDelete] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const close = () => onOpenChange(false)

  // Reload the current list (keeps search, filters, sort and page)
  const refresh = () => {
    close()
    router.reload()
  }

  // Hide the activity card whenever the popup closes or a different user is opened
  useEffect(() => {
    if (!open) setShowActivity(false)
    setExpanded(new Set())
  }, [open, user.id])

  // Load activity history only when the activity card is opened
  useEffect(() => {
    if (!open || !showActivity || !user.id) return

    const controller = new AbortController()
    setLoadingLogs(true)

    fetch(`/users/${user.id}/audit-logs`, {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setAuditLogs(Array.isArray(json?.auditLogs) ? json.auditLogs : [])
      })
      .catch(() => {
        /* ignore: the timeline just won't show */
      })
      .finally(() => setLoadingLogs(false))

    return () => controller.abort()
  }, [open, showActivity, user.id])

  // Newest first
  const entries = useMemo(
    () => [...auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [auditLogs],
  )

  const toggleEntry = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
  const isAdminUser = user.roles?.some((r) => r.name === 'Administrator') ?? false

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Transparent shell: the two cards below are what you see floating */}
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="w-auto max-w-[calc(100vw-2rem)] gap-0 border-0 bg-transparent p-0 shadow-none sm:!max-w-none [&>button]:hidden"
        >
          <div className="flex max-h-[90dvh] flex-col items-stretch gap-4 overflow-y-auto lg:h-[min(90dvh,780px)] lg:flex-row lg:overflow-visible">
            {/* LEFT CARD: System Activity */}
            {showActivity && (
              <aside className="flex h-[28rem] w-full shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl lg:h-full lg:w-[460px]">
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between px-6 pt-5 pb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">System Activity</h3>
                    {!loadingLogs && entries.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Newest to oldest · {entries.length} action{entries.length === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-mt-1 -mr-2 h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setShowActivity(false)}
                    title="Close"
                    aria-label="Hide system activity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Fixed place with its own scrollbar */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6 [scrollbar-gutter:stable] [scrollbar-width:thin]">
                  {loadingLogs ? (
                    <p className="text-sm text-slate-500">Loading activity history…</p>
                  ) : entries.length === 0 ? (
                    <p className="text-sm text-slate-500">No activity recorded yet.</p>
                  ) : (
                    <ol className="relative">
                      {/* vertical timeline line */}
                      <span className="absolute top-3 bottom-3 left-[7px] w-px bg-slate-200" aria-hidden />

                      {entries.map((event) => {
                        const changes = getChanges(event)
                        const isOpen = expanded.has(event.id)
                        const canExpand = changes.length > 0
                        const by = event.modified_by ? `${event.modified_by.first_name} ${event.modified_by.last_name}` : 'System'
                        const title = getTitle(event)

                        return (
                          <li key={event.id} className="relative py-2">
                            {/* Dot on the line */}
                            <span className="absolute top-[20px] left-0 z-10 flex h-4 w-4 items-center justify-center bg-white">
                              <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                            </span>

                            <div className="ml-8">
                              {/* Entry header (click to expand) */}
                              <button
                                type="button"
                                onClick={() => canExpand && toggleEntry(event.id)}
                                aria-expanded={isOpen}
                                className={[
                                  'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                                  canExpand ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default',
                                  isOpen ? 'bg-slate-50' : '',
                                ].join(' ')}
                              >
                                <span className="mt-0.5 w-4 shrink-0 text-slate-500">
                                  {canExpand ? isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> : null}
                                </span>
                                <span className="min-w-0 flex-1" title={fmtFull(event.created_at)}>
                                  <span className="block text-sm font-medium text-slate-900">
                                    {title}
                                    {canExpand && (
                                      <span className="ml-1.5 text-xs font-normal text-slate-500">
                                        ({changes.length} change{changes.length === 1 ? '' : 's'})
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    by {by} <span className="mx-1">·</span> {timeAgo(event.created_at)}
                                  </span>
                                  {canExpand && !isOpen && (
                                    <span className="mt-1.5 block text-xs text-slate-400 italic">Click to expand all changes...</span>
                                  )}
                                </span>
                              </button>

                              {/* Expanded changes */}
                              {isOpen && (
                                <div className="mt-2 ml-4 space-y-2 border-l border-slate-200 pl-4">
                                  {changes.map((change) => (
                                    <div key={change.field} className="rounded-md bg-slate-100 px-3 py-2">
                                      <p className="text-xs text-slate-800">
                                        {title} <span className="ml-1 text-slate-400">{timeAgo(event.created_at)}</span>
                                      </p>
                                      <p className="mt-1 ml-0.5 border-l-2 border-slate-300 pl-2 text-xs break-words text-slate-600">
                                        <span className="font-semibold text-slate-800">{change.field}:</span> {change.from}{' '}
                                        <span className="text-slate-400">→</span> {change.to}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              </aside>
            )}

            {/* RIGHT CARD: the form */}
            <section className="flex h-[min(90dvh,780px)] w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl lg:h-full lg:w-[700px]">
              {/* Header: title on the left, two icon buttons neatly aligned on the right */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-white px-6 py-4">
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="truncate text-lg">Edit User</DialogTitle>
                  <DialogDescription className="truncate">{fullName}</DialogDescription>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {/* System activity: borderless icon */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={[
                      'h-9 w-9 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      showActivity ? 'bg-slate-100 text-slate-900' : '',
                    ].join(' ')}
                    onClick={() => setShowActivity((v) => !v)}
                    aria-pressed={showActivity}
                    aria-label={showActivity ? 'Hide system activity' : 'Show system activity'}
                    title={showActivity ? 'Hide system activity' : 'System activity'}
                  >
                    <History className="h-[18px] w-[18px]" />
                  </Button>

                  {/* Delete: icon only */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-600 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setShowDelete(true)}
                    aria-label="Delete user"
                    title="Delete user"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              </div>

              {/* Scrollable form; its Save bar is forced solid and sticks to the bottom */}
              <div
                className={[
                  'min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 pt-5 pb-0',
                  '[&_.sticky]:-mx-6 [&_.sticky]:!bg-white [&_.sticky]:px-6 [&_.sticky]:backdrop-blur-none',
                  '[&_.sticky]:shadow-[0_-6px_16px_rgba(0,0,0,0.08)]',
                ].join(' ')}
              >
                <UserForm
                  key={user.id}
                  mode="edit"
                  initial={user}
                  roles={roles}
                  adminCount={adminCount}
                  onCancelAction={close}
                  onSuccessAction={refresh}
                />
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteUserModal
        open={showDelete}
        onOpenChange={setShowDelete}
        user={user as User}
        isLastAdministrator={adminCount === 1 && isAdminUser}
        adminRemainingCount={adminCount}
        onDeleted={() => {
          setShowDelete(false)
          refresh()
        }}
      />
    </>
  )
}