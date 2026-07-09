import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import ReactSelect, { GroupBase, MultiValue, StylesConfig } from 'react-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadFromUrl } from '@/lib/download'
import { router, usePage } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet'
import { Info, FileText, Download as DownloadIcon, Settings, TrendingUp, PieChart } from 'lucide-react'

type Option = { value: string; label: string }

type Filters = {
  scope: 'program' | 'year' | 'combined'
  programs?: string[]
  timeMode: 'all' | 'year' | 'range' | 'last'
  year?: string
  startDate?: string
  endDate?: string
  lastYears?: number
  includeAgenda?: boolean
  includeSdg?: boolean
  includeSrig?: boolean
  agendas?: string[]
  sdgs?: string[]
  srigs?: string[]
  detailLevel: 'summary' | 'detailed' | 'comprehensive'
  showUnaligned?: boolean
  includeCrossTheme?: boolean
  showGapAnalysis?: boolean
  showTrends?: boolean
  includeComparisonCharts?: boolean
  includeStats?: boolean
  highlightTopThemes?: boolean
  flagEmptyThemes?: boolean
  charts?: { pie?: boolean; bar?: boolean; line?: boolean; heat?: boolean; stacked?: boolean }
}

type ExportFormat = 'pdf' | 'xlsx' | 'pptx'

type Props = {
  agendas: Option[]
  sdgs: Option[]
  srigs: Option[]
  programs: Option[]
  years: Option[]
  canExportPowerPoint?: boolean
  onSubmit?: (payload: { filters: Filters; format: ExportFormat; extra?: Record<string, unknown> }) => void
  onPreview?: (payload: { filters: Filters; format: ExportFormat; extra?: Record<string, unknown> }) => void
}

export default function ThematicReportForm({ agendas, sdgs, srigs, programs, years, canExportPowerPoint = true, onSubmit, onPreview }: Props) {
  const { auth } = usePage<{ auth: { user: { roles?: Array<{ name: string }> } } }>().props
  const isAdmin = (auth?.user?.roles ?? []).some((r) => r.name === 'Administrator')
  const allowPptx = canExportPowerPoint && isAdmin
  const [scope, setScope] = useState<'program' | 'year' | 'combined'>('program')
  const [programMode, setProgramMode] = useState<'all' | 'specific'>('all')
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [timeMode, setTimeMode] = useState<'all' | 'year' | 'range' | 'last'>('all')
  const [year, setYear] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [lastYears, setLastYears] = useState<number>(3)
  const [agendaEnabled, setAgendaEnabled] = useState<boolean>(true)
  const [sdgEnabled, setSdgEnabled] = useState<boolean>(true)
  const [srigEnabled, setSrigEnabled] = useState<boolean>(true)
  const [selectedAgendas, setSelectedAgendas] = useState<string[]>([])
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([])
  const [selectedSrigs, setSelectedSrigs] = useState<string[]>([])
  const [detailLevel, setDetailLevel] = useState<'summary' | 'detailed' | 'comprehensive'>('summary')
  const [showUnaligned, setShowUnaligned] = useState<boolean>(false)
  const [includeCrossTheme, setIncludeCrossTheme] = useState<boolean>(true)
  const [showGapAnalysis, setShowGapAnalysis] = useState<boolean>(true)
  const [showTrends, setShowTrends] = useState<boolean>(true)
  const [includeComparisonCharts, setIncludeComparisonCharts] = useState<boolean>(true)
  const [includeStats, setIncludeStats] = useState<boolean>(true)
  const [highlightTopThemes, setHighlightTopThemes] = useState<boolean>(true)
  const [flagEmptyThemes, setFlagEmptyThemes] = useState<boolean>(false)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [pdfLayout, setPdfLayout] = useState<'portrait' | 'landscape'>('portrait')
  const [pdfExecSummary, setPdfExecSummary] = useState<boolean>(true)
  const [pdfAppendixTables, setPdfAppendixTables] = useState<boolean>(true)
  const [xlsxPivot, setXlsxPivot] = useState<boolean>(true)
  const [xlsxCharts, setXlsxCharts] = useState<boolean>(true)
  const [pptxExecSummary, setPptxExecSummary] = useState<boolean>(true)
  const [pptxSlidesPerTheme, setPptxSlidesPerTheme] = useState<boolean>(true)
  const [chartPie, setChartPie] = useState<boolean>(true)
  const [chartBar, setChartBar] = useState<boolean>(true)
  const [chartLine, setChartLine] = useState<boolean>(true)
  const [chartHeat, setChartHeat] = useState<boolean>(false)
  const [chartStacked, setChartStacked] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [generatedUrl, setGeneratedUrl] = useState<string>('')
  const timerRef = useRef<number | null>(null)
  const [progressOpen, setProgressOpen] = useState<boolean>(false)
  const [formatSheetOpen, setFormatSheetOpen] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [templates, setTemplates] = useState<{ name: string; data: any }[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [comparisonEnabled, setComparisonEnabled] = useState<boolean>(false)
  const [comparisonBy, setComparisonBy] = useState<'program' | 'year'>('program')
  const [comparisonPrograms, setComparisonPrograms] = useState<string[]>([])
  const [comparisonYears, setComparisonYears] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    setPreviewLoading(true)
    previewTimerRef.current = setTimeout(() => {
      setPreviewLoading(false)
    }, 300)
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [scope, programMode, selectedPrograms, timeMode, year, startDate, endDate, lastYears, agendaEnabled, sdgEnabled, srigEnabled, selectedAgendas, selectedSdgs, selectedSrigs, detailLevel, showUnaligned, includeCrossTheme, showGapAnalysis, showTrends, includeComparisonCharts, includeStats, highlightTopThemes, flagEmptyThemes, chartPie, chartBar, chartLine, chartHeat, chartStacked])
  const suggestions = useMemo(() => {
    if (!error) return ''
    if (error.includes('thematic')) return 'Enable Agenda, SDG, or SRIG.'
    if (error.includes('program')) return 'Choose at least one program or switch to All.'
    if (error.includes('range')) return 'Adjust dates so From is earlier than To.'
    if (error.includes('format')) return 'Select PDF, Excel, or PowerPoint (if allowed).'
    if (error.includes('scope')) return 'Use Specific Year and Specific Programs for comprehensive detail.'
    if (error.includes('restricted')) return 'Switch to PDF or Excel, or login as Administrator.'
    return 'Try reducing date range or narrowing selections.'
  }, [error])

  const selectStyles: StylesConfig<Option, true> = {
    control: (p, s) => ({ ...p, minHeight: 42, borderColor: s.isFocused ? '#3b82f6' : '#d1d5db', borderRadius: 8, boxShadow: s.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none' }),
    multiValue: (p) => ({ ...p, backgroundColor: '#dbeafe', borderRadius: 6 }),
    multiValueLabel: (p) => ({ ...p, color: '#1e40af', fontSize: '0.875rem', padding: '2px 6px' }),
    multiValueRemove: (p) => ({ ...p, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? '#3b82f6' : s.isFocused ? '#dbeafe' : 'white', color: s.isSelected ? 'white' : '#111827' }),
    menuPortal: (p) => ({ ...p, zIndex: 50 }),
  }

  const selectedAgendaValues = useMemo(() => agendas.filter((t) => selectedAgendas.includes(t.value)), [agendas, selectedAgendas])
  const selectedSdgValues = useMemo(() => sdgs.filter((t) => selectedSdgs.includes(t.value)), [sdgs, selectedSdgs])
  const selectedSrigValues = useMemo(() => srigs.filter((t) => selectedSrigs.includes(t.value)), [srigs, selectedSrigs])
  const selectedProgramValues = useMemo(() => programs.filter((p) => selectedPrograms.includes(p.value)), [programs, selectedPrograms])

  const buildFilters = (): Filters => ({
    scope,
    programs: programMode === 'specific' ? selectedPrograms : undefined,
    timeMode,
    year: timeMode === 'year' ? (year || undefined) : undefined,
    startDate: timeMode === 'range' ? (startDate || undefined) : undefined,
    endDate: timeMode === 'range' ? (endDate || undefined) : undefined,
    lastYears: timeMode === 'last' ? lastYears : undefined,
    includeAgenda: agendaEnabled,
    includeSdg: sdgEnabled,
    includeSrig: srigEnabled,
    agendas: agendaEnabled && selectedAgendas.length ? selectedAgendas : undefined,
    sdgs: sdgEnabled && selectedSdgs.length ? selectedSdgs : undefined,
    srigs: srigEnabled && selectedSrigs.length ? selectedSrigs : undefined,
    detailLevel,
    showUnaligned,
    includeCrossTheme,
    showGapAnalysis,
    showTrends,
    includeComparisonCharts,
    includeStats,
    highlightTopThemes,
    flagEmptyThemes,
    charts: { pie: chartPie, bar: chartBar, line: chartLine, heat: chartHeat, stacked: chartStacked },
  })

  const handleGenerate = () => onSubmit?.({ filters: buildFilters(), format })
  const handlePreview = () => onPreview?.({ filters: buildFilters(), format })

  const includedCount = useMemo(() => {
    const base = 100
    const themeFactor = (selectedAgendas.length + selectedSdgs.length + selectedSrigs.length) || 1
    const programFactor = programMode === 'specific' ? Math.max(1, selectedPrograms.length) : programs.length
    const timeFactor = timeMode === 'last' ? Math.max(1, lastYears / 3) : timeMode === 'year' ? 1 : 2
    return Math.floor((base * themeFactor * 0.2) + programFactor * 5 * timeFactor)
  }, [selectedAgendas, selectedSdgs, selectedSrigs, programMode, selectedPrograms, programs.length, timeMode, lastYears])

  const withAssociations = useMemo(() => Math.floor(includedCount * 0.8), [includedCount])
  const unaligned = useMemo(() => Math.max(0, includedCount - withAssociations), [includedCount, withAssociations])
  const estimated = useMemo(() => {
    const baseSize = 50000
    const perItem = detailLevel === 'comprehensive' ? 8000 : detailLevel === 'detailed' ? 5000 : 2000
    const totalBytes = baseSize + perItem * includedCount + (chartPie || chartBar || chartLine || chartHeat || chartStacked ? 25000 : 0)
    const sizeStr = totalBytes > 1000000 ? `${(totalBytes / 1000000).toFixed(2)} MB` : `${Math.ceil(totalBytes / 1000)} KB`
    const baseSec = 2
    const perSec = detailLevel === 'comprehensive' ? 0.12 : detailLevel === 'detailed' ? 0.08 : 0.05
    const totalSec = Math.min(60, baseSec + perSec * includedCount)
    return { sizeStr, totalSec }
  }, [detailLevel, includedCount, chartPie, chartBar, chartLine, chartHeat, chartStacked])

  const mostTheme = useMemo(() => {
    if (selectedAgendas.length) return selectedAgendas[0]
    if (selectedSdgs.length) return selectedSdgs[0]
    if (selectedSrigs.length) return selectedSrigs[0]
    return 'N/A'
  }, [selectedAgendas, selectedSdgs, selectedSrigs])

  const leastTheme = useMemo(() => {
    const list = [...selectedAgendas, ...selectedSdgs, ...selectedSrigs]
    return list.length > 1 ? list[list.length - 1] : 'N/A'
  }, [selectedAgendas, selectedSdgs, selectedSrigs])

  const performGenerate = async () => {
    setError('')
    if (!agendaEnabled && !sdgEnabled && !srigEnabled) {
      setError('Select at least one thematic category')
      return
    }
    if (programMode === 'specific' && selectedPrograms.length === 0) {
      setError('Select at least one program')
      return
    }
    if (timeMode === 'range' && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Invalid year range')
      return
    }
    if (!format) {
      setError('Select an export format')
      return
    }
    if (detailLevel === 'comprehensive' && (scope === 'combined' || programMode === 'all' || timeMode !== 'year')) {
      setError('Limit scope for comprehensive detail')
      return
    }
    if (format === 'pptx' && !canExportPowerPoint) {
      setError('PowerPoint format is restricted')
      return
    }
    setLoading(true)
    setProgress(0)
    setSuccessMsg('')
    setGeneratedUrl('')
    setProgressOpen(true)
    const start = Date.now()
    const totalMs = estimated.totalSec * 1000
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(95, Math.floor((elapsed / totalMs) * 100))
      setProgress(p)
    }, 200)
    try {
      const visualizations = [
        ...(chartPie ? ['pie'] : []),
        ...(chartBar ? ['bar'] : []),
        ...(chartLine ? ['line'] : []),
        ...(chartHeat ? ['heatmap'] : []),
        ...(chartStacked ? ['stacked'] : []),
      ]
      const comparisonMode = comparisonEnabled
        ? {
            enabled: true,
            compareBy: comparisonBy,
            selections: comparisonBy === 'program' ? comparisonPrograms : comparisonYears.map((y) => Number(y)),
          }
        : undefined
      const payload = {
        scope,
        programs: programMode === 'specific' ? selectedPrograms : [],
        yearRange: {
          type: timeMode,
          year: timeMode === 'year' ? Number(year) : undefined,
          from: timeMode === 'range' && startDate ? Number(startDate.slice(0, 4)) : undefined,
          to: timeMode === 'range' && endDate ? Number(endDate.slice(0, 4)) : undefined,
          lastYears: timeMode === 'last' ? lastYears : undefined,
        },
        thematicFocus: {
          agenda: { include: agendaEnabled, specific: selectedAgendas.map((a) => Number(a)).filter((n) => !Number.isNaN(n)) },
          sdg: { include: sdgEnabled, specific: selectedSdgs.map((s) => Number(s)).filter((n) => !Number.isNaN(n)) },
          srig: { include: srigEnabled, specific: selectedSrigs.map((s) => Number(s)).filter((n) => !Number.isNaN(n)) },
        },
        detailLevel,
        includeOptions: {
          unaligned: showUnaligned,
          crossTheme: includeCrossTheme,
          gapAnalysis: showGapAnalysis,
          trends: showTrends,
          charts: includeComparisonCharts,
          statistics: includeStats,
          topPerforming: highlightTopThemes,
          emptyThemes: flagEmptyThemes,
        },
        visualizations,
        exportFormat: format === 'xlsx' ? 'excel' : format === 'pptx' ? 'powerpoint' : 'pdf',
        comparisonMode,
      }
      router.post('/reports/thematic/generate', payload, {
        preserveScroll: true,
        onSuccess: (page) => {
          const props: any = (page as unknown as { props?: any })?.props ?? {}
          const url = props.fileUrl || props.report?.fileUrl || props.flash?.fileUrl
          if (url) {
            setGeneratedUrl(url)
            setSuccessMsg('Report generated successfully')
            setProgress(100)
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            downloadFromUrl(url, 'thematic_report')
          } else {
            setSuccessMsg('Report queued for generation')
            setProgress(100)
          }
        },
        onError: () => {
          setError('Generation failed. Adjust filters and try again.')
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setLoading(false)
          setProgressOpen(false)
        },
        onFinish: () => {
          setLoading(false)
          setProgressOpen(false)
        },
      })
    } catch (e) {
      setError('Generation failed. Adjust filters and try again.')
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setLoading(false)
      setProgressOpen(false)
      return
    }
    setLoading(false)
    setProgressOpen(false)
  }

  const resetFilters = () => {
    setScope('program')
    setProgramMode('all')
    setSelectedPrograms([])
    setTimeMode('all')
    setYear('')
    setStartDate('')
    setEndDate('')
    setLastYears(3)
    setAgendaEnabled(true)
    setSdgEnabled(true)
    setSrigEnabled(true)
    setSelectedAgendas([])
    setSelectedSdgs([])
    setSelectedSrigs([])
    setDetailLevel('summary')
    setShowUnaligned(false)
    setIncludeCrossTheme(true)
    setShowGapAnalysis(true)
    setShowTrends(true)
    setIncludeComparisonCharts(true)
    setIncludeStats(true)
    setHighlightTopThemes(true)
    setFlagEmptyThemes(false)
    setFormat('pdf')
    setPdfLayout('portrait')
    setPdfExecSummary(true)
    setPdfAppendixTables(true)
    setXlsxPivot(true)
    setXlsxCharts(true)
    setPptxExecSummary(true)
    setPptxSlidesPerTheme(true)
    setChartPie(true)
    setChartBar(true)
    setChartLine(true)
    setChartHeat(false)
    setChartStacked(false)
    setError('')
    setSuccessMsg('')
    setGeneratedUrl('')
  }

  const saveTemplate = () => {
    const tpl = { name: templateName.trim() || `Template ${new Date().toLocaleString()}`, data: {
      scope, programMode, selectedPrograms, timeMode, year, startDate, endDate, lastYears,
      agendaEnabled, sdgEnabled, srigEnabled, selectedAgendas, selectedSdgs, selectedSrigs,
      detailLevel, showUnaligned, includeCrossTheme, showGapAnalysis, showTrends, includeComparisonCharts,
      includeStats, highlightTopThemes, flagEmptyThemes, chartPie, chartBar, chartLine, chartHeat, chartStacked,
      format, pdfLayout, pdfExecSummary, pdfAppendixTables, xlsxPivot, xlsxCharts, pptxExecSummary, pptxSlidesPerTheme,
      comparisonEnabled, comparisonBy, comparisonPrograms, comparisonYears,
    } }
    const existing = JSON.parse(localStorage.getItem('thematicReportTemplates') || '[]')
    const updated = [tpl, ...existing.filter((t: any) => t.name !== tpl.name)]
    localStorage.setItem('thematicReportTemplates', JSON.stringify(updated))
    setTemplates(updated)
  }

  const applyTemplate = (name: string) => {
    const list = templates.length ? templates : JSON.parse(localStorage.getItem('thematicReportTemplates') || '[]')
    const found = list.find((t: any) => t.name === name)
    if (!found) return
    const d = found.data
    setScope(d.scope)
    setProgramMode(d.programMode)
    setSelectedPrograms(d.selectedPrograms || [])
    setTimeMode(d.timeMode)
    setYear(d.year || '')
    setStartDate(d.startDate || '')
    setEndDate(d.endDate || '')
    setLastYears(d.lastYears || 3)
    setAgendaEnabled(!!d.agendaEnabled)
    setSdgEnabled(!!d.sdgEnabled)
    setSrigEnabled(!!d.srigEnabled)
    setSelectedAgendas(d.selectedAgendas || [])
    setSelectedSdgs(d.selectedSdgs || [])
    setSelectedSrigs(d.selectedSrigs || [])
    setDetailLevel(d.detailLevel || 'summary')
    setShowUnaligned(!!d.showUnaligned)
    setIncludeCrossTheme(!!d.includeCrossTheme)
    setShowGapAnalysis(!!d.showGapAnalysis)
    setShowTrends(!!d.showTrends)
    setIncludeComparisonCharts(!!d.includeComparisonCharts)
    setIncludeStats(!!d.includeStats)
    setHighlightTopThemes(!!d.highlightTopThemes)
    setFlagEmptyThemes(!!d.flagEmptyThemes)
    setChartPie(!!d.chartPie)
    setChartBar(!!d.chartBar)
    setChartLine(!!d.chartLine)
    setChartHeat(!!d.chartHeat)
    setChartStacked(!!d.chartStacked)
    setFormat(d.format || 'pdf')
    setPdfLayout(d.pdfLayout || 'portrait')
    setPdfExecSummary(!!d.pdfExecSummary)
    setPdfAppendixTables(!!d.pdfAppendixTables)
    setXlsxPivot(!!d.xlsxPivot)
    setXlsxCharts(!!d.xlsxCharts)
    setPptxExecSummary(!!d.pptxExecSummary)
    setPptxSlidesPerTheme(!!d.pptxSlidesPerTheme)
    setComparisonEnabled(!!d.comparisonEnabled)
    setComparisonBy(d.comparisonBy || 'program')
    setComparisonPrograms(d.comparisonPrograms || [])
    setComparisonYears(d.comparisonYears || [])
  }

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('thematicReportTemplates') || '[]')
    setTemplates(existing)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thematic Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Report Scope</div>
                <ToggleGroup type="single" value={scope} onValueChange={(v) => setScope((v as typeof scope) || 'program')} className="grid grid-cols-3 gap-2">
                  <ToggleGroupItem value="program">By Program</ToggleGroupItem>
                  <ToggleGroupItem value="year">By Year</ToggleGroupItem>
                  <ToggleGroupItem value="combined">Combined</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Program Filter</div>
                  <ToggleGroup type="single" value={programMode} onValueChange={(v) => setProgramMode((v as typeof programMode) || 'all')} className="grid grid-cols-2 gap-2">
                    <ToggleGroupItem value="all">All Programs</ToggleGroupItem>
                    <ToggleGroupItem value="specific">Specific Programs</ToggleGroupItem>
                  </ToggleGroup>
                  {programMode === 'specific' && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={programs}
                      value={selectedProgramValues}
                      onChange={(items: MultiValue<Option>) => setSelectedPrograms(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select programs"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Year Range</div>
                  <ToggleGroup type="single" value={timeMode} onValueChange={(v) => setTimeMode((v as typeof timeMode) || 'all')} className="grid grid-cols-4 gap-2">
                    <ToggleGroupItem value="all">All Years</ToggleGroupItem>
                    <ToggleGroupItem value="year">Specific Year</ToggleGroupItem>
                    <ToggleGroupItem value="range">Year Range</ToggleGroupItem>
                    <ToggleGroupItem value="last">Last X Years</ToggleGroupItem>
                  </ToggleGroup>
                  {timeMode === 'year' && (
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {timeMode === 'range' && (
                    <div className="flex gap-2">
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  )}
                  {timeMode === 'last' && (
                    <Select value={String(lastYears)} onValueChange={(v) => setLastYears(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} years</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Thematic Focus</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><Checkbox checked={agendaEnabled} onCheckedChange={(c) => setAgendaEnabled(!!c)} /><span className="text-sm">Agenda</span></label>
                  {agendaEnabled && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={agendas}
                      value={selectedAgendaValues}
                      onChange={(items: MultiValue<Option>) => setSelectedAgendas(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select agendas"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><Checkbox checked={sdgEnabled} onCheckedChange={(c) => setSdgEnabled(!!c)} /><span className="text-sm">SDG</span></label>
                  {sdgEnabled && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={sdgs}
                      value={selectedSdgValues}
                      onChange={(items: MultiValue<Option>) => setSelectedSdgs(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select SDGs"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><Checkbox checked={srigEnabled} onCheckedChange={(c) => setSrigEnabled(!!c)} /><span className="text-sm">SRIG</span></label>
                  {srigEnabled && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={srigs}
                      value={selectedSrigValues}
                      onChange={(items: MultiValue<Option>) => setSelectedSrigs(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select SRIGs"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Report Detail</div>
              <ToggleGroup type="single" value={detailLevel} onValueChange={(v) => setDetailLevel((v as typeof detailLevel) || 'summary')} className="grid grid-cols-3 gap-2">
                <ToggleGroupItem value="summary">Summary Only</ToggleGroupItem>
                <ToggleGroupItem value="detailed">Detailed</ToggleGroupItem>
                <ToggleGroupItem value="comprehensive">Comprehensive</ToggleGroupItem>
              </ToggleGroup>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label className="flex items-center gap-2"><Checkbox checked={showUnaligned} onCheckedChange={(c) => setShowUnaligned(!!c)} /><span className="text-sm">Show unaligned research</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={includeCrossTheme} onCheckedChange={(c) => setIncludeCrossTheme(!!c)} /><span className="text-sm">Include cross-theme analysis</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={showGapAnalysis} onCheckedChange={(c) => setShowGapAnalysis(!!c)} /><span className="text-sm">Display gap analysis</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={showTrends} onCheckedChange={(c) => setShowTrends(!!c)} /><span className="text-sm">Show temporal trends</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={includeComparisonCharts} onCheckedChange={(c) => setIncludeComparisonCharts(!!c)} /><span className="text-sm">Include comparison charts</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={includeStats} onCheckedChange={(c) => setIncludeStats(!!c)} /><span className="text-sm">Add statistical summaries</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={highlightTopThemes} onCheckedChange={(c) => setHighlightTopThemes(!!c)} /><span className="text-sm">Highlight top-performing themes</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={flagEmptyThemes} onCheckedChange={(c) => setFlagEmptyThemes(!!c)} /><span className="text-sm">Flag empty themes</span></label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Visualization</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label className="flex items-center gap-2"><Checkbox checked={chartPie} onCheckedChange={(c) => setChartPie(!!c)} /><span className="text-sm">Pie charts</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={chartBar} onCheckedChange={(c) => setChartBar(!!c)} /><span className="text-sm">Bar charts</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={chartLine} onCheckedChange={(c) => setChartLine(!!c)} /><span className="text-sm">Line charts</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={chartHeat} onCheckedChange={(c) => setChartHeat(!!c)} /><span className="text-sm">Heat maps</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={chartStacked} onCheckedChange={(c) => setChartStacked(!!c)} /><span className="text-sm">Stacked charts</span></label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Comparison Mode</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><Checkbox checked={comparisonEnabled} onCheckedChange={(c) => setComparisonEnabled(!!c)} /><span className="text-sm">Enable comparison</span></label>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Compare By</div>
                  <ToggleGroup type="single" value={comparisonBy} onValueChange={(v) => setComparisonBy((v as typeof comparisonBy) || 'program')} className="grid grid-cols-2 gap-2">
                    <ToggleGroupItem value="program">Program</ToggleGroupItem>
                    <ToggleGroupItem value="year">Year</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-2">
                  {comparisonEnabled && comparisonBy === 'program' && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={programs}
                      value={programs.filter((p) => comparisonPrograms.includes(p.value))}
                      onChange={(items: MultiValue<Option>) => setComparisonPrograms(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select programs to compare"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                  {comparisonEnabled && comparisonBy === 'year' && (
                    <ReactSelect<Option, true, GroupBase<Option>>
                      isMulti
                      options={years}
                      value={years.filter((y) => comparisonYears.includes(y.value))}
                      onChange={(items: MultiValue<Option>) => setComparisonYears(items.map((i) => i.value))}
                      styles={selectStyles}
                      placeholder="Select years to compare"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-1">Export Format
                    <Tooltip>
                      <TooltipTrigger aria-label="Export help"><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Choose PDF, Excel, or PowerPoint (Admin only)</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      {allowPptx && <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                {format === 'pdf' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">PDF Options</div>
                    <ToggleGroup type="single" value={pdfLayout} onValueChange={(v) => setPdfLayout((v as typeof pdfLayout) || 'portrait')} className="grid grid-cols-2 gap-2">
                      <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                      <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
                    </ToggleGroup>
                    <label className="flex items-center gap-2"><Checkbox checked={pdfExecSummary} onCheckedChange={(c) => setPdfExecSummary(!!c)} /><span className="text-sm">Executive summary on first page</span></label>
                    <label className="flex items-center gap-2"><Checkbox checked={pdfAppendixTables} onCheckedChange={(c) => setPdfAppendixTables(!!c)} /><span className="text-sm">Appendix tables</span></label>
                  </div>
                )}
                {format === 'xlsx' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Excel Options</div>
                    <label className="flex items-center gap-2"><Checkbox checked={xlsxPivot} onCheckedChange={(c) => setXlsxPivot(!!c)} /><span className="text-sm">Pivot tables</span></label>
                    <label className="flex items-center gap-2"><Checkbox checked={xlsxCharts} onCheckedChange={(c) => setXlsxCharts(!!c)} /><span className="text-sm">Charts embedded</span></label>
                  </div>
                )}
                {format === 'pptx' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">PowerPoint Options</div>
                    <label className="flex items-center gap-2"><Checkbox checked={pptxExecSummary} onCheckedChange={(c) => setPptxExecSummary(!!c)} /><span className="text-sm">Executive summary slide</span></label>
                    <label className="flex items-center gap-2"><Checkbox checked={pptxSlidesPerTheme} onCheckedChange={(c) => setPptxSlidesPerTheme(!!c)} /><span className="text-sm">One slide per theme</span></label>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Load Saved Template</div>
                  <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); applyTemplate(v) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Save Current Configuration</div>
                  <div className="flex gap-2">
                    <Input placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                    <Button variant="secondary" onClick={saveTemplate}>Save</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Actions</div>
                  <div className="flex justify-end gap-2 md:justify-start">
                    <Button variant="outline" onClick={resetFilters}>Reset to Defaults</Button>
                    {onPreview && <Button variant="ghost" onClick={handlePreview}>Preview</Button>}
                    <Button onClick={performGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate Report'}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            <div className="border rounded-md p-4">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">Preview <PieChart className="h-4 w-4 text-muted-foreground" /></div>
              <div className="space-y-1 text-sm" aria-live="polite">
                <div>Total research entries: {includedCount}</div>
                <div>Research with theme associations: {withAssociations} ({includedCount ? Math.round((withAssociations/includedCount)*100) : 0}%)</div>
                <div>Unaligned research: {unaligned} ({includedCount ? Math.round((unaligned/includedCount)*100) : 0}%)</div>
                <div>Most aligned theme: {mostTheme}</div>
                <div>Least aligned theme: {leastTheme}</div>
                <div>Programs covered: {programMode === 'specific' ? selectedPrograms.length : programs.length}</div>
                <div>Years covered: {timeMode === 'year' ? 1 : timeMode === 'last' ? lastYears : startDate && endDate ? 1 : 'All'}</div>
                <div>Estimated size: {estimated.sizeStr}</div>
                <div>Estimated time: {Math.ceil(estimated.totalSec)}s</div>
              </div>
              <div className="mt-3">
                {previewLoading && (
                  <div className="animate-pulse h-24 bg-muted rounded" />
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Percent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...selectedAgendas.slice(0,2), ...selectedSdgs.slice(0,2), ...selectedSrigs.slice(0,1)].map((t, idx) => {
                      const count = Math.max(1, Math.floor(includedCount/(idx+3)))
                      const pct = includedCount ? Math.round((count/includedCount)*100) : 0
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{t}</TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>{pct}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {loading && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm" aria-live="assertive">Generating report… {progress}%</div>
                  <div className="h-2 w-full bg-muted rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground">Time remaining: {Math.max(0, Math.ceil(estimated.totalSec - (progress/100)*estimated.totalSec))}s</div>
                </div>
              )}
              {successMsg && (
                <div className="mt-3 text-sm text-green-600">{successMsg}</div>
              )}
              {error && (
                <div className="mt-3 text-sm text-red-600">{error}</div>
              )}
              {error && suggestions && (
                <div className="text-xs text-muted-foreground">{suggestions}</div>
              )}
              {generatedUrl && (
                <div className="mt-3 flex gap-2">
                  <a className="text-sm underline" href={generatedUrl} target="_blank">View Report</a>
                  <Button variant="outline" size="sm" onClick={() => downloadFromUrl(generatedUrl, 'thematic_report')}>Download Again</Button>
                  <a className="text-sm underline" href="/reports/history">View History</a>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden sticky bottom-0 p-3 bg-background border-t flex justify-end gap-2">
          <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          <Button onClick={performGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</Button>
        </div>
        <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generating Thematic Report</DialogTitle>
              <DialogDescription>Progress {progress}%</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className={progress < 25 ? 'font-medium' : ''}>Analyzing research data…</div>
              <div className={progress >= 25 && progress < 50 ? 'font-medium' : ''}>Calculating theme associations…</div>
              <div className={progress >= 50 && progress < 75 ? 'font-medium' : ''}>Generating visualizations…</div>
              <div className={progress >= 75 && progress < 100 ? 'font-medium' : ''}>Creating document…</div>
            </div>
            <div className="h-2 w-full bg-muted rounded">
              <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
            </div>
          </DialogContent>
        </Dialog>

        <div className="md:hidden">
          <Sheet open={formatSheetOpen} onOpenChange={setFormatSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" className="w-full mt-2" aria-expanded={formatSheetOpen}>Format & Export Options</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Export Options</SheetTitle>
                <SheetDescription>Select format and related settings</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Export Format</div>
                  <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      {allowPptx && <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                {format === 'pdf' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">PDF Options</div>
                    <ToggleGroup type="single" value={pdfLayout} onValueChange={(v) => setPdfLayout((v as typeof pdfLayout) || 'portrait')} className="grid grid-cols-2 gap-2">
                      <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                      <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
                    </ToggleGroup>
                    <label className="flex items-center gap-2"><Checkbox checked={pdfExecSummary} onCheckedChange={(c) => setPdfExecSummary(!!c)} /><span className="text-sm">Executive summary on first page</span></label>
                    <label className="flex items-center gap-2"><Checkbox checked={pdfAppendixTables} onCheckedChange={(c) => setPdfAppendixTables(!!c)} /><span className="text-sm">Appendix tables</span></label>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  )
}
