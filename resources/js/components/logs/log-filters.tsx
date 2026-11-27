import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ListFilter, SlidersHorizontal, Search } from 'lucide-react'

type LogType = 'user-audit' | 'faculty-audit' | 'research-entry' | 'research-access' | 'keyword-search'

type Option = { value: string | number; label: string }

type DatePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom'

type FilterState = {
  // Time-based filters (all log types)
  datePreset?: DatePreset
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
  actions?: Option[] // Overrides the default actions for user-audit, faculty-audit, research-entry
  users?: Option[] // For research-entry (modified by)
  researches?: Option[] // For research-access
  keywords?: Option[] // For keyword-search
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
  variant?: 'sidebar' | 'popover'
}

const PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

const PRESET_LABELS = Object.fromEntries(PRESETS.map((p) => [p.value, p.label])) as Record<DatePreset, string>

const DEFAULT_ACTIONS: Partial<Record<LogType, Option[]>> = {
  'user-audit': [
    { value: 'create_user', label: 'Created' },
    { value: 'update_user', label: 'Updated' },
    { value: 'deactivate_user', label: 'Deactivated' },
  ],
  'faculty-audit': [
    { value: 'create_faculty', label: 'Created' },
    { value: 'update_faculty', label: 'Updated' },
    { value: 'delete_faculty', label: 'Deleted' },
  ],
  'research-entry': [
    { value: 'create_research_entry', label: 'Created' },
    { value: 'update_research_entry', label: 'Updated' },
    { value: 'archive_research_entry', label: 'Archived' },
  ],
}

const SEARCH_META: Partial<Record<LogType, { field: 'researchSearch' | 'keywordSearch'; label: string; placeholder: string }>> = {
  'research-access': { field: 'researchSearch', label: 'Research', placeholder: 'Search by keyword or title…' },
  'keyword-search': { field: 'keywordSearch', label: 'Keyword', placeholder: 'Search by keyword name…' },
}

type Chip = { id: string; label: string; valueLabel?: string; fields: Array<keyof FilterState> }

function removeFields(value: FilterState, fields: Array<keyof FilterState>): FilterState {
  const next = { ...value }
  fields.forEach((f) => {
    delete next[f]
  })
  return next
}

// Stable key used to detect "edited but not applied yet".
function keyOf(value: FilterState) {
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(entries)
}

// Which tab the filters were last shown for. Survives remounts, so we can tell "same tab" from "switched tab".
let lastLogType: LogType | undefined

// Remember the last applied filters per log type so they survive remounts, tab switches and reloads.
const storageKey = (logType: LogType) => `log-filters:${logType}`

function readStored(logType: LogType): FilterState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(logType))
    return raw ? (JSON.parse(raw) as FilterState) : null
  } catch {
    return null
  }
}

function writeStored(logType: LogType, value: FilterState) {
  try {
    if (keyOf(value) === '[]') sessionStorage.removeItem(storageKey(logType))
    else sessionStorage.setItem(storageKey(logType), JSON.stringify(value))
  } catch {
    /* storage unavailable: ignore */
  }
}

function buildChips(logType: LogType, value: FilterState, actions: Option[], options?: FilterOptions): Chip[] {
  const chips: Chip[] = []

  if (value.datePreset === 'custom') {
    if (value.from || value.to) {
      chips.push({
        id: 'date',
        label: 'Date',
        valueLabel: `${value.from || '…'} → ${value.to || '…'}`,
        fields: ['datePreset', 'from', 'to'],
      })
    }
  } else if (value.datePreset) {
    chips.push({ id: 'date', label: 'Date', valueLabel: PRESET_LABELS[value.datePreset], fields: ['datePreset', 'from', 'to'] })
  }

  if (value.actionType) {
    chips.push({
      id: 'action',
      label: 'Action',
      valueLabel: actions.find((a) => a.value === value.actionType)?.label ?? value.actionType,
      fields: ['actionType'],
    })
  }

  if (value.modifiedByUserId) {
    chips.push({
      id: 'user',
      label: 'Modified by',
      valueLabel: options?.users?.find((u) => u.value === value.modifiedByUserId)?.label ?? String(value.modifiedByUserId),
      fields: ['modifiedByUserId'],
    })
  }

  const search = SEARCH_META[logType]
  if (search && value[search.field]) {
    chips.push({ id: search.field, label: search.label, valueLabel: value[search.field], fields: [search.field] })
  }

  return chips
}

/** A labelled filter group. Always visible: no checkbox gating, no hidden fields. */
function Section({ title, onClear, children }: { title: string; onClear?: () => void; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Label>
        {onClear && (
          <button type="button" onClick={onClear} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Clear
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

export default function LogFilters({
  logType,
  value: propValue,
  onChange: onChangeProp,
  onApply,
  options,
  className,
  autoApply = false,
  debounceMs = 300,
  variant = 'sidebar',
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // The component owns its selections, so a parent re-render or reset can't wipe them.
  const [draft, setDraft] = useState<FilterState>(() => (lastLogType === logType ? readStored(logType) ?? propValue : propValue))
  const value = draft
  const onChange = (next: FilterState) => {
    setDraft(next)
    onChangeProp(next)
  }
  const handledType = useRef<LogType | null>(null)

  // Hardcoded on purpose: these values match what the backend expects (same as the original component).
  const actions = useMemo(() => DEFAULT_ACTIONS[logType] ?? [], [logType])
  const chips = useMemo(() => buildChips(logType, value, actions, options), [logType, value, actions, options])
  const search = SEARCH_META[logType]
  const showUsers = logType === 'research-entry' && !!options?.users?.length

  // Track what was last applied so we can show "unapplied changes" and enable Apply only when needed.
  const [appliedKey, setAppliedKey] = useState(() => keyOf(value))
  const dirty = keyOf(value) !== appliedKey

  // On mount / tab change: if nothing is set, restore what was last applied for this log type.
  useEffect(() => {
    if (handledType.current === logType) return
    handledType.current = logType

    const prev = lastLogType
    lastLogType = logType

    let initial: FilterState
    if (prev === logType) {
      // Same tab, component remounted (e.g. after Apply): keep what the user picked.
      initial = readStored(logType) ?? propValue
    } else {
      // Switched tab (or fresh page load): start clean.
      writeStored(logType, {})
      initial = prev === undefined ? propValue : {}
      if (prev !== undefined && keyOf(propValue) !== '[]') {
        onChangeProp({})
        onApply?.({})
      }
    }

    setDraft(initial)
    setAppliedKey(keyOf(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logType])

  const rangeInvalid = value.datePreset === 'custom' && !!value.from && !!value.to && value.from > value.to
  const canApply = !!onApply && dirty && !rangeInvalid

  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

  const apply = () => {
    if (!canApply) return
    onApply?.(value)
    writeStored(logType, value)
    setAppliedKey(keyOf(value))
    setOpen(false)
  }

  const resetAll = () => onChange({})

  const pickPreset = (preset: DatePreset) => {
    // Presets own the range; only "custom" keeps manual dates.
    onChange(preset === 'custom' ? { ...value, datePreset: preset } : { ...removeFields(value, ['from', 'to']), datePreset: preset })
  }

  useEffect(() => {
    if (!autoApply || !onApply || rangeInvalid) return
    const t = setTimeout(() => {
      onApply(value)
      writeStored(logType, value)
      setAppliedKey(keyOf(value))
    }, debounceMs)
    return () => clearTimeout(t)
  }, [autoApply, debounceMs, value, onApply, rangeInvalid, logType])

  const body = (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
      <Section title="Date" onClear={value.datePreset ? () => onChange(removeFields(value, ['datePreset', 'from', 'to'])) : undefined}>
        <Select value={value.datePreset ?? ''} onValueChange={(v) => pickPreset(v as DatePreset)}>
          <SelectTrigger className="h-9" aria-label="Date range">
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {value.datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <Label htmlFor="log-filter-from" className="text-xs">From</Label>
              <Input
                id="log-filter-from"
                type="date"
                max={value.to || undefined}
                value={value.from || ''}
                onChange={(e) => set({ from: e.target.value || undefined })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="log-filter-to" className="text-xs">To</Label>
              <Input
                id="log-filter-to"
                type="date"
                min={value.from || undefined}
                value={value.to || ''}
                onChange={(e) => set({ to: e.target.value || undefined })}
                className="h-9"
              />
            </div>
            {rangeInvalid && (
              <p role="alert" className="col-span-2 text-xs text-destructive">
                “From” must be on or before “To”.
              </p>
            )}
          </div>
        )}
      </Section>

      {actions.length > 0 && (
        <Section title="Action" onClear={value.actionType ? () => set({ actionType: undefined }) : undefined}>
          <Select value={value.actionType ?? ''} onValueChange={(v) => set({ actionType: v || undefined })}>
            <SelectTrigger className="h-9" aria-label="Action">
              <SelectValue placeholder="Any action" />
            </SelectTrigger>
            <SelectContent>
              {actions.map((a) => (
                <SelectItem key={a.value} value={String(a.value)}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      )}

      {showUsers && (
        <Section title="Modified by" onClear={value.modifiedByUserId ? () => set({ modifiedByUserId: undefined }) : undefined}>
          <Select value={value.modifiedByUserId?.toString() ?? ''} onValueChange={(v) => set({ modifiedByUserId: v ? Number(v) : undefined })}>
            <SelectTrigger className="h-9" aria-label="Modified by">
              <SelectValue placeholder="Any user" />
            </SelectTrigger>
            <SelectContent>
              {options!.users!.map((u) => (
                <SelectItem key={u.value} value={u.value.toString()}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      )}

      {search && (
        <Section title={search.label} onClear={value[search.field] ? () => set({ [search.field]: undefined }) : undefined}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label={`Search ${search.label.toLowerCase()}`}
              placeholder={search.placeholder}
              value={value[search.field] || ''}
              onChange={(e) => set({ [search.field]: e.target.value || undefined })}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className="h-9 pl-8"
            />
          </div>
        </Section>
      )}
    </div>
  )

  // Sticky footer: always reachable, even in a long mobile sheet.
  const footer = (
    <div className="flex items-center gap-2 border-t bg-background p-3">
      <Button type="button" variant="ghost" size="sm" onClick={resetAll} disabled={chips.length === 0}>
        Reset
      </Button>
      <Button type="button" size="sm" className="flex-1" onClick={apply} disabled={!canApply}>
        {dirty ? 'Apply filters' : 'Filters applied'}
        {dirty && chips.length > 0 && <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">{chips.length}</span>}
      </Button>
    </div>
  )

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      {body}
      {footer}
    </div>
  )

  const countBadge =
    chips.length > 0 ? (
      <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {chips.length}
      </span>
    ) : null

  if (variant === 'popover') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label="Open filters" className={cn('relative shadow-none', className)}>
            <ListFilter className="size-4" />
            {countBadge}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={16}
          className="flex w-[360px] max-h-[min(75vh,var(--radix-popover-content-available-height))] flex-col overflow-hidden p-0"
        >
          <div className="border-b px-4 py-3 text-sm font-medium">Filters</div>
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  if (isMobile) {
    return (
      <div className={cn('relative', className)}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg" aria-label="Open filters">
              <SlidersHorizontal className="mr-2 size-5" /> Filters
              {countBadge}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <aside className={cn('flex w-full max-w-[320px] flex-col rounded-[20px] bg-background shadow-sm', className)} aria-label="Filter sidebar">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="font-medium">Filters</div>
        {dirty && <span className="text-xs text-amber-600">Unapplied changes</span>}
      </div>
      {content}
    </aside>
  )
}

export type { Props as LogFiltersProps, FilterState as LogFilterState, FilterOptions as LogFilterOptions, LogType }