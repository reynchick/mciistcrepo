import { useMemo, useState } from 'react'
import { ChevronDown, CheckCircle2, Shield, Clock, Lock, Pencil, Power, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuditSnapshot = {
  id?: number
  name?: string
  email?: string
  roles?: string[]
}

type AuditEvent = {
  id: number
  action_type: string
  created_at: string
  modified_by?: { id: number; first_name: string; last_name: string }
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  metadata?: Record<string, any> & {
    actor_snapshot?: AuditSnapshot
    target_snapshot?: AuditSnapshot
  }
}

type GroupedEvent = {
  id: string
  timestamp: string
  events: AuditEvent[]
  isGrouped: boolean
}

interface ActivityTimelineProps {
  events: AuditEvent[]
  userId: number
  fullHistoryHref?: string
}

/**
 * Group related events by timestamp (within 5 seconds) and action context
 * This creates logical "actions" where a user edit might affect multiple tables
 */
function groupRelatedEvents(events: AuditEvent[]): GroupedEvent[] {
  const sorted = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const groups: GroupedEvent[] = []
  const groupTimeThresholdMs = 5000 // 5 seconds
  let currentGroup: AuditEvent[] | null = null
  let lastTimestamp = 0

  for (const event of sorted) {
    const eventTime = new Date(event.created_at).getTime()
    const timeDiff = Math.abs(eventTime - lastTimestamp)

    // Check if event should be grouped with previous
    const shouldGroup = currentGroup && 
      timeDiff < groupTimeThresholdMs &&
      currentGroup[0].action_type === event.action_type

    if (shouldGroup && currentGroup) {
      currentGroup.push(event)
    } else {
      // Save previous group if exists
      if (currentGroup && currentGroup.length > 0) {
        const timestamp = currentGroup[currentGroup.length - 1].created_at
        groups.push({
          id: `group-${timestamp}-${currentGroup[0].id}`,
          timestamp,
          events: currentGroup,
          isGrouped: currentGroup.length > 1
        })
      }
      // Start new group
      currentGroup = [event]
      lastTimestamp = eventTime
    }
  }

  // Don't forget last group
  if (currentGroup && currentGroup.length > 0) {
    const timestamp = currentGroup[currentGroup.length - 1].created_at
    groups.push({
      id: `group-${timestamp}-${currentGroup[0].id}`,
      timestamp,
      events: currentGroup,
      isGrouped: currentGroup.length > 1
    })
  }

  return groups
}

const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  middle_name: 'Middle Name',
  last_name: 'Last Name',
  email: 'Email',
  contact_number: 'Contact Number',
  student_id: 'Student ID',
  faculty_id: 'Faculty ID',
  roles: 'Roles',
  status: 'Status',
}

function humanizeFieldName(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
}

function formatAbsolute(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short'
  })
}

function formatEventTitle(event: AuditEvent): string {
  const type = event.action_type
  if (type === 'create_user') return 'Account created'
  if (type === 'update_user') {
    const added = event.metadata?.added_roles ?? event.metadata?.roles_added
    const removed = event.metadata?.removed_roles ?? event.metadata?.roles_removed
    if (Array.isArray(added) && added.length > 0) return 'Roles changed'
    if (Array.isArray(removed) && removed.length > 0) return 'Roles changed'
    return 'Profile updated'
  }
  if (type === 'deactivate_user') return 'Status changed'
  return type.replace(/_/g, ' ')
}

function formatEventDescription(event: AuditEvent): string {
  const type = event.action_type
  if (type === 'create_user') return 'Account created'

  if (type === 'deactivate_user') {
    const prev = event.old_values?.status
    const next = event.new_values?.status
    if (prev !== undefined && next !== undefined) {
      return `Status: ${String(prev)} → ${String(next)}`
    }
    return 'Status changed'
  }

  if (type === 'update_user') {
    const added = event.metadata?.added_roles ?? event.metadata?.roles_added
    const removed = event.metadata?.removed_roles ?? event.metadata?.roles_removed
    if (Array.isArray(added) && added.length > 0) {
      return `Added: ${added.join(', ')}`
    }
    if (Array.isArray(removed) && removed.length > 0) {
      return `Removed: ${removed.join(', ')}`
    }

    // Field diffs
    const newVals = event.new_values ?? {}
    const keys = Object.keys(newVals).filter(k => !['updated_at', 'created_at'].includes(k))
    if (keys.length === 0) return 'Profile updated'
    const show = keys.slice(0, 3)
    const parts = show.map(k => {
      const label = humanizeFieldName(k)
      const oldVal = event.old_values?.[k]
      const newVal = newVals?.[k]
      if (oldVal !== undefined) return `${label}: ${String(oldVal)} → ${String(newVal)}`
      return `Updated: ${label}`
    })
    return parts.join('; ')
  }

  return type.replace(/_/g, ' ')
}

function formatValueForDisplay(val: any): string {
  if (Array.isArray(val)) return val.join(', ')
  if (val && typeof val === 'object') return Object.values(val).join(', ')
  return String(val)
}

function getActorDisplay(event: AuditEvent): { label: string; isDeleted: boolean } {
  if (event.modified_by) {
    const { first_name, last_name } = event.modified_by
    return { label: `${first_name} ${last_name}`.trim(), isDeleted: false }
  }

  const snapshot = event.metadata?.actor_snapshot as AuditSnapshot | undefined
  if (snapshot?.name) {
    return { label: snapshot.name, isDeleted: true }
  }

  return { label: 'System', isDeleted: false }
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getEventIcon(event: AuditEvent) {
  const type = event.action_type
  if (type === 'create_user') return <CheckCircle2 className="h-4 w-4 text-blue-500" />
  if (type === 'update_user') {
    const added = event.metadata?.added_roles ?? event.metadata?.roles_added
    const removed = event.metadata?.removed_roles ?? event.metadata?.roles_removed
    if ((Array.isArray(added) && added.length > 0) || (Array.isArray(removed) && removed.length > 0)) {
      return <Shield className="h-4 w-4 text-amber-500" />
    }
    return <Pencil className="h-4 w-4 text-indigo-500" />
  }
  if (type === 'deactivate_user') return <Power className="h-4 w-4 text-teal-500" />
  return <Clock className="h-4 w-4 text-gray-400" />
}

function renderEventDetails(event: AuditEvent) {
  return (
    <>
      {/* Roles metadata first */}
      {Array.isArray(event.metadata?.roles_added) && event.metadata!.roles_added!.length > 0 && (
        <div className="text-muted-foreground break-words">
          <span className="font-medium text-foreground">Added:</span> {event.metadata!.roles_added!.join(', ')}
        </div>
      )}
      {Array.isArray(event.metadata?.roles_removed) && event.metadata!.roles_removed!.length > 0 && (
        <div className="text-muted-foreground break-words">
          <span className="font-medium text-foreground">Removed:</span> {event.metadata!.roles_removed!.join(', ')}
        </div>
      )}
      {Array.isArray(event.metadata?.added_roles) && event.metadata!.added_roles!.length > 0 && (
        <div className="text-muted-foreground break-words">
          <span className="font-medium text-foreground">Added:</span> {event.metadata!.added_roles!.join(', ')}
        </div>
      )}
      {Array.isArray(event.metadata?.removed_roles) && event.metadata!.removed_roles!.length > 0 && (
        <div className="text-muted-foreground break-words">
          <span className="font-medium text-foreground">Removed:</span> {event.metadata!.removed_roles!.join(', ')}
        </div>
      )}

      {/* Field diffs */}
      {event.new_values && Object.keys(event.new_values).length > 0 && (
        Object.keys(event.new_values)
          .filter(k => !['updated_at', 'created_at'].includes(k))
          .slice(0, 3)
          .map((key) => {
            const label = humanizeFieldName(key)
            const oldVal = event.old_values?.[key]
            const newVal = event.new_values?.[key]
            const displayOld = oldVal !== undefined ? formatValueForDisplay(oldVal) : undefined
            const displayNew = newVal !== undefined ? formatValueForDisplay(newVal) : undefined
            return (
              <div key={key} className="text-muted-foreground break-words overflow-hidden">
                <span className="font-medium text-foreground">{label}:</span>{' '}
                <span className="break-all">{displayOld !== undefined ? `${displayOld} → ${displayNew}` : 'Updated'}</span>
              </div>
            )
          })
      )}
    </>
  )
}

export default function ActivityTimeline({ events, userId, fullHistoryHref }: ActivityTimelineProps) {
  const grouped = useMemo(() => {
    return groupRelatedEvents(events)
  }, [events])

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups)
    if (next.has(groupId)) {
      next.delete(groupId)
    } else {
      next.add(groupId)
    }
    setExpandedGroups(next)
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const defaultCount = 5
  const expandedCount = 15
  const displayGroups = isExpanded ? grouped.slice(0, expandedCount) : grouped.slice(0, defaultCount)
  const hasMore = grouped.length > displayGroups.length

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            System Activity
          </CardTitle>
          <CardDescription>No activity recorded yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          System Activity — read-only
        </CardTitle>
        <CardDescription>Newest to oldest · {grouped.length} action(s)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative space-y-4">
          {/* Vertical timeline line */}
          {displayGroups.length > 1 && (
            <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-border" />
          )}

          {displayGroups.map((group) => (
            <div key={group.id}>
              {/* Main group entry */}
              <div className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 mt-1">
                  <div className="h-4 w-4 rounded-full border-2 border-background bg-white flex items-center justify-center">
                    {getEventIcon(group.events[0])}
                  </div>
                </div>

                {/* Event content */}
                <div className="flex-1 pb-4">
                  <div 
                    className={`flex flex-col gap-1 ${group.isGrouped ? 'cursor-pointer hover:bg-muted p-2 rounded' : ''}`}
                    onClick={() => group.isGrouped && toggleGroup(group.id)}
                  >
                    <div className="flex items-center gap-2">
                      {group.isGrouped && (
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${expandedGroups.has(group.id) ? 'rotate-90' : ''}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium leading-tight">
                          {formatEventTitle(group.events[0])}
                          {group.isGrouped && <span className="text-xs text-muted-foreground ml-1 md:ml-2">({group.events.length} changes)</span>}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6 flex items-center gap-2 flex-wrap">
                      {(() => {
                        const actor = getActorDisplay(group.events[0])
                        return (
                          <>
                            <span className="break-words">by {actor.label}</span>
                            {actor.isDeleted && (
                              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-medium border border-amber-200">Deleted user</span>
                            )}
                          </>
                        )
                      })()}
                      <span className="text-muted-foreground">•</span>
                      <span title={formatAbsolute(group.events[0].created_at)}>{formatTimestamp(group.events[0].created_at)}</span>
                    </p>

                    {/* Summary for grouped events */}
                    {group.isGrouped && !expandedGroups.has(group.id) && (
                      <div className="mt-1 ml-6 text-xs text-muted-foreground">
                        <span className="italic">Click to expand all changes...</span>
                      </div>
                    )}

                    {/* Show changed fields on hover/expanded - single event */}
                    {!group.isGrouped && (
                      <div className="mt-2 ml-6 p-2 bg-muted rounded text-xs space-y-1 min-w-0 overflow-hidden">
                        {renderEventDetails(group.events[0])}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded grouped events */}
              {group.isGrouped && expandedGroups.has(group.id) && (
                <div className="ml-12 space-y-3 mb-4 border-l-2 border-border pl-4">
                  {group.events.map((event, idx) => (
                    <div key={event.id} className="bg-muted/50 rounded p-2 min-w-0">
                      <p className="text-xs font-medium mb-1 break-words">
                        {formatEventTitle(event)}
                        <span className="text-muted-foreground font-normal ml-2">
                          {formatTimestamp(event.created_at)}
                        </span>
                      </p>
                      <div className="text-xs space-y-1 pl-2 border-l border-border">
                        {renderEventDetails(event)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {(hasMore || isExpanded) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs"
          >
            {isExpanded ? 'Show less' : `Show more (${Math.min(grouped.length - defaultCount, expandedCount - defaultCount)})`}
            <ChevronDown className={`ml-2 h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
