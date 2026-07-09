import { useEffect, useMemo, useRef, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

export type DataTableColumn<T> = {
  key?: keyof T | string
  header: string
  sortable?: boolean
  className?: string
  render?: (item: T) => React.ReactNode
}

export type DataTableSort = {
  key?: string
  direction?: 'asc' | 'desc'
}

export type DataTableSelection<T> = {
  enabled?: boolean
  selectedKeys: Array<string | number>
  onChange: (keys: Array<string | number>) => void
  getKey?: (item: T) => string | number
}

export type DataTablePagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  onPageChange: (page: number, perPage?: number) => void
}

export type DataTableProps<T> = {
  items: T[]
  columns: Array<DataTableColumn<T>>
  loading?: boolean
  empty?: React.ReactNode
  selection?: DataTableSelection<T>
  actions?: (item: T) => React.ReactNode
  sort?: DataTableSort
  onSortChange?: (sort: DataTableSort) => void
  pagination?: DataTablePagination | null
  searchQuery?: string
  onRowClick?: (item: T) => void
  responsiveMode?: 'auto' | 'table' | 'card'
  virtualized?: boolean
  rowHeight?: number
  height?: number
  stickyFirstColumn?: boolean
}

function getItemKey<T>(item: T, selection?: DataTableSelection<T>) {
  if (selection?.getKey) return selection.getKey(item)
  const id = (item as unknown as { id?: string | number }).id
  if (typeof id !== 'undefined') return id as string | number
  return JSON.stringify(item)
}

function toCells<T>(item: T, columns: Array<DataTableColumn<T>>) {
  return columns.map((col) =>
    col.render ? col.render(item) : col.key ? ((item as unknown as Record<string, unknown>)[String(col.key)] as React.ReactNode) : null
  )
}

export default function DataTable<T>({
  items,
  columns,
  loading,
  empty,
  selection,
  actions,
  sort,
  onSortChange,
  pagination,
  onRowClick,
  responsiveMode = 'auto',
  virtualized,
  rowHeight = 56,
  height = 360,
  stickyFirstColumn = true,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const mode = responsiveMode === 'auto' ? (isMobile ? 'card' : 'table') : responsiveMode

  const [internalSort, setInternalSort] = useState<DataTableSort | undefined>(sort)
  useEffect(() => setInternalSort(sort), [sort])

  const handleSort = (key: string) => {
    if (!onSortChange) return
    const next: DataTableSort = {
      key,
      direction:
        internalSort?.key === key ? (internalSort?.direction === 'asc' ? 'desc' : 'asc') : 'asc',
    }
    setInternalSort(next)
    onSortChange(next)
  }

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const viewportCount = Math.max(1, Math.floor(height / rowHeight))
  const startIndex = virtualized ? Math.max(0, Math.floor(scrollTop / rowHeight) - 3) : 0
  const endIndex = virtualized ? Math.min(items.length, startIndex + viewportCount + 6) : items.length
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex])
  const topPad = virtualized ? startIndex * rowHeight : 0
  const bottomPad = virtualized ? Math.max(0, (items.length - endIndex) * rowHeight) : 0

  if (loading) {
    if (mode === 'card') {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-background p-4">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {selection?.enabled && <TableHead className="w-10" />}
              {columns.map((c, i) => (
                <TableHead key={i}>{c.header}</TableHead>
              ))}
              {actions && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {selection?.enabled && (
                  <TableCell className="w-10">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-background p-6">
        {empty ?? <div className="text-sm text-muted-foreground">No data available</div>}
      </div>
    )
  }

  if (mode === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const key = getItemKey(item, selection)
          const cells = toCells(item, columns)
          const selected = selection?.selectedKeys.includes(key)
          return (
            <div
              key={key}
              className={cn(
                'rounded-lg border bg-background p-4 transition hover:bg-muted/30',
                selected && 'ring-2 ring-primary'
              )}
              onClick={() => onRowClick?.(item)}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selection?.enabled && (
                    <Checkbox
                      checked={!!selected}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...selection.selectedKeys, key]
                          : selection.selectedKeys.filter((k) => k !== key)
                        selection.onChange(next)
                      }}
                    />
                  )}
                  <div className="text-sm font-medium">{columns[0]?.header}</div>
                </div>
                {actions?.(item)}
              </div>
              <div className="space-y-2">
                {cells.map((cell, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground">{columns[i]?.header}</div>
                    <div className="text-sm">{cell}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <div
        ref={containerRef}
        className={cn('relative', virtualized ? 'max-h-[360px] overflow-auto' : 'overflow-x-auto')}
        style={virtualized ? { height } : undefined}
        onScroll={(e) => {
          if (!virtualized) return
          setScrollTop((e.target as HTMLDivElement).scrollTop)
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {selection?.enabled && <TableHead className="w-10" />}
              {columns.map((c, i) => (
                <TableHead key={i}>
                  {c.sortable ? (
                    <Button variant="ghost" size="sm" onClick={() => handleSort(String(c.key ?? i))}>
                      <span className="mr-2">{c.header}</span>
                      {internalSort?.key === String(c.key ?? i) && (
                        <span className="text-xs">{internalSort.direction === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </Button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              {actions && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {virtualized && topPad > 0 && (
              <TableRow>
                <TableCell colSpan={(selection?.enabled ? 1 : 0) + columns.length + (actions ? 1 : 0)}>
                  <div style={{ height: topPad }} />
                </TableCell>
              </TableRow>
            )}
            {visibleItems.map((item) => {
              const key = getItemKey(item, selection)
              const cells = toCells(item, columns)
              const selected = selection?.selectedKeys.includes(key)
              return (
                <TableRow
                  key={key}
                  className={cn('hover:bg-muted/50', selected && 'bg-muted')}
                  onClick={() => onRowClick?.(item)}
                >
                  {selection?.enabled && (
                    <TableCell className={cn('w-10', stickyFirstColumn && 'sticky left-0 bg-background')}>
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={(v) => {
                          const next = v
                            ? [...selection.selectedKeys, key]
                            : selection.selectedKeys.filter((k) => k !== key)
                          selection.onChange(next)
                        }}
                      />
                    </TableCell>
                  )}
                  {cells.map((cell, i) => (
                    <TableCell
                      key={i}
                      className={cn(columns[i]?.className, stickyFirstColumn && i === 0 && 'sticky left-0 bg-background')}
                    >
                      {cell}
                    </TableCell>
                  ))}
                  {actions && <TableCell>{actions(item)}</TableCell>}
                </TableRow>
              )
            })}
            {virtualized && bottomPad > 0 && (
              <TableRow>
                <TableCell colSpan={(selection?.enabled ? 1 : 0) + columns.length + (actions ? 1 : 0)}>
                  <div style={{ height: bottomPad }} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between p-3">
          <div className="text-xs text-muted-foreground">
            Showing {Math.min((pagination.currentPage - 1) * pagination.perPage + 1, pagination.total)} to
            {' '}
            {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1, pagination.perPage)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.lastPage}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1, pagination.perPage)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

