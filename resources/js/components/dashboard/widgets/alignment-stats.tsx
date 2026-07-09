import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AlignmentSummaryItem = { type: 'agenda' | 'sdg' | 'srig'; label: string; count: number; percentage: number }
type AlignmentBreakdownItem = { type: 'agenda' | 'sdg' | 'srig'; name: string; code: string; count: number; percentage: number; order_key: string }
type TableKey = 'agenda' | 'sdg' | 'srig'

type SortMode = 'percentage' | 'code'

interface Props {
  summary: AlignmentSummaryItem[]
  breakdown: AlignmentBreakdownItem[]
  total: number
  initialSortMode?: SortMode
  title?: string
  subtitle?: string
}

export default function AlignmentStats({ summary, breakdown, total, initialSortMode = 'percentage', title, subtitle }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>(initialSortMode)
  const [tableKey, setTableKey] = useState<TableKey>('sdg')

  const sortItems = (items: AlignmentBreakdownItem[]) => {
    if (sortMode === 'percentage') return [...items].sort((a, b) => b.percentage - a.percentage || b.count - a.count)
    return [...items].sort((a, b) => a.order_key.localeCompare(b.order_key))
  }

  const byType = useMemo<Record<TableKey, AlignmentBreakdownItem[]>>(() => ({
    agenda: sortItems(breakdown.filter((i) => i.type === 'agenda')),
    sdg: sortItems(breakdown.filter((i) => i.type === 'sdg')),
    srig: sortItems(breakdown.filter((i) => i.type === 'srig')),
  }), [breakdown, sortMode])

  const tableLabels: Record<TableKey, string> = { agenda: 'Agenda', sdg: 'SDG', srig: 'SRIG' }

  const renderTable = (title: string, rows: AlignmentBreakdownItem[]) => (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <CardHeader className="px-4 sm:px-5 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Across {total} research</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-5 pb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-2 sm:px-3 md:px-4 py-2.5">Name</th>
                <th className="px-2 sm:px-3 md:px-4 py-2.5 text-right">Research</th>
                <th className="px-2 sm:px-3 md:px-4 py-2.5 text-right">% of total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.type}-${item.code}`} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/50">
                  <td className="px-2 sm:px-3 md:px-4 py-2.5 text-slate-800 dark:text-slate-100 font-medium">{item.name}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-2.5 text-right text-slate-800 dark:text-slate-100 font-semibold">{item.count}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-800 px-4 sm:px-5 py-4 sm:py-5 space-y-1">
          {title && (
            <h2 className="text-lg sm:text-xl font-bold text-slate-50 dark:text-white leading-snug">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.type} className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">{item.count} research</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{item.percentage}%</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-2 rounded-full bg-slate-400 dark:bg-slate-600" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Alignment tables</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">All SDG, SRIG, and Agenda entries (including zero-count)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Order by:</span>
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="h-9 w-48 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Most aligned → least</SelectItem>
                <SelectItem value="code">Code order (e.g., SDG1…)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-xs text-slate-500">Table:</span>
            <Select value={tableKey} onValueChange={(v) => setTableKey(v as TableKey)}>
              <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sdg">SDG</SelectItem>
                <SelectItem value="srig">SRIG</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        {renderTable(tableLabels[tableKey], byType[tableKey])}
      </div>

      <div className="hidden lg:grid gap-6 lg:grid-cols-3">
        {renderTable('Agenda', byType.agenda)}
        {renderTable('SDG', byType.sdg)}
        {renderTable('SRIG', byType.srig)}
      </div>
      </div>
    </div>
  )
}
