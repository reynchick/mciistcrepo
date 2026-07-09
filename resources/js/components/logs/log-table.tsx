import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Pagination, { type LaravelPaginationMeta } from '@/components/shared/pagination'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChevronDown, ChevronUp, Eye, Download as DownloadIcon, FileSearch } from 'lucide-react'

export type SortRule = { id: string; direction: 'asc' | 'desc' }

export type Column<T> = {
  id: string
  header: string | ReactNode
  cell?: (row: T) => ReactNode | string | number | null
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string | number
  hideOnMobile?: boolean
}

type Selection<T> = {
  selectedIds: Array<string | number>
  isSelected: (id: string | number) => boolean
  onToggle: (id: string | number, checked: boolean) => void
  onToggleAll?: (ids: Array<string | number>, checked: boolean) => void
}

type RowActions<T> = {
  onView?: (row: T) => void
  onExport?: (row: T) => void
  onRowClick?: (row: T) => void
  renderRelated?: (row: T) => ReactNode | null
}

type Expansion<T> = {
  renderExpanded: (row: T) => ReactNode
}

type PaginationProps = {
  meta: LaravelPaginationMeta
  onChange?: (page: number, perPage?: number) => void
  hrefBuilder?: (page: number, perPage?: number) => string
}

type Props<T> = {
  data: T[]
  columns: Array<Column<T>>
  getRowId: (row: T) => string | number
  sortRules?: SortRule[]
  onSortChange?: (rules: SortRule[]) => void
  storageKey?: string
  loading?: boolean
  emptyMessage?: string
  selection?: Selection<T>
  actions?: RowActions<T>
  expansion?: Expansion<T>
  pagination?: PaginationProps
  bulkActions?: ReactNode
  virtualize?: boolean
  virtualizeThreshold?: number
  virtualRowHeight?: number
  className?: string
}

export default function LogTable<T>({
  data,
  columns,
  getRowId,
  sortRules: sortRulesProp,
  onSortChange,
  storageKey = 'log-table-sort',
  loading = false,
  emptyMessage = 'No log entries found',
  selection,
  actions,
  expansion,
  pagination,
  bulkActions,
  virtualize = false,
  virtualizeThreshold = 500,
  virtualRowHeight = 48,
  className,
}: Props<T>) {
  const isMobile = useIsMobile()
  const [sortRules, setSortRules] = useState<SortRule[]>(() => {
    if (sortRulesProp && sortRulesProp.length) return sortRulesProp
    try {
      const raw = sessionStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as SortRule[]) : []
    } catch {
      return []
    }
  })
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>({})
  const allRowIds = useMemo(() => data.map(getRowId), [data, getRowId])

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(sortRules))
    } catch {}
  }, [sortRules, storageKey])

  useEffect(() => {
    if (sortRulesProp) setSortRules(sortRulesProp)
  }, [sortRulesProp])

  const toggleSort = (id: string, multi: boolean) => {
    setSortRules((prev) => {
      const existing = prev.find((r) => r.id === id)
      let next: SortRule[]
      if (!existing) {
        next = multi ? [...prev, { id, direction: 'asc' }] : [{ id, direction: 'asc' }]
      } else if (existing.direction === 'asc') {
        next = prev.map((r) => (r.id === id ? { ...r, direction: 'desc' } : r))
      } else {
        next = prev.filter((r) => r.id !== id)
      }
      onSortChange?.(next)
      return next
    })
  }

  const toggleExpand = (id: string | number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const anySelected = !!selection && selection.selectedIds.length > 0

  const headerCheckboxChecked = selection
    ? allRowIds.length > 0 && allRowIds.every((id) => selection.isSelected(id))
    : false

  const headerCheckboxIndeterminate = selection
    ? !headerCheckboxChecked && selection.selectedIds.length > 0
    : false

  const onToggleAll = (checked: boolean) => {
    selection?.onToggleAll?.(allRowIds, checked)
  }

  const renderSortIndicator = (id: string) => {
    const rule = sortRules.find((r) => r.id === id)
    if (!rule) return null
    return rule.direction === 'asc' ? (
      <ChevronUp className="ml-1 size-4" aria-hidden="true" />
    ) : (
      <ChevronDown className="ml-1 size-4" aria-hidden="true" />
    )
  }

  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-md border text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileSearch className="size-5" />
              <span>{emptyMessage}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((row) => {
              const id = getRowId(row)
              const isExpanded = !!expanded[id]
              return (
                <div 
                  key={String(id)} 
                  className={cn(
                    "rounded-md border p-3",
                    actions?.onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  )}
                  onClick={() => actions?.onRowClick?.(row)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selection ? (
                        <Checkbox
                          checked={selection.isSelected(id)}
                          onCheckedChange={(v) => selection.onToggle(id, !!v)}
                          aria-label="Select row"
                        />
                      ) : null}
                      <div className="font-medium">{columns[0]?.cell ? columns[0].cell(row) : String(columns[0]?.header ?? '')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {actions?.onView ? (
                        <Button variant="ghost" size="sm" aria-label="View details" onClick={() => actions.onView?.(row)}>
                          <Eye className="size-4" />
                        </Button>
                      ) : null}
                      {actions?.onExport ? (
                        <Button variant="ghost" size="sm" aria-label="Export entry" onClick={() => actions.onExport?.(row)}>
                          <DownloadIcon className="size-4" />
                        </Button>
                      ) : null}
                      {expansion ? (
                        <Button variant="ghost" size="sm" aria-label={isExpanded ? 'Collapse' : 'Expand'} onClick={() => toggleExpand(id)}>
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1">
                    {columns.slice(1).filter((c) => !c.hideOnMobile).map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-3">
                        <div className="text-xs text-muted-foreground">{typeof c.header === 'string' ? c.header : ''}</div>
                        <div className="text-sm">{c.cell ? c.cell(row) : ''}</div>
                      </div>
                    ))}
                  </div>
                  {expansion ? (
                    <div className={cn('grid transition-all', isExpanded ? 'mt-3 grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                         aria-hidden={!isExpanded}
                         aria-expanded={isExpanded}
                    >
                      <div className="overflow-hidden">{expansion.renderExpanded(row)}</div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
        {pagination ? (
          <Pagination meta={pagination.meta} onChange={pagination.onChange} hrefBuilder={pagination.hrefBuilder} className="mt-3" />
        ) : null}
      </div>
    )
  }

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [range, setRange] = useState<{ start: number; end: number } | undefined>()
  const shouldVirtualize = !expansion && virtualize && data.length > virtualizeThreshold

  useEffect(() => {
    if (!shouldVirtualize) return
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const h = el.clientHeight
      const top = el.scrollTop
      const count = Math.ceil(h / virtualRowHeight) + 6
      const start = Math.max(0, Math.floor(top / virtualRowHeight) - 3)
      const end = Math.min(data.length, start + count)
      setRange({ start, end })
    }
    onScroll()
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [shouldVirtualize, data.length, virtualRowHeight])

  return (
    <div className={cn('w-full', className)}>
      <div ref={containerRef} className={cn('rounded-md border relative w-full overflow-auto')}
           role="table"
           aria-label="Logs table"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {selection ? (
                <TableHead className="w-10">
                  <div className="flex items-center">
                    <Checkbox
                      checked={headerCheckboxChecked}
                      onCheckedChange={(v) => onToggleAll(!!v)}
                      aria-label="Select all rows"
                      data-state={headerCheckboxIndeterminate ? 'indeterminate' : headerCheckboxChecked ? 'checked' : 'unchecked'}
                    />
                  </div>
                </TableHead>
              ) : null}
              {columns.map((c) => (
                <TableHead
                  key={c.id}
                  style={{ width: c.width }}
                  className={cn(
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                  )}
                >
                  <button
                    className={cn('inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', c.sortable ? '' : 'cursor-default')}
                    onClick={() => (c.sortable ? toggleSort(c.id, false) : undefined)}
                    onMouseDown={(e) => {
                      if (!c.sortable) return
                      if (e.shiftKey) {
                        e.preventDefault()
                        toggleSort(c.id, true)
                      }
                    }}
                    aria-label={typeof c.header === 'string' ? `Sort by ${c.header}` : 'Sort column'}
                    aria-live="polite"
                  >
                    {typeof c.header === 'string' ? c.header : c.header}
                    {c.sortable ? renderSortIndicator(c.id) : null}
                  </button>
                </TableHead>
              ))}
              {(actions?.onView || actions?.onExport || expansion) ? <TableHead className="w-16 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  {selection ? <TableCell className="w-10"><Skeleton className="h-4 w-4" /></TableCell> : null}
                  {columns.map((c) => (
                    <TableCell key={`sc-${c.id}-${i}`} className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                      <Skeleton className="h-4 w-[60%]" />
                    </TableCell>
                  ))}
                  {(actions?.onView || actions?.onExport || expansion) ? <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell> : null}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(selection ? 1 : 0) + columns.length + ((actions?.onView || actions?.onExport || expansion) ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <FileSearch className="size-5" />
                    <span>{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : shouldVirtualize ? (
              (() => {
                const start = range?.start ?? 0
                const end = range?.end ?? Math.min(data.length, 30)
                const slice = data.slice(start, end)
                const topH = start * virtualRowHeight
                const bottomH = (data.length - end) * virtualRowHeight
                return (
                  <>
                    <TableRow><TableCell colSpan={(selection ? 1 : 0) + columns.length + ((actions?.onView || actions?.onExport || expansion) ? 1 : 0)} className="p-0"><div style={{ height: topH }} /></TableCell></TableRow>
                    {slice.map((row) => {
                      const id = getRowId(row)
                      const isExpanded = false
                      return (
                        <TableRow 
                          key={String(id)} 
                          data-state={selection?.isSelected(id) ? 'selected' : undefined}
                          className={cn(actions?.onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800")}
                          onClick={() => actions?.onRowClick?.(row)}
                        >
                          {selection ? (
                            <TableCell className="w-10">
                              <Checkbox
                                checked={selection.isSelected(id)}
                                onCheckedChange={(v) => selection.onToggle(id, !!v)}
                                aria-label="Select row"
                              />
                            </TableCell>
                          ) : null}
                          {columns.map((c) => (
                            <TableCell key={`${String(id)}-${c.id}`} className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                              {c.cell ? c.cell(row) : ''}
                            </TableCell>
                          ))}
                          {(actions?.onView || actions?.onExport) ? (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {actions?.onView ? (
                                  <Button variant="ghost" size="sm" aria-label="View details" onClick={() => actions.onView?.(row)}>
                                    <Eye className="size-4" />
                                  </Button>
                                ) : null}
                                {actions?.onExport ? (
                                  <Button variant="ghost" size="sm" aria-label="Export entry" onClick={() => actions.onExport?.(row)}>
                                    <DownloadIcon className="size-4" />
                                  </Button>
                                ) : null}
                                {actions?.renderRelated ? actions.renderRelated(row) : null}
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      )
                    })}
                    <TableRow><TableCell colSpan={(selection ? 1 : 0) + columns.length + ((actions?.onView || actions?.onExport || expansion) ? 1 : 0)} className="p-0"><div style={{ height: bottomH }} /></TableCell></TableRow>
                  </>
                )
              })()
            ) : (
              data.map((row) => {
                const id = getRowId(row)
                const isExpanded = !!expanded[id]
                return (
                  <>
                    <TableRow 
                      key={String(id)} 
                      data-state={selection?.isSelected(id) ? 'selected' : undefined}
                      className={cn(actions?.onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800")}
                      onClick={() => actions?.onRowClick?.(row)}
                    >
                      {selection ? (
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selection.isSelected(id)}
                            onCheckedChange={(v) => selection.onToggle(id, !!v)}
                            aria-label="Select row"
                          />
                        </TableCell>
                      ) : null}
                      {columns.map((c) => (
                        <TableCell key={`${String(id)}-${c.id}`} className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                          {c.cell ? c.cell(row) : ''}
                        </TableCell>
                      ))}
                      {(actions?.onView || actions?.onExport || expansion) ? (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {actions?.onView ? (
                              <Button variant="ghost" size="sm" aria-label="View details" onClick={() => actions.onView?.(row)}>
                                <Eye className="size-4" />
                              </Button>
                            ) : null}
                            {actions?.onExport ? (
                              <Button variant="ghost" size="sm" aria-label="Export entry" onClick={() => actions.onExport?.(row)}>
                                <DownloadIcon className="size-4" />
                              </Button>
                            ) : null}
                            {expansion ? (
                              <Button variant="ghost" size="sm" aria-label={isExpanded ? 'Collapse' : 'Expand'} onClick={() => toggleExpand(id)}>
                                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                              </Button>
                            ) : null}
                            {actions?.renderRelated ? actions.renderRelated(row) : null}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                    {expansion ? (
                      <TableRow>
                        <TableCell colSpan={(selection ? 1 : 0) + columns.length + ((actions?.onView || actions?.onExport || expansion) ? 1 : 0)} className="p-0">
                          <div className={cn('grid transition-all', isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')} aria-hidden={!isExpanded} aria-expanded={isExpanded}>
                            <div className="overflow-hidden p-4">{expansion.renderExpanded(row)}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {anySelected ? (
        <div className="sticky bottom-2 z-10 mt-2 flex items-center gap-2 rounded-md border bg-background p-2 shadow-sm">
          <Badge variant="secondary">{selection?.selectedIds.length} selected</Badge>
          <div className="ml-auto flex items-center gap-2">
            {bulkActions}
            <Button variant="outline" size="sm" onClick={() => selection?.onToggleAll?.(allRowIds, false)}>Clear</Button>
          </div>
        </div>
      ) : null}
      {pagination ? (
        <Pagination meta={pagination.meta} onChange={pagination.onChange} hrefBuilder={pagination.hrefBuilder} className="mt-3" />
      ) : null}
    </div>
  )
}

export type { Props as LogTableProps, Column as LogTableColumn }
