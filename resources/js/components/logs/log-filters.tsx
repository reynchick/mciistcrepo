import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Filter, SlidersHorizontal, X, CalendarRange } from 'lucide-react'

type LogType = 'user-audit' | 'faculty-audit' | 'research-entry' | 'research-access' | 'keyword-search'

type Option = { value: string | number; label: string }

type FilterState = {
  // Time-based filters (all log types)
  datePreset?: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom'
  from?: string
  to?: string
  
  // Action-based filter (user-audit, faculty-audit, research-entry) - single selection
  actionType?: string
  
  // User filters (research-entry)
  modifiedByUserId?: number
  
  // Research filters (research-access)
  researchSearch?: string
  
  // Keyword filters (keyword-search)
  keywordSearch?: string
}

type FilterOptions = {
  actions?: Option[]  // For user-audit, faculty-audit, research-entry
  users?: Option[]     // For research-entry (modified by)
  researches?: Option[] // For research-access
  keywords?: Option[]   // For keyword-search
}

type Props = {
  logType: LogType
  value: FilterState
  onChange: (next: FilterState) => void
  onApply?: (next: FilterState) => void
  options?: FilterOptions
  className?: string
  autoApply?: boolean
  debounceMs?: number
}

function setField<T extends keyof FilterState>(value: FilterState, field: T, v: FilterState[T]) {
  return { ...value, [field]: v }
}

function removeField(value: FilterState, field: keyof FilterState) {
  const next = { ...value }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(next as any)[field] = undefined
  return next
}

function activeChips(logType: LogType, value: FilterState, options?: FilterOptions) {
  const chips: Array<{ key: keyof FilterState; label: string; valueLabel?: string }> = []
  const optLabel = (opts?: Option[], id?: string | number) => opts?.find((o) => o.value === id)?.label
  
  // Time-based filters (all log types)
  if (value.datePreset && value.datePreset !== 'custom') {
    chips.push({ key: 'datePreset', label: 'Date', valueLabel: value.datePreset })
  }
  if (value.from) chips.push({ key: 'from', label: 'From', valueLabel: value.from })
  if (value.to) chips.push({ key: 'to', label: 'To', valueLabel: value.to })
  
  // Action filter (user-audit, faculty-audit, research-entry) - single selection
  if (value.actionType) {
    const actionLabel = options?.actions?.find(a => a.value === value.actionType)?.label || value.actionType
    chips.push({ key: 'actionType', label: 'Action', valueLabel: actionLabel })
  }
  
  // Modified by filter (research-entry)
  if (value.modifiedByUserId) {
    chips.push({ key: 'modifiedByUserId', label: 'Modified By', valueLabel: optLabel(options?.users, value.modifiedByUserId) })
  }
  
  // Research filter (research-access)
  if (value.researchSearch) {
    chips.push({ key: 'researchSearch', label: 'Research', valueLabel: value.researchSearch })
  }
  
  // Keyword filter (keyword-search)
  if (value.keywordSearch) {
    chips.push({ key: 'keywordSearch', label: 'Keyword', valueLabel: value.keywordSearch })
  }
  
  return chips
}

export default function LogFilters({ logType, value, onChange, onApply, options, className, autoApply = false, debounceMs = 300 }: Props) {
  const isMobile = useIsMobile()
  const chips = useMemo(() => activeChips(logType, value, options), [logType, value, options])
  const [open, setOpen] = useState(false)

  const set = (field: keyof FilterState, v: unknown) => onChange(setField(value, field as any, v as any))
  const clearAll = () => {
    onChange({})
  }

  useEffect(() => {
    if (!autoApply || !onApply) return
    const id = setTimeout(() => onApply(value), debounceMs)
    return () => clearTimeout(id)
  }, [autoApply, debounceMs, value, onApply])

  const actionOptions = useMemo(() => {
    switch (logType) {
      case 'user-audit':
        return [
          { value: 'create_user', label: 'Created' },
          { value: 'update_user', label: 'Updated' },
          { value: 'deactivate_user', label: 'Deactivated' },
        ]
      case 'faculty-audit':
        return [
          { value: 'create_faculty', label: 'Created' },
          { value: 'update_faculty', label: 'Updated' },
          { value: 'delete_faculty', label: 'Deleted' },
        ]
      case 'research-entry':
        return [
          { value: 'create_research_entry', label: 'Created' },
          { value: 'update_research_entry', label: 'Updated' },
          { value: 'archive_research_entry', label: 'Archive' },
        ]
      default:
        return []
    }
  }, [logType])

  const renderFilters = () => (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{chips.length} filter{chips.length !== 1 ? 's' : ''} applied</div>
        {chips.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <Badge key={`${String(c.key)}-${i}`} variant="secondary" className="flex items-center gap-2">
              <span>{c.label}{c.valueLabel ? `: ${c.valueLabel}` : ''}</span>
              <button className="rounded px-1 hover:bg-muted" aria-label={`Remove ${c.label}`} onClick={() => onChange(removeField(value, c.key))}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Time-based Filters - All log types */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-accent">
          <span className="flex items-center gap-2">
            <CalendarRange className="size-4" />
            <span className="text-sm font-medium">Time Filters</span>
          </span>
          <SlidersHorizontal className="size-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3 px-2">
          <div className="space-y-2">
            <Label className="text-xs">Date Preset</Label>
            <Select value={value.datePreset || ''} onValueChange={(v) => set('datePreset', v || undefined)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.datePreset === 'custom' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={value.from || ''} onChange={(e) => set('from', e.target.value || undefined)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={value.to || ''} onChange={(e) => set('to', e.target.value || undefined)} className="h-9 mt-1" />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Action-based Filters - user-audit, faculty-audit, research-entry */}
      {(logType === 'user-audit' || logType === 'faculty-audit' || logType === 'research-entry') && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-accent">
            <span className="text-sm font-medium">Action Filters</span>
            <SlidersHorizontal className="size-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-2">
            <div className="space-y-2">
              <Label className="text-xs">Action Type</Label>
              <Select value={value.actionType || ''} onValueChange={(v) => set('actionType', v || undefined)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Modified By Filter - research-entry only */}
      {logType === 'research-entry' && options?.users && options.users.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-accent">
            <span className="text-sm font-medium">User Filters</span>
            <SlidersHorizontal className="size-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-2">
            <div className="space-y-2">
              <Label className="text-xs">Modified By</Label>
              <Select value={value.modifiedByUserId?.toString() || ''} onValueChange={(v) => set('modifiedByUserId', v ? Number(v) : undefined)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {options.users.map((user) => (
                    <SelectItem key={user.value} value={user.value.toString()}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Research Filter - research-access only */}
      {logType === 'research-access' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-accent">
            <span className="text-sm font-medium">Research Filters</span>
            <SlidersHorizontal className="size-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-2">
            <div className="space-y-2">
              <Label className="text-xs">Search Research</Label>
              <Input
                type="text"
                placeholder="Search by keyword or title..."
                value={value.researchSearch || ''}
                onChange={(e) => set('researchSearch', e.target.value || undefined)}
                className="h-9"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Keyword Filter - keyword-search only */}
      {logType === 'keyword-search' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-accent">
            <span className="text-sm font-medium">Keyword Filters</span>
            <SlidersHorizontal className="size-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-2">
            <div className="space-y-2">
              <Label className="text-xs">Search Keyword</Label>
              <Input
                type="text"
                placeholder="Search by keyword name..."
                value={value.keywordSearch || ''}
                onChange={(e) => set('keywordSearch', e.target.value || undefined)}
                className="h-9"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Apply Filters Button */}
      <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t">
        <Button onClick={() => onApply?.(value)} disabled={!onApply} size="sm" className="w-full">
          <Filter className="mr-2 size-4" />
          Apply Filters
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className={cn('relative', className)}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="fixed bottom-4 right-4 rounded-full shadow-lg" aria-label="Open filters">
              <SlidersHorizontal className="mr-2 size-5" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            {renderFilters()}
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <aside className={cn('w-full max-w-[320px] rounded-md border bg-background', className)} aria-label="Filter sidebar">
      <div className="flex items-center justify-between border-b p-3">
        <div className="font-medium">Filters</div>
        <div className="text-xs text-muted-foreground">{chips.length} applied</div>
      </div>
      {renderFilters()}
    </aside>
  )
}

export type { Props as LogFiltersProps, FilterState as LogFilterState, FilterOptions as LogFilterOptions, LogType }
