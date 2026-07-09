import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Column<T> = {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  width?: string
}

export type SortConfig = {
  column: string
  direction: 'asc' | 'desc' | 'none'
}

export type UseTableOptions<T> = {
  data: T[]
  columns: Column<T>[]
  initialSort?: SortConfig
  serverSide?: boolean
  onServerSort?: (sort: SortConfig) => void
  onServerFilter?: (filters: Record<string, unknown>) => void
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export type UseTableReturn<T> = {
  tableData: T[]
  sortConfig: SortConfig
  handleSort: (column: string) => void
  getSortIcon: (column: string) => ReactNode
  selectedRows: Set<number | string>
  toggleRowSelection: (id: number | string) => void
  toggleAllRows: () => void
  isRowSelected: (id: number | string) => boolean
  clearSelection: () => void
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  isEmpty: boolean
  isLoading: boolean
}

export function useTable<T>(options: UseTableOptions<T>): UseTableReturn<T> {
  const { data, columns, initialSort, serverSide = false, onServerSort, pagination } = options
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort ?? { column: '', direction: 'none' })
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(pagination?.current_page ?? 1)
  const perPage = pagination?.per_page ?? data.length
  const total = pagination?.total ?? data.length
  const totalPages = pagination?.last_page ?? Math.max(1, Math.ceil(total / perPage || 1))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [data])

  const handleSort = (column: string) => {
    const isSame = sortConfig.column === column
    const nextDirection: SortConfig['direction'] = isSame
      ? sortConfig.direction === 'none'
        ? 'asc'
        : sortConfig.direction === 'asc'
        ? 'desc'
        : 'none'
      : 'asc'
    const next = { column, direction: nextDirection }
    setSortConfig(next)
    if (serverSide && onServerSort) {
      setIsLoading(true)
      onServerSort(next)
    }
  }

  const sortable = (column: string) => {
    const c = columns.find((x) => (typeof x.key === 'string' ? x.key === column : String(x.key) === column))
    return !!c?.sortable
  }

  const getSortIcon = (column: string): ReactNode => {
    if (!sortable(column)) return null
    if (sortConfig.column !== column || sortConfig.direction === 'none') return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const comparator = (a: unknown, b: unknown) => {
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1
    const sa = String(a).toLowerCase()
    const sb = String(b).toLowerCase()
    if (sa < sb) return -1
    if (sa > sb) return 1
    return 0
  }

  const tableData = useMemo(() => {
    if (serverSide) return data
    if (!sortConfig.column || sortConfig.direction === 'none') return data
    const col = columns.find((c) => (typeof c.key === 'string' ? c.key === sortConfig.column : String(c.key) === sortConfig.column))
    if (!col || !col.sortable) return data
    const key = col.key
    const sorted = [...data].sort((ra, rb) => {
      const va = typeof key === 'string' ? (ra as unknown as Record<string, unknown>)[key] : (ra as unknown as Record<string, unknown>)[String(key)]
      const vb = typeof key === 'string' ? (rb as unknown as Record<string, unknown>)[key] : (rb as unknown as Record<string, unknown>)[String(key)]
      const base = comparator(va, vb)
      return sortConfig.direction === 'asc' ? base : -base
    })
    if (!serverSide && pagination && perPage < sorted.length) {
      const start = (currentPage - 1) * perPage
      return sorted.slice(start, start + perPage)
    }
    return sorted
  }, [data, columns, sortConfig, serverSide, pagination, perPage, currentPage])

  const toggleRowSelection = (id: number | string) => {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRows(next)
  }

  const rowId = (row: T, index: number): number | string => {
    const r = row as unknown as Record<string, unknown>
    const id = r['id']
    const uid = r['userID']
    if (typeof id === 'string' || typeof id === 'number') return id
    if (typeof uid === 'string' || typeof uid === 'number') return uid
    return index
  }

  const toggleAllRows = () => {
    const allIds = tableData.map((r, i) => rowId(r, i))
    const allSelected = allIds.every((id) => selectedRows.has(id))
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(allIds))
    }
  }

  const isRowSelected = (id: number | string) => selectedRows.has(id)
  const clearSelection = () => setSelectedRows(new Set())

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(totalPages, page))
    setCurrentPage(p)
  }
  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  const isEmpty = tableData.length === 0

  return {
    tableData,
    sortConfig,
    handleSort,
    getSortIcon,
    selectedRows,
    toggleRowSelection,
    toggleAllRows,
    isRowSelected,
    clearSelection,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    isEmpty,
    isLoading,
  }
}
