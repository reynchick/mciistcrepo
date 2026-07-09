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
import { router } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

type Id = number | string

type Option = { value: string; label: string }

type Faculty = {
  id: Id
  name: string
  position?: string
  department?: string
  avatar?: string | null
  advised_count?: number
  paneled_count?: number
}

type Filters = {
  facultyMode: 'all' | 'specific' | 'department'
  facultyIds?: Id[]
  department?: string
  positions?: string[]
  timeMode: 'all' | 'year' | 'range' | 'ay' | 'last'
  year?: string
  startDate?: string
  endDate?: string
  academicYear?: string
  lastYears?: number
  programs?: string[]
  groupBy?: 'department' | 'position' | 'program' | 'year'
  sortBy?: 'name' | 'total' | 'advised' | 'paneled'
  includeZero?: boolean
  includeArchived?: boolean
  onlyActive?: boolean
  showTitles?: boolean
  showAbstracts?: boolean
  showRanking?: boolean
  showCharts?: boolean
  showStats?: boolean
  showNetwork?: boolean
  includeOrcid?: boolean
  includeContact?: boolean
}

type ExportFormat = 'pdf' | 'xlsx' | 'csv'

type Props = {
  faculties: Faculty[]
  departments: Option[]
  positions: string[]
  programs: Option[]
  years: Option[]
  onPreview?: (payload: { filters: Filters; format: ExportFormat; extra?: Record<string, unknown> }) => void
  onSubmit: (payload: { filters: Filters; format: ExportFormat; extra?: Record<string, unknown> }) => void
}

type FacultyOption = { value: Id; label: string; faculty: Faculty }

export default function FacultyProductivityForm({ faculties, departments, positions, programs, years, onPreview, onSubmit }: Props) {
  const [facultyMode, setFacultyMode] = useState<'all' | 'specific' | 'department'>('all')
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<Id[]>([])
  const [department, setDepartment] = useState<string>('')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [timeMode, setTimeMode] = useState<'all' | 'year' | 'range' | 'ay' | 'last'>('all')
  const [year, setYear] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [academicYear, setAcademicYear] = useState<string>('')
  const [lastYears, setLastYears] = useState<number>(3)
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [groupBy, setGroupBy] = useState<'department' | 'position' | 'program' | 'year'>('department')
  const [sortBy, setSortBy] = useState<'name' | 'total' | 'advised' | 'paneled'>('total')
  const [includeZero, setIncludeZero] = useState<boolean>(true)
  const [includeArchived, setIncludeArchived] = useState<boolean>(false)
  const [onlyActive, setOnlyActive] = useState<boolean>(false)
  const [showTitles, setShowTitles] = useState<boolean>(false)
  const [showAbstracts, setShowAbstracts] = useState<boolean>(false)
  const [showRanking, setShowRanking] = useState<boolean>(false)
  const [showCharts, setShowCharts] = useState<boolean>(false)
  const [showStats, setShowStats] = useState<boolean>(true)
  const [showNetwork, setShowNetwork] = useState<boolean>(false)
  const [includeOrcid, setIncludeOrcid] = useState<boolean>(false)
  const [includeContact, setIncludeContact] = useState<boolean>(false)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [pdfLayout, setPdfLayout] = useState<'portrait' | 'landscape'>('landscape')
  const [pdfToc, setPdfToc] = useState<boolean>(true)
  const [pdfHeaderFooter, setPdfHeaderFooter] = useState<boolean>(true)
  const [xlsxSummary, setXlsxSummary] = useState<boolean>(true)
  const [xlsxPerFaculty, setXlsxPerFaculty] = useState<boolean>(true)
  const [xlsxCharts, setXlsxCharts] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [generatedUrl, setGeneratedUrl] = useState<string>('')
  const [templateName, setTemplateName] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const timerRef = useRef<number | null>(null)
  const [progressOpen, setProgressOpen] = useState<boolean>(false)

  const facultyOptions: FacultyOption[] = useMemo(() => {
    return faculties
      .map((f) => ({ value: f.id, label: f.name, faculty: f }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [faculties])

  const groupedFacultyOptions: GroupBase<FacultyOption>[] = useMemo(() => {
    const groups = new Map<string, FacultyOption[]>()
    facultyOptions.forEach((o) => {
      const k = (o.faculty.department || 'Others')
      const arr = groups.get(k) || []
      arr.push(o)
      groups.set(k, arr)
    })
    return Array.from(groups.entries()).map(([label, options]) => ({ label, options }))
  }, [facultyOptions])

  const selectedFacultyOptions = useMemo(() => facultyOptions.filter((o) => selectedFacultyIds.includes(o.value)), [facultyOptions, selectedFacultyIds])

  const selectStyles: StylesConfig<FacultyOption, true> = {
    control: (p, s) => ({ ...p, minHeight: 42, borderColor: s.isFocused ? '#3b82f6' : '#d1d5db', borderRadius: 8, boxShadow: s.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none' }),
    multiValue: (p) => ({ ...p, backgroundColor: '#dbeafe', borderRadius: 6 }),
    multiValueLabel: (p) => ({ ...p, color: '#1e40af', fontSize: '0.875rem', padding: '2px 6px' }),
    multiValueRemove: (p) => ({ ...p, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? '#3b82f6' : s.isFocused ? '#dbeafe' : 'white', color: s.isSelected ? 'white' : '#111827' }),
    menuPortal: (p) => ({ ...p, zIndex: 50 }),
  }

  const optionSelectStyles: StylesConfig<Option, true> = {
    control: (p, s) => ({ ...p, minHeight: 42, borderColor: s.isFocused ? '#3b82f6' : '#d1d5db', borderRadius: 8, boxShadow: s.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none' }),
    multiValue: (p) => ({ ...p, backgroundColor: '#dbeafe', borderRadius: 6 }),
    multiValueLabel: (p) => ({ ...p, color: '#1e40af', fontSize: '0.875rem', padding: '2px 6px' }),
    multiValueRemove: (p) => ({ ...p, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? '#3b82f6' : s.isFocused ? '#dbeafe' : 'white', color: s.isSelected ? 'white' : '#111827' }),
    menuPortal: (p) => ({ ...p, zIndex: 50 }),
  }

  const programOptions = useMemo(() => programs, [programs])

  const selectedProgramValues = useMemo(() => programOptions.filter((p) => selectedPrograms.includes(p.value)), [programOptions, selectedPrograms])

  const buildFilters = (): Filters => ({
    facultyMode,
    facultyIds: facultyMode === 'specific' ? selectedFacultyIds : undefined,
    department: facultyMode === 'department' ? (department || undefined) : undefined,
    positions: selectedPositions.length ? selectedPositions : undefined,
    timeMode,
    year: timeMode === 'year' ? (year || undefined) : undefined,
    startDate: timeMode === 'range' ? (startDate || undefined) : undefined,
    endDate: timeMode === 'range' ? (endDate || undefined) : undefined,
    academicYear: timeMode === 'ay' ? (academicYear || undefined) : undefined,
    lastYears: timeMode === 'last' ? lastYears : undefined,
    programs: selectedPrograms.length ? selectedPrograms : undefined,
    groupBy,
    sortBy,
    includeZero,
    includeArchived,
    onlyActive,
    showTitles,
    showAbstracts,
    showRanking,
    showCharts,
    showStats,
    showNetwork,
    includeOrcid,
    includeContact,
  })

  const extra = useMemo(() => ({
    pdf: { layout: pdfLayout, toc: pdfToc, headerFooter: pdfHeaderFooter },
    xlsx: { summary: xlsxSummary, perFacultySheets: xlsxPerFaculty, charts: xlsxCharts },
  }), [pdfLayout, pdfToc, pdfHeaderFooter, xlsxSummary, xlsxPerFaculty, xlsxCharts])

  const handleGenerate = () => onSubmit({ filters: buildFilters(), format, extra })
  const handlePreview = () => onPreview?.({ filters: buildFilters(), format, extra })

  const includedFacultyCount = useMemo(() => {
    if (facultyMode === 'specific') return selectedFacultyIds.length
    if (facultyMode === 'department') {
      const filtered = faculties.filter((f) => (!department || f.department === department) && (selectedPositions.length === 0 || (f.position ? selectedPositions.includes(f.position) : false)))
      return filtered.length
    }
    return faculties.length
  }, [facultyMode, selectedFacultyIds, faculties, department, selectedPositions])

  const dateSummary = useMemo(() => {
    if (timeMode === 'all') return 'All time'
    if (timeMode === 'year' && year) return `Year ${year}`
    if (timeMode === 'range' && startDate && endDate) return `Research from ${startDate} to ${endDate}`
    if (timeMode === 'ay' && academicYear) return `Academic Year ${academicYear}`
    if (timeMode === 'last') return `Last ${lastYears} years`
    return 'All time'
  }, [timeMode, year, startDate, endDate, academicYear, lastYears])

  const estimated = useMemo(() => {
    const baseSize = 60000
    const perFaculty = showTitles || showAbstracts ? 6000 : 3000
    const totalBytes = baseSize + perFaculty * includedFacultyCount + (showCharts ? 20000 : 0) + (showNetwork ? 15000 : 0)
    const sizeStr = totalBytes > 1000000 ? `${(totalBytes / 1000000).toFixed(2)} MB` : `${Math.ceil(totalBytes / 1000)} KB`
    const baseSec = 2
    const perSec = showTitles || showAbstracts ? 0.15 : 0.08
    const totalSec = Math.min(60, baseSec + perSec * includedFacultyCount + (showCharts ? 3 : 0))
    return { sizeStr, totalSec }
  }, [includedFacultyCount, showTitles, showAbstracts, showCharts, showNetwork])

  const sampleRows = useMemo(() => {
    const pool = facultyMode === 'specific'
      ? faculties.filter((f) => selectedFacultyIds.includes(f.id))
      : facultyMode === 'department'
      ? faculties.filter((f) => (!department || f.department === department))
      : faculties
    const mapped = pool.map((f) => ({
      name: f.name,
      position: f.position || '',
      department: f.department || '',
      advised: f.advised_count || 0,
      paneled: f.paneled_count || 0,
      total: (f.advised_count || 0) + (f.paneled_count || 0),
    }))
    return mapped.sort((a, b) => b.total - a.total).slice(0, 5)
  }, [faculties, facultyMode, selectedFacultyIds, department])

  const resetFilters = () => {
    setFacultyMode('all')
    setSelectedFacultyIds([])
    setDepartment('')
    setSelectedPositions([])
    setTimeMode('all')
    setYear('')
    setStartDate('')
    setEndDate('')
    setAcademicYear('')
    setLastYears(3)
    setSelectedPrograms([])
    setGroupBy('department')
    setSortBy('total')
    setIncludeZero(true)
    setIncludeArchived(false)
    setOnlyActive(false)
    setShowTitles(false)
    setShowAbstracts(false)
    setShowRanking(false)
    setShowCharts(false)
    setShowStats(true)
    setShowNetwork(false)
    setIncludeOrcid(false)
    setIncludeContact(false)
    setFormat('pdf')
    setPdfLayout('landscape')
    setPdfToc(true)
    setPdfHeaderFooter(true)
    setXlsxSummary(true)
    setXlsxPerFaculty(true)
    setXlsxCharts(true)
    setError('')
    setSuccessMsg('')
    setGeneratedUrl('')
  }

  const validate = (): string | undefined => {
    if (facultyMode === 'specific' && selectedFacultyIds.length === 0) return 'Select at least one faculty'
    if (timeMode === 'range' && startDate && endDate && startDate > endDate) return 'Start date must be before end date'
    if (showTitles && includedFacultyCount >= 50) return 'Too many faculty when including titles; reduce selection'
    if (!format) return 'Select an export format'
    return undefined
  }

  const performGenerate = async () => {
    setError('')
    const msg = validate()
    if (msg) {
      setError(msg)
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
      const payload = {
        facultySelection: facultyMode === 'all' ? 'all' : selectedFacultyIds,
        timeRange: {
          type: timeMode === 'ay' ? 'academic' : timeMode,
          year: year ? Number(year) : undefined,
          from: startDate || undefined,
          to: endDate || undefined,
          lastYears: timeMode === 'last' ? lastYears : undefined,
        },
        programs: selectedPrograms,
        groupBy,
        sortBy,
        sortOrder: 'desc',
        includeZeroCount: includeZero,
        includeArchived,
        displayOptions: {
          researchTitles: showTitles,
          abstracts: showAbstracts,
          rankings: showRanking,
          charts: showCharts,
          statistics: showStats,
          collaboration: showNetwork,
          orcid: includeOrcid,
          contact: includeContact,
        },
        exportFormat: format === 'xlsx' ? 'excel' : format,
        pdfOptions: format === 'pdf' ? { layout: pdfLayout, includeTableOfContents: pdfToc, includePageNumbers: pdfHeaderFooter } : undefined,
      }
      router.post('/reports/faculty-productivity/generate', payload, {
        preserveScroll: true,
        onSuccess: (page) => {
          const props: any = (page as unknown as { props?: any })?.props ?? {}
          const url = props.fileUrl || props.report?.fileUrl || props.flash?.fileUrl
          if (url) {
            setGeneratedUrl(url)
            setSuccessMsg('Report generated successfully')
            setProgress(100)
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            downloadFromUrl(url, 'faculty_productivity')
          } else {
            setSuccessMsg('Report queued for generation')
            setProgress(100)
          }
        },
        onError: () => {
          setError('Generation failed. Check filters and try again.')
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
      setError('Generation failed. Check filters and try again.')
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setLoading(false)
      setProgressOpen(false)
      return
    }
    setLoading(false)
    setProgressOpen(false)
  }

  const [templates, setTemplates] = useState<{ name: string; data: { filters: Filters; format: ExportFormat; extra: Record<string, unknown> } }[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('facultyReportTemplates')
      if (raw) setTemplates(JSON.parse(raw) || [])
    } catch {}
  }, [])

  const saveTemplate = () => {
    if (!templateName.trim()) return
    const entry = { name: templateName.trim(), data: { filters: buildFilters(), format, extra } }
    const next = [...templates.filter((t) => t.name !== entry.name), entry]
    setTemplates(next)
    try { localStorage.setItem('facultyReportTemplates', JSON.stringify(next)) } catch {}
    setTemplateName('')
  }

  const applyTemplate = (name: string) => {
    const t = templates.find((x) => x.name === name)
    if (!t) return
    setSelectedTemplate(name)
    const f = t.data.filters
    setFacultyMode(f.facultyMode || 'all')
    setSelectedFacultyIds(f.facultyIds || [])
    setDepartment(f.department || '')
    setSelectedPositions(f.positions || [])
    setTimeMode(f.timeMode || 'all')
    setYear(f.year || '')
    setStartDate(f.startDate || '')
    setEndDate(f.endDate || '')
    setAcademicYear(f.academicYear || '')
    setLastYears(f.lastYears || 3)
    setSelectedPrograms(f.programs || [])
    setGroupBy(f.groupBy || 'department')
    setSortBy(f.sortBy || 'total')
    setIncludeZero(!!f.includeZero)
    setIncludeArchived(!!f.includeArchived)
    setOnlyActive(!!f.onlyActive)
    setShowTitles(!!f.showTitles)
    setShowAbstracts(!!f.showAbstracts)
    setShowRanking(!!f.showRanking)
    setShowCharts(!!f.showCharts)
    setShowStats(!!f.showStats)
    setShowNetwork(!!f.showNetwork)
    setIncludeOrcid(!!f.includeOrcid)
    setIncludeContact(!!f.includeContact)
    setFormat((t.data.format as ExportFormat) || 'pdf')
    const pdf = (t.data.extra?.pdf || {}) as { layout?: 'portrait' | 'landscape'; toc?: boolean; headerFooter?: boolean }
    const xlsx = (t.data.extra?.xlsx || {}) as { summary?: boolean; perFacultySheets?: boolean; charts?: boolean }
    setPdfLayout(pdf.layout || 'landscape')
    setPdfToc(!!pdf.toc)
    setPdfHeaderFooter(!!pdf.headerFooter)
    setXlsxSummary(xlsx.summary ?? true)
    setXlsxPerFaculty(xlsx.perFacultySheets ?? true)
    setXlsxCharts(xlsx.charts ?? true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">Faculty Productivity Report
          <Tooltip>
            <TooltipTrigger aria-label="Help"><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent>Generate productivity metrics by faculty, department, and program</TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Faculty Selection</div>
            <ToggleGroup type="single" value={facultyMode} onValueChange={(v) => setFacultyMode((v as typeof facultyMode) || 'all')} className="grid grid-cols-3 gap-2">
              <ToggleGroupItem value="all">All Faculty</ToggleGroupItem>
              <ToggleGroupItem value="specific">Specific Faculty</ToggleGroupItem>
              <ToggleGroupItem value="department">Department/College</ToggleGroupItem>
            </ToggleGroup>
            {facultyMode === 'specific' && (
              <div>
                <ReactSelect<FacultyOption, true, GroupBase<FacultyOption>>
                  isMulti
                  options={groupedFacultyOptions}
                  value={selectedFacultyOptions}
                  onChange={(items: MultiValue<FacultyOption>) => setSelectedFacultyIds(items.map((i) => i.value))}
                  styles={selectStyles as StylesConfig<FacultyOption, true>}
                  placeholder="Select faculty"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  formatOptionLabel={(opt) => (
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{(opt.faculty.advised_count || 0)} advised • {(opt.faculty.paneled_count || 0)} paneled</span>
                    </div>
                  )}
                />
                {selectedFacultyIds.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">{selectedFacultyIds.length} selected</div>
                )}
              </div>
            )}
            {facultyMode === 'department' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Position Filter</div>
                  <div className="grid grid-cols-2 gap-2">
                    {positions.map((p) => (
                      <label key={p} className="flex items-center gap-2">
                        <Checkbox checked={selectedPositions.includes(p)} onCheckedChange={(c) => setSelectedPositions((prev) => c ? [...prev, p] : prev.filter((x) => x !== p))} />
                        <span className="text-sm">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Time Range</div>
          <ToggleGroup type="single" value={timeMode} onValueChange={(v) => setTimeMode((v as typeof timeMode) || 'all')} className="grid grid-cols-5 gap-2">
            <ToggleGroupItem value="all">All Time</ToggleGroupItem>
            <ToggleGroupItem value="year">Specific Year</ToggleGroupItem>
            <ToggleGroupItem value="range">Year Range</ToggleGroupItem>
            <ToggleGroupItem value="ay">Academic Year</ToggleGroupItem>
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
          {timeMode === 'ay' && (
            <Input placeholder="AY 2023-2024" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          )}
          {timeMode === 'last' && (
            <Select value={String(lastYears)} onValueChange={(v) => setLastYears(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} years</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Program Filter</div>
          <ReactSelect<Option, true, GroupBase<Option>>
            isMulti
            options={programOptions}
            value={selectedProgramValues}
            onChange={(items: MultiValue<Option>) => setSelectedPrograms(items.map((i) => i.value))}
            styles={optionSelectStyles}
            placeholder="All Programs"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuPosition="fixed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Report Grouping</div>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="program">Program</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Sort by</div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="total">Total Count</SelectItem>
                <SelectItem value="advised">Advised Count</SelectItem>
                <SelectItem value="paneled">Paneled Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Include</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="flex items-center gap-2"><Checkbox checked={includeZero} onCheckedChange={(c) => setIncludeZero(!!c)} /><span className="text-sm">Zero-count faculty</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={includeArchived} onCheckedChange={(c) => setIncludeArchived(!!c)} /><span className="text-sm">Archived research</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={onlyActive} onCheckedChange={(c) => setOnlyActive(!!c)} /><span className="text-sm">Only active research</span></label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Display Options</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="flex items-center gap-2"><Checkbox checked={showTitles} onCheckedChange={(c) => setShowTitles(!!c)} /><span className="text-sm">Include individual research titles</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={showAbstracts} onCheckedChange={(c) => setShowAbstracts(!!c)} /><span className="text-sm">Show research abstracts</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={showRanking} onCheckedChange={(c) => setShowRanking(!!c)} /><span className="text-sm">Display productivity rankings</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={showCharts} onCheckedChange={(c) => setShowCharts(!!c)} /><span className="text-sm">Include comparison charts</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={showStats} onCheckedChange={(c) => setShowStats(!!c)} /><span className="text-sm">Add statistical summary</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={showNetwork} onCheckedChange={(c) => setShowNetwork(!!c)} /><span className="text-sm">Show collaboration network</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={includeOrcid} onCheckedChange={(c) => setIncludeOrcid(!!c)} /><span className="text-sm">Include ORCID information</span></label>
            <label className="flex items-center gap-2"><Checkbox checked={includeContact} onCheckedChange={(c) => setIncludeContact(!!c)} /><span className="text-sm">Add contact information</span></label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Export Format</div>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {format === 'pdf' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">PDF Layout</div>
                <ToggleGroup type="single" value={pdfLayout} onValueChange={(v) => setPdfLayout((v as typeof pdfLayout) || 'portrait')} className="grid grid-cols-2 gap-2">
                  <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                  <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
                </ToggleGroup>
                <label className="flex items-center gap-2"><Checkbox checked={pdfToc} onCheckedChange={(c) => setPdfToc(!!c)} /><span className="text-sm">Table of contents</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={pdfHeaderFooter} onCheckedChange={(c) => setPdfHeaderFooter(!!c)} /><span className="text-sm">Header/Footer</span></label>
              </div>
            )}
            {format === 'xlsx' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Excel Options</div>
                <label className="flex items-center gap-2"><Checkbox checked={xlsxSummary} onCheckedChange={(c) => setXlsxSummary(!!c)} /><span className="text-sm">Summary sheet</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={xlsxPerFaculty} onCheckedChange={(c) => setXlsxPerFaculty(!!c)} /><span className="text-sm">Detailed sheets per faculty</span></label>
                <label className="flex items-center gap-2"><Checkbox checked={xlsxCharts} onCheckedChange={(c) => setXlsxCharts(!!c)} /><span className="text-sm">Auto-generate charts</span></label>
              </div>
            )}
            {format === 'csv' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">CSV Options</div>
                <div className="text-xs text-muted-foreground">Flat structure export</div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
                <Button variant="outline" onClick={saveTemplate}>Save as Template</Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTemplate} onValueChange={(v) => applyTemplate(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              {onPreview && <Button variant="ghost" onClick={handlePreview}>Preview</Button>}
              <Button onClick={performGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate Report'}</Button>
            </div>
          </div>
          <div className="mt-6 border rounded-md p-4">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="space-y-1 text-sm">
              <div>{includedFacultyCount} faculty members</div>
              <div>{dateSummary}</div>
              <div>Estimated size: {estimated.sizeStr}</div>
              <div>Estimated time: {Math.ceil(estimated.totalSec)}s</div>
            </div>
            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Advised</TableHead>
                    <TableHead>Paneled</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.position}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.advised}</TableCell>
                      <TableCell>{r.paneled}</TableCell>
                      <TableCell>{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {loading && (
              <div className="mt-3 space-y-2">
                <div className="text-sm">Generating report… {progress}%</div>
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
            {generatedUrl && (
              <div className="mt-3 flex gap-2">
                <a className="text-sm underline" href={generatedUrl} target="_blank">View Report</a>
                <Button variant="outline" size="sm" onClick={() => downloadFromUrl(generatedUrl, 'faculty_productivity')}>Download Again</Button>
                <a className="text-sm underline" href="/reports/history">View History</a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generating Faculty Productivity Report</DialogTitle>
            <DialogDescription>Progress {progress}%</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className={progress < 25 ? 'font-medium' : ''}>Analyzing faculty records…</div>
            <div className={progress >= 25 && progress < 50 ? 'font-medium' : ''}>Aggregating advisories and panels…</div>
            <div className={progress >= 50 && progress < 75 ? 'font-medium' : ''}>Computing statistics…</div>
            <div className={progress >= 75 && progress < 100 ? 'font-medium' : ''}>Creating document…</div>
          </div>
          <div className="h-2 w-full bg-muted rounded">
            <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
