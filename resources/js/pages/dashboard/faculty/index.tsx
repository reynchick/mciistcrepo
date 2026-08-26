import { useEffect, useMemo, useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import YearBarChart from '@/components/dashboard/charts/year-bar-chart'
import AlignmentStats from '@/components/dashboard/widgets/alignment-stats'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FileText, Users } from 'lucide-react'

type FacultyStats = {
  totals: { advised: number; paneled: number }
  recent?: Array<{ id: number | string; title: string; program?: string; status?: 'ongoing' | 'completed'; year?: number; role?: 'adviser' | 'panelist' }>
  yearlyTrendAdvised?: Array<{ year: number; count: number }>
  yearlyTrendPaneled?: Array<{ year: number; count: number }>
  alignmentSummary?: Array<{ type: 'agenda' | 'sdg' | 'srig'; label: string; count: number; percentage: number }>
  alignmentBreakdown?: Array<{ type: 'agenda' | 'sdg' | 'srig'; name: string; code: string; count: number; percentage: number; order_key: string }>
  alignmentTotal?: number
  lastUpdated?: string
}

type SharedData = {
  auth: {
    user: {
      first_name: string
      middle_name?: string | null
      last_name: string
      faculty_id?: number | string | null
    }
  }
}

type Props = {
  facultyStats?: FacultyStats
  filterOptions?: {
    years: Array<{ year: number; count: number }>
    programs: Array<{ id: number; name: string; code: string | null; research_count: number }>
  }
  filters?: { years: number[]; programs: number[] }
}

function getInitialYears(): number[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  return params.getAll('year[]').map((value) => Number(value)).filter((value) => !Number.isNaN(value))
}

function formatLastUpdated(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return '—'
  const date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

export default function FacultyDashboard({ facultyStats, filterOptions, filters }: Props) {
  const fs: FacultyStats = facultyStats ?? {
    totals: { advised: 0, paneled: 0 },
    recent: [],
    yearlyTrendAdvised: [],
    yearlyTrendPaneled: [],
    alignmentSummary: [],
    alignmentBreakdown: [],
    alignmentTotal: 0,
    lastUpdated: '',
  }
  const { auth } = usePage<SharedData>().props
  const [selectedYears, setSelectedYears] = useState<number[]>(() => getInitialYears())
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([])
  const [chartRole, setChartRole] = useState<'advised' | 'paneled'>('advised')

  useEffect(() => {
    setSelectedYears(filters?.years ?? getInitialYears())
    setSelectedPrograms(filters?.programs ?? [])
  }, [filters?.years, filters?.programs])

  const yearOptions = useMemo(() => {
    return [...(filterOptions?.years ?? [])].sort((a, b) => b.year - a.year)
  }, [filterOptions?.years])

  const years = useMemo(() => yearOptions.map((option) => option.year), [yearOptions])
  const startYear = selectedYears.length > 0 ? Math.min(...selectedYears) : years.length > 0 ? Math.min(...years) : new Date().getFullYear()
  const endYear = selectedYears.length > 0 ? Math.max(...selectedYears) : years.length > 0 ? Math.max(...years) : new Date().getFullYear()

  const applyRange = (start: number, end: number, programs = selectedPrograms) => {
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const nextYears = Array.from({ length: max - min + 1 }, (_, index) => min + index)
    setSelectedYears(nextYears)

    const params: Record<string, number | number[]> = { year_start: min, year_end: max }
    if (programs.length > 0) params.program = programs
    router.get('/dashboard', params, { preserveState: true, preserveScroll: true })
  }

  const applyProgram = (program: number | null) => {
    const nextPrograms = program === null ? [] : [program]
    setSelectedPrograms(nextPrograms)
    applyRange(startYear, endYear, nextPrograms)
  }

  const mainFilters = (
    <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select Program</label>
          <Select value={selectedPrograms[0] ? String(selectedPrograms[0]) : '__all__'} onValueChange={(value) => applyProgram(value === '__all__' ? null : Number(value))}>
            <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Programs</SelectItem>
              {(filterOptions?.programs ?? []).map((program) => (
                <SelectItem key={program.id} value={String(program.id)}>{program.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select Start Year</label>
          <Select value={String(startYear)} onValueChange={(value) => applyRange(Number(value), endYear)}>
            <SelectTrigger className="h-9 w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select End Year</label>
          <Select value={String(endYear)} onValueChange={(value) => applyRange(startYear, Number(value))}>
            <SelectTrigger className="h-9 w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </div>
    </div>
  )

  const viewControls = (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <ToggleGroup
        type="single"
        value={chartRole}
        onValueChange={(value) => value && setChartRole(value as 'advised' | 'paneled')}
        variant="outline"
        aria-label="Research activity view"
        className="h-9"
      >
        <ToggleGroupItem value="advised" aria-label="Show advised research">Advised</ToggleGroupItem>
        <ToggleGroupItem value="paneled" aria-label="Show paneled research">Paneled</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )

  const filteredAdvisedCount = useMemo(() => {
    const source = fs.yearlyTrendAdvised ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendAdvised, selectedYears])

  const filteredPaneledCount = useMemo(() => {
    const source = fs.yearlyTrendPaneled ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendPaneled, selectedYears])

  const browseHref = (role: 'adviser' | 'panelist') => {
    const params = new URLSearchParams()
    selectedYears.forEach((year) => params.append('years[]', String(year)))
    selectedPrograms.forEach((program) => params.append('programs[]', String(program)))
    if (role === 'adviser') params.append('advisers[]', String(auth.user.faculty_id ?? ''))
    if (role === 'panelist') params.set('panelist', String(auth.user.faculty_id ?? ''))
    return `/faculty/browse?${params.toString()}`
  }

  return (
    <AppLayout>
      <Head title="Faculty Dashboard" />
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Research Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your research activities and statistics</p>
          </div>
        </div>

        <div>
          <div className="flex-1 min-w-0">
              <div className="w-full space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.visit(browseHref('adviser'))}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Research Advised
                      </CardTitle>
                      <CardDescription>Your advised research activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{filteredAdvisedCount.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.visit(browseHref('panelist'))}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Research Paneled
                      </CardTitle>
                      <CardDescription>Your paneled research activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{filteredPaneledCount.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle>Research Activity</CardTitle>
                        <CardDescription>{startYear}–{endYear}</CardDescription>
                      </div>
                      {viewControls}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mainFilters}
                    <div className="mt-6">
                      {chartRole === 'advised' ? (
                        <YearBarChart
                          data={(fs.yearlyTrendAdvised ?? []).map((item) => ({ ...item, topAlignments: [] }))}
                          color="#23568D"
                          tooltipTitlePrefix="Advised"
                          browseResearchHref="/faculty/browse"
                          browseQuery={{ key: 'advisers[]', value: auth.user.faculty_id ?? '' }}
                        />
                      ) : (
                        <YearBarChart
                          data={(fs.yearlyTrendPaneled ?? []).map((item) => ({ ...item, topAlignments: [] }))}
                          color="#4EBDAC"
                          tooltipTitlePrefix="Paneled"
                          browseResearchHref="/faculty/browse"
                          browseQuery={{ key: 'panelist', value: auth.user.faculty_id ?? '' }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <AlignmentStats
                  summary={fs.alignmentSummary ?? []}
                  breakdown={fs.alignmentBreakdown ?? []}
                  total={fs.alignmentTotal ?? 0}
                  title="Alignment coverage across your advised research"
                  subtitle="SDG / SRIG / Agenda coverage"
                />
              </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
