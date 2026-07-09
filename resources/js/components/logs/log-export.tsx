import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Download as DownloadIcon, Eye, Save, X, AlertTriangle, Loader2 } from 'lucide-react'

type Format = 'csv' | 'xlsx' | 'pdf' | 'json'
type Scope = 'page' | 'filters' | 'all' | 'selected'

type Column = { id: string; label: string }

type ExportCounts = { page?: number; filters?: number; all?: number; selected?: number }

type ExportResult = { url?: string; fileName?: string; sizeBytes?: number }

type ExportConfig = {
  format: Format
  scope: Scope
  columns: string[]
  includeRelated?: boolean
  addStats?: boolean
  includeCharts?: boolean
  addAuditTrail?: boolean
  passwordProtect?: boolean
  password?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  counts?: ExportCounts
  columns: Column[]
  initialSelectedColumns?: string[]
  dateRangeLabel?: string
  canExport?: boolean
  onExport: (config: ExportConfig, onProgress: (pct: number, status?: string) => void) => Promise<ExportResult>
  onPreview?: (config: ExportConfig) => Promise<Array<Record<string, unknown>>> | Array<Record<string, unknown>>
  onSchedule?: (config: ExportConfig) => Promise<void> | void
  className?: string
}

type HistoryItem = {
  at: string
  format: Format
  scope: Scope
  fileSize?: string
  filters?: string
  fileName?: string
  url?: string
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return undefined
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

export default function LogExport({ open, onOpenChange, counts, columns, initialSelectedColumns, dateRangeLabel, canExport = true, onExport, onPreview, onSchedule, className }: Props) {
  const isMobile = useIsMobile()
  const [format, setFormat] = useState<Format | undefined>()
  const [scope, setScope] = useState<Scope>('page')
  const [selected, setSelected] = useState<string[]>(() => initialSelectedColumns ?? columns.map((c) => c.id))
  const [includeRelated, setIncludeRelated] = useState(false)
  const [addStats, setAddStats] = useState(false)
  const [includeCharts, setIncludeCharts] = useState(false)
  const [addAuditTrail, setAddAuditTrail] = useState(true)
  const [passwordProtect, setPasswordProtect] = useState(false)
  const [password, setPassword] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRows, setPreviewRows] = useState<Array<Record<string, unknown>>>([])
  const [progressOpen, setProgressOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string | undefined>()
  const [exporting, setExporting] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [presetName, setPresetName] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('log-export-history')
      setHistory(raw ? JSON.parse(raw) : [])
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false)
      setProgressOpen(false)
      setProgress(0)
      setStatus(undefined)
      setExporting(false)
    }
  }, [open])

  const totalCount = useMemo(() => {
    switch (scope) {
      case 'page': return counts?.page ?? 0
      case 'filters': return counts?.filters ?? 0
      case 'selected': return counts?.selected ?? 0
      case 'all': return counts?.all ?? 0
      default: return 0
    }
  }, [scope, counts])

  const largeExport = totalCount > 1000
  const canSubmit = !!format && canExport && selected.length > 0

  const setAllColumns = (checked: boolean) => {
    setSelected(checked ? columns.map((c) => c.id) : [])
  }

  const reorder = (id: string, dir: 'up' | 'down') => {
    const idx = selected.indexOf(id)
    if (idx < 0) return
    const j = dir === 'up' ? idx - 1 : idx + 1
    if (j < 0 || j >= selected.length) return
    const next = [...selected]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    setSelected(next)
  }

  const config: ExportConfig | undefined = format ? {
    format,
    scope,
    columns: selected,
    includeRelated,
    addStats,
    includeCharts,
    addAuditTrail,
    passwordProtect,
    password: passwordProtect ? password : undefined,
  } : undefined

  const startExport = async () => {
    if (!config) return
    setExporting(true)
    setProgressOpen(true)
    setProgress(0)
    setStatus('Preparing data...')
    try {
      const result = await onExport(config, (pct, s) => {
        setProgress(Math.max(0, Math.min(100, Math.round(pct))))
        if (s) setStatus(s)
      })
      setStatus('Finalizing...')
      setProgress(100)
      const fileSizeText = formatSize(result.sizeBytes)
      const item: HistoryItem = {
        at: new Date().toISOString(),
        format: config.format,
        scope: config.scope,
        fileSize: fileSizeText,
        filters: dateRangeLabel ? `Range: ${dateRangeLabel}` : undefined,
        fileName: result.fileName,
        url: result.url,
      }
      const nextHistory = [item, ...history].slice(0, 10)
      setHistory(nextHistory)
      try { localStorage.setItem('log-export-history', JSON.stringify(nextHistory)) } catch {}
      if (result.url) {
        const a = document.createElement('a')
        a.href = result.url
        a.download = result.fileName ?? ''
        a.click()
      }
    } catch {
      setStatus('Error during export')
    } finally {
      setExporting(false)
    }
  }

  const openPreview = async () => {
    if (!config || !onPreview) return setPreviewOpen(true)
    const res = await onPreview(config)
    const rows = Array.isArray(res) ? res.slice(0, 10) : []
    setPreviewRows(rows)
    setPreviewOpen(true)
  }

  const schedule = async () => {
    if (!config || !onSchedule) return
    await onSchedule(config)
  }

  const DesktopDialog = (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-[920px]', className)} onKeyDown={(e) => {
        if (e.key === 'Enter' && canSubmit) startExport()
        if (e.key === 'Escape') onOpenChange(false)
      }}>
        <DialogHeader>
          <DialogTitle>Export Logs</DialogTitle>
          <DialogDescription>Choose format, scope, columns, and options</DialogDescription>
        </DialogHeader>
        <div ref={containerRef} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            <div className="rounded-md border p-3">
              <div className="mb-2 font-medium">Format</div>
              <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select format" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border p-3">
              <div className="mb-2 font-medium">Scope</div>
              <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Current Page</SelectItem>
                  <SelectItem value="filters">Current Filters</SelectItem>
                  <SelectItem value="all">All Logs</SelectItem>
                  <SelectItem value="selected">Selected Entries</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 text-xs text-muted-foreground">{dateRangeLabel ? `Date range: ${dateRangeLabel}` : 'No date range selected'}</div>
              <div className="mt-1 text-xs">This will export {totalCount} {totalCount === 1 ? 'entry' : 'entries'}</div>
              {largeExport ? (
                <div className="mt-2 flex items-center gap-2 rounded border border-yellow-300 bg-yellow-100/50 p-2 text-sm text-yellow-900 dark:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-200">
                  <AlertTriangle className="size-4" /> Large export detected
                </div>
              ) : null}
            </div>
            <div className="rounded-md border p-3">
              <div className="mb-2 font-medium">Advanced</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includeRelated} onCheckedChange={(v) => setIncludeRelated(!!v)} /> Include related entity details</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={addStats} onCheckedChange={(v) => setAddStats(!!v)} /> Add summary statistics</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includeCharts} onCheckedChange={(v) => setIncludeCharts(!!v)} disabled={format !== 'pdf'} /> Include visualizations</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={addAuditTrail} onCheckedChange={(v) => setAddAuditTrail(!!v)} /> Add audit trail metadata</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={passwordProtect} onCheckedChange={(v) => setPasswordProtect(!!v)} disabled={format !== 'xlsx' && format !== 'pdf'} /> Password protect file</label>
                {passwordProtect ? (
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="h-8" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium">Columns</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAllColumns(true)}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setAllColumns(false)}>Deselect All</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {columns.map((c) => {
                  const checked = selected.includes(c.id)
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 rounded border p-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          const next = new Set(selected)
                          if (v) next.add(c.id)
                          else next.delete(c.id)
                          setSelected(Array.from(next))
                        }} />
                        <span>{c.label}</span>
                      </label>
                      {checked ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => reorder(c.id, 'up')}>↑</Button>
                          <Button size="sm" variant="ghost" onClick={() => reorder(c.id, 'down')}>↓</Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 font-medium">History</div>
              <div className="grid gap-2">
                {history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent exports</div>
                ) : history.map((h, i) => (
                  <div key={`${h.at}-${i}`} className="flex items-center justify-between gap-2 rounded border p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{h.format.toUpperCase()}</Badge>
                      <span className="text-sm">{new Date(h.at).toLocaleString()}</span>
                      {h.fileSize ? <span className="text-xs text-muted-foreground">{h.fileSize}</span> : null}
                      {h.filters ? <span className="text-xs text-muted-foreground">{h.filters}</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {h.url ? (
                        <Button size="sm" variant="outline" onClick={() => { const a = document.createElement('a'); a.href = h.url as string; a.download = h.fileName ?? ''; a.click() }}>Download</Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {largeExport ? (
            <>
              <Button variant="outline" onClick={schedule}>Schedule Export</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Narrow Filters</Button>
            </>
          ) : null}
          <Button variant="outline" onClick={openPreview} disabled={!canSubmit}><Eye className="mr-1 size-4" /> Preview</Button>
          <Button onClick={startExport} disabled={!canSubmit}>
            {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <DownloadIcon className="mr-1 size-4" />}
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  const MobileSheet = (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn('h-[92vh]', className)}>
        <SheetHeader>
          <SheetTitle>Export Logs</SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          <div className="rounded-md border p-3">
            <div className="mb-2 font-medium">Format</div>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border p-3">
            <div className="mb-2 font-medium">Scope</div>
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Current Page</SelectItem>
                <SelectItem value="filters">Current Filters</SelectItem>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="selected">Selected Entries</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 text-xs text-muted-foreground">{dateRangeLabel ? `Date range: ${dateRangeLabel}` : 'No date range selected'}</div>
            <div className="mt-1 text-xs">This will export {totalCount} entries</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="mb-2 font-medium">Columns</div>
            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => setAllColumns(true)}>Select All</Button>
              <Button size="sm" variant="outline" onClick={() => setAllColumns(false)}>Deselect All</Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {columns.map((c) => {
                const checked = selected.includes(c.id)
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded border p-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={checked} onCheckedChange={(v) => {
                        const next = new Set(selected)
                        if (v) next.add(c.id)
                        else next.delete(c.id)
                        setSelected(Array.from(next))
                      }} />
                      <span>{c.label}</span>
                    </label>
                    {checked ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => reorder(c.id, 'up')}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => reorder(c.id, 'down')}>↓</Button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-2 flex items-center justify-end gap-2 px-4">
          <Button variant="outline" onClick={openPreview} disabled={!canSubmit}><Eye className="mr-1 size-4" /> Preview</Button>
          <Button onClick={startExport} disabled={!canSubmit}>
            {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <DownloadIcon className="mr-1 size-4" />}
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className={cn('relative', className)}>
      {isMobile ? MobileSheet : DesktopDialog}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>First 10 rows</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {selected.map((id) => {
                    const label = columns.find((c) => c.id === id)?.label ?? id
                    return <TableHead key={id}>{label}</TableHead>
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.length === 0 ? (
                  <TableRow><TableCell colSpan={selected.length} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                ) : previewRows.map((row, i) => (
                  <TableRow key={`r-${i}`}>
                    {selected.map((id) => (
                      <TableCell key={`${i}-${id}`}>{String(row[id] ?? '')}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Progress</DialogTitle>
            <DialogDescription>{status ?? 'Working...'}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 h-2 w-full rounded bg-muted">
            <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 text-right text-xs">{progress}%</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export type { Props as LogExportProps, ExportConfig, ExportResult, Column as ExportColumn }
