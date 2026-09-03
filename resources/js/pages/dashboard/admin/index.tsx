import { useEffect, useMemo, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import ErrorBoundary from '@/components/errors/error-boundary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChevronRight, Minus, X, LayoutDashboard, Activity } from 'lucide-react'
import ProgramBarChart from '@/components/dashboard/charts/program-bar-chart'
import YearBarChart from '@/components/dashboard/charts/year-bar-chart'
import ProgramTrendChart from '@/components/dashboard/charts/program-trend-chart'
import TopAccessedResearch from '@/components/dashboard/widgets/top-accessed-research'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Minus as MinusIcon } from 'lucide-react'
import AlignmentStats from '@/components/dashboard/widgets/alignment-stats'
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"


type ProgramEntry = { program_id: number; program_name: string; program_code: string | null; count: number; top_alignments: Array<{ name: string; count: number; percentage: number }> }
type Totals = { total: number }
type AlignmentSummaryItem = { type: 'agenda' | 'sdg' | 'srig'; label: string; count: number; percentage: number }
type AlignmentBreakdownItem = { type: 'agenda' | 'sdg' | 'srig'; name: string; code: string; count: number; percentage: number; order_key: string }
type CollegeView = { yearStart: number; yearEnd: number; programs: ProgramEntry[]; totals: Totals; mostProductiveProgram?: string | null }
type ProgramView = {
  program: { id: number; name: string; code: string | null }
  yearly: Array<{ year: number; count: number; top_alignments: Array<{ name: string; count: number; percentage: number }> }>
  summary: { total: number; avg_per_year: number; peak_year?: number | null; peak_count?: number | null }
  overall_alignments: { agenda: number; sdg: number; srig: number }
  alignmentSummary: AlignmentSummaryItem[]
  alignmentBreakdown: AlignmentBreakdownItem[]
  alignmentTotal: number
} | null
type Props = { collegeView: CollegeView; yearOptions: number[]; programView?: ProgramView; topAccessedResearch: TopAccessedItem[]; topKeywords: TopKeywordItem[]; alignmentSummary: AlignmentSummaryItem[]; alignmentBreakdown: AlignmentBreakdownItem[] }
type TopAccessedItem = { id: number | string; title: string; count: number; lastAccessed: string }
type TopKeywordItem = { keyword: string; count: number; trend: 'up' | 'down' | 'flat' }

function palette(i: number) {
  const colors = [
    'rgb(12, 35, 74)',    // #0C234A
    'rgb(37, 21, 122)',   // #25157a
    'rgb(37, 82, 180)',   // #2552b4
    'rgb(255, 197, 12)',  // #FFC50C
    'rgb(255, 212, 73)',  // #FFD449
  ]
  return colors[i % colors.length]
}

function abbr(name: string) {
  const words = name.split(/\s+/).filter((w) => !['of', 'in', 'and', 'the'].includes(w.toLowerCase()))
  const code = words.map((w) => w[0]?.toUpperCase() ?? '').join('')
  return code.slice(0, 6)
}

function TrendIcon({ trend }: { trend: TopKeywordItem['trend'] }) {
  if (trend === 'up') return <TrendingUpIcon className="size-4 text-emerald-600" />
  if (trend === 'down') return <TrendingDownIcon className="size-4 text-red-500" />
  return <MinusIcon className="size-4 text-slate-400" />
}

const RING_CAP = 100
const totalResearchChartConfig = {
  total: {
    label: 'Total Research',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

// CHANGED: stretches to full height of its grid cell so it matches the
// taller ProgramBarChart card when they share a row.
function TotalResearchCard({ total, onClick }: { total: number; onClick: () => void }) {
  const percentage = Math.min(100, Math.max(0, (total / RING_CAP) * 100))
  const endAngle = (percentage / 100) * 250
  return (
    <Card className="border cursor-pointer h-full flex flex-col" onClick={onClick}>
      <CardHeader className="items-center pb-0">
        <HeadingSmall title="Total Research" />
      </CardHeader>
      <CardContent className="pb-0 flex-1 flex items-center justify-center">
        <ChartContainer config={totalResearchChartConfig} className="mx-auto aspect-square max-h-[180px] w-full">
          <RadialBarChart
            data={[{ metric: 'total', value: 100, fill: 'var(--color-total)' }]}
            startAngle={0}
            endAngle={endAngle}
            innerRadius={58}
            outerRadius={74}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[58, 50]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl md:text-4xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                          Records
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard({ collegeView, yearOptions, programView = null, topAccessedResearch, topKeywords, alignmentSummary, alignmentBreakdown }: Props) {
  console.log('AdminDashboard props', { collegeView, yearOptions, programView, topAccessedResearch, topKeywords, alignmentSummary, alignmentBreakdown })
  const [startYear, setStartYear] = useState<number>(collegeView.yearStart)
  const [endYear, setEndYear] = useState<number>(collegeView.yearEnd)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(programView?.program.id ?? null)
  const [showAlignmentModal, setShowAlignmentModal] = useState(false)
  const [showProgramAlignmentModal, setShowProgramAlignmentModal] = useState(false)
  useEffect(() => {
    if (programView) {
      const el = document.getElementById('program-view')
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [programView])

  const years = useMemo(() => {
    const unique = Array.from(new Set(yearOptions)).sort((a, b) => b - a)
    return unique
  }, [yearOptions])

  const total = collegeView.totals.total || 1
  const alignmentSummarySorted = useMemo(() => [...alignmentSummary].sort((a, b) => b.percentage - a.percentage || b.count - a.count), [alignmentSummary])
  const programAlignmentSummarySorted = useMemo(() => (programView ? [...programView.alignmentSummary].sort((a, b) => b.percentage - a.percentage || b.count - a.count) : []), [programView])
  const chartData = useMemo(() => {
    return collegeView.programs.map((p) => {
      const name = p.program_code || abbr(p.program_name)
      return {
        programId: p.program_id,
        program: name,
        count: p.count,
        topAlignments: p.top_alignments.map(a => ({
          label: `${a.name} (${a.percentage}%)`,
          percentage: a.percentage,
        })),
      }
    })
  }, [collegeView])

  const programColors = useMemo(() => collegeView.programs.map((_, idx) => palette(idx)), [collegeView.programs])

  const applyRange = (s: number, e: number) => {
    const min = Math.min(s, e)
    const max = Math.max(s, e)
    setStartYear(min)
    setEndYear(max)
    console.log('applyRange', { s, e, normalized: { year_start: min, year_end: max } })
    router.get('/dashboard', { year_start: min, year_end: max }, { preserveState: true, preserveScroll: true })
  }
  const applyProgram = (programId: number | null) => {
    setSelectedProgramId(programId)
    const params: Record<string, number> = { year_start: startYear, year_end: endYear }
    if (programId) params.program_id = programId
    console.log('applyProgram', { programId, params })
    router.get('/dashboard', params, { preserveState: true, preserveScroll: true })
  }

  const goToKeywordSearch = (keyword: string) => {
    const params = new URLSearchParams()
    params.append('search', keyword)
    router.get(`/browse?${params.toString()}`)
  }

  return (
    <ErrorBoundary>
      <AppLayout>
        <Head title="Dashboard" />
        <div className="space-y-2 p-4 sm:p-6">
        <Heading title="Administrator Dashboard" />

        {!programView && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="size-5 text-slate-800 dark:text-white" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">College View</h2>
          </div>
          <div>
            {/* CHANGED: chart card (with filters now inline in its header) and
                Total Research card share a row; chart takes 2/3 width. */}
            <div className="mt-2 grid gap-4 grid-cols-1 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2">
                <ProgramBarChart
                  data={chartData}
                  colors={programColors}
                  programs={collegeView.programs}
                  years={years}
                  startYear={startYear}
                  endYear={endYear}
                  selectedProgramId={selectedProgramId}
                  onProgramChange={(id) => applyProgram(id)}
                  onStartYearChange={(y) => { setStartYear(y); applyRange(y, endYear) }}
                  onEndYearChange={(y) => { setEndYear(y); applyRange(startYear, y) }}
                  onProgramClick={(_, index) => {
                    const p = collegeView.programs[index]
                    applyProgram(p?.program_id ?? null)
                  }}
                  onProgramDoubleTap={(programId) => {
                    applyProgram(programId ?? null)
                  }}
                />
              </div>

              <div className="lg:col-span-1">
                <TotalResearchCard
                  total={collegeView.totals.total}
                  onClick={() => {
                    const params = new URLSearchParams()
                    const yearsInRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
                    yearsInRange.forEach(y => params.append('years[]', String(y)))
                    router.get(`/browse?${params.toString()}`)
                  }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Card className="border cursor-pointer" onClick={() => setShowAlignmentModal(true)}>
                <CardHeader className="pb-2 space-y-1">
                  <HeadingSmall title="Alignment Coverage" description={`Across all programs (${startYear}–${endYear})`} />
                </CardHeader>
                <CardContent className="pt-1 space-y-3">
                  {alignmentSummarySorted.slice(0, 3).map((item) => (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-semibold text-slate-800 dark:text-white">{item.label}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-100">{item.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-2 rounded-full bg-slate-400 dark:bg-slate-600" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border cursor-pointer" onClick={() => {
                const mostProductiveProgram = collegeView.programs.reduce((max, p) => p.count > max.count ? p : max, collegeView.programs[0])
                if (mostProductiveProgram) {
                  const params = new URLSearchParams()
                  const yearsInRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
                  yearsInRange.forEach(y => params.append('years[]', String(y)))
                  params.append('programs[]', String(mostProductiveProgram.program_id))
                  router.get(`/browse?${params.toString()}`)
                }
              }}>
                <CardHeader className="pb-3">
                  <HeadingSmall title="Most Productive Program" />
                </CardHeader>
                <CardContent className="pt-0"><div className="text-base md:text-2xl font-bold leading-tight">
                  {collegeView.mostProductiveProgram ?? '-'}
                </div></CardContent>
              </Card>
            </div>
          </div>
        </div>
        )}

        {programView && (
          <Card id="program-view">
            <CardHeader className="space-y-4">
              <div className="min-w-0">
                <HeadingSmall title={`Program View: ${programView.program.name}`} description="Yearly trend and alignments" />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button variant="outline" size="sm" className="h-10 px-4 whitespace-nowrap" onClick={() => applyProgram(null)}>← Back to College View</Button>
                <Select value={String(programView.program.id)} onValueChange={(v) => applyProgram(parseInt(v, 10))}>
                  <SelectTrigger className="w-full sm:w-[240px] h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {collegeView.programs.map((p) => (
                      <SelectItem key={p.program_id} value={String(p.program_id)}>{p.program_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-0">
                {(() => {
                  const data = programView.yearly.map((y) => {
                    return {
                      year: y.year,
                      count: y.count,
                      topAlignments: y.top_alignments.map(a => ({
                        label: `${a.name} (${a.percentage}%)`,
                        percentage: a.percentage,
                      })),
                    }
                  })
                  const idx = collegeView.programs.findIndex((p) => p.program_id === programView.program.id)
                  const color = idx >= 0 ? palette(idx) : 'rgba(59, 130, 246, 0.8)'
                  return <YearBarChart data={data} color={color} tooltipTitlePrefix={programView.program.name} customTitle={`Research Count in ${programView.program.name} per Year`} programId={programView.program.id} />
                })()}
              </div>

              <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <TotalResearchCard
                  total={programView.summary.total}
                  onClick={() => {
                    const params = new URLSearchParams()
                    const yearsInRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
                    yearsInRange.forEach(y => params.append('years[]', String(y)))
                    params.append('programs[]', String(programView.program.id))
                    router.get(`/browse?${params.toString()}`)
                  }}
                />
                <Card>
                  <CardHeader className="pb-3">
                    <HeadingSmall title="Average per Year" />
                  </CardHeader>
                  <CardContent className="pt-0"><div className="text-3xl md:text-4xl font-bold">{programView.summary.avg_per_year}</div></CardContent>
                </Card>
                <Card
                  className="cursor-pointer"
                  onClick={() => {
                    if (!programView.summary.peak_year) return
                    const params = new URLSearchParams()
                    params.append('years[]', String(programView.summary.peak_year))
                    params.append('programs[]', String(programView.program.id))
                    router.get(`/browse?${params.toString()}`)
                  }}
                >
                  <CardHeader className="pb-3">
                    <HeadingSmall title="Peak Year" />
                  </CardHeader>
                  <CardContent className="pt-0"><div className="text-2xl md:text-3xl font-bold">{programView.summary.peak_year ?? '-'}{programView.summary.peak_count ? ` (${programView.summary.peak_count})` : ''}</div></CardContent>
                </Card>
              </div>

              <div className="mt-4 grid gap-4 grid-cols-1">
                <Card className="cursor-pointer" onClick={() => setShowProgramAlignmentModal(true)}>
                  <CardHeader className="pb-2 space-y-1">
                    <CardTitle className="text-sm font-semibold">Alignment Coverage (Program)</CardTitle>
                    <CardDescription className="text-xs text-slate-500">{programView.program.name} • {startYear}–{endYear}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-1 space-y-3">
                    {programAlignmentSummarySorted.length === 0 && <div className="text-sm text-slate-600 dark:text-slate-300">No alignment data in this range.</div>}
                    {programAlignmentSummarySorted.slice(0, 3).map((item) => (
                      <div key={item.type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-semibold text-slate-800 dark:text-white">{item.label}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-100">{item.percentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-2 rounded-full bg-slate-400 dark:bg-slate-600" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Top Accessed Research & Top Keywords Section - Only show in college view */}
        {!selectedProgramId && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
  <div className="mb-4 flex items-center gap-2.5">
    <Activity className="size-5 text-slate-800 dark:text-white" />
    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Research Activity Overview</h2>
  </div>
  <div className="grid grid-cols-1 gap-4">
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-5 items-stretch">
      <div className="lg:col-span-3">
        <ProgramTrendChart
          programs={collegeView.programs.map((p) => ({
            program_id: p.program_id,
            program_name: p.program_name,
            program_code: p.program_code,
          }))}
          defaultProgramId={selectedProgramId}
        />
     </div>

      <Card className="lg:col-span-2 h-full flex flex-col border">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-base font-semibold">Most Searched Keywords</CardTitle>
          <CardDescription className="text-sm text-slate-500">Keywords with the most search activity</CardDescription>
        </CardHeader>
        <CardContent className="pt-1 px-4 pb-3 flex-1 flex flex-col justify-between gap-1.5">
          {topKeywords.slice(0, 5).map((k) => (
            <Item
              key={k.keyword}
              onClick={() => goToKeywordSearch(k.keyword)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  goToKeywordSearch(k.keyword)
                }
              }}
              className="rounded-lg border-none bg-slate-50 px-3 py-1.5 transition-colors hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ItemContent className="gap-0">
                <ItemTitle className="text-sm font-medium">{k.keyword}</ItemTitle>
                <ItemDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {k.count.toLocaleString()} searches
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </ItemActions>
            </Item>
          ))}
        </CardContent>
      </Card>
    </div>

    <Card className="border">
      <CardHeader className="pb-1.5 pt-3 px-4">
        <CardTitle className="text-base font-semibold">Most Accessed Research</CardTitle>
        <CardDescription className="text-sm text-slate-500">Research entries with the highest view counts</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <TopAccessedResearch items={topAccessedResearch.slice(0, 5)} />
      </CardContent>
    </Card>
  </div>
          </div>
        )}
      </AppLayout>

      <Dialog open={showAlignmentModal} onOpenChange={setShowAlignmentModal}>
        <DialogContent
          overlayClassName="bg-black/40 backdrop-blur-sm"
          className="p-0 w-[99vw] sm:w-[98vw] md:w-[97vw] lg:w-[96vw] xl:w-[95vw] 2xl:w-[94vw] max-w-screen-2xl sm:max-w-screen-2xl md:max-w-screen-2xl lg:max-w-screen-2xl xl:max-w-screen-2xl 2xl:max-w-screen-2xl rounded-xl lg:rounded-2xl border border-slate-200/80 overflow-hidden [&_[data-slot='dialog-close']]:hidden"
        >
          <div className="flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-end gap-2 px-5 md:px-8 pt-4 pb-0 md:pt-5">
              <DialogClose
                onClick={() => setShowAlignmentModal(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label="Close alignment coverage"
              >
                <X className="w-5 h-5" />
              </DialogClose>
            </div>
            <div className="px-5 md:px-8 pb-6 md:pb-8 overflow-y-auto">
              <AlignmentStats summary={alignmentSummarySorted} breakdown={alignmentBreakdown} total={collegeView.totals.total} title="Alignment coverage across all research" subtitle={`SDG / SRIG / Agenda totals • ${startYear}–${endYear}`} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProgramAlignmentModal} onOpenChange={setShowProgramAlignmentModal}>
        <DialogContent
          overlayClassName="bg-black/40 backdrop-blur-sm"
          className="p-0 w-[99vw] sm:w-[98vw] md:w-[97vw] lg:w-[96vw] xl:w-[95vw] 2xl:w-[94vw] max-w-screen-2xl sm:max-w-screen-2xl md:max-w-screen-2xl lg:max-w-screen-2xl xl:max-w-screen-2xl 2xl:max-w-screen-2xl rounded-xl lg:rounded-2xl border border-slate-200/80 overflow-hidden [&_[data-slot='dialog-close']]:hidden"
        >
          <div className="flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-end gap-2 px-5 md:px-8 pt-4 pb-0 md:pt-5">
              <DialogClose
                onClick={() => setShowProgramAlignmentModal(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label="Close program alignment coverage"
              >
                <X className="w-5 h-5" />
              </DialogClose>
            </div>
            <div className="px-5 md:px-8 pb-6 md:pb-8 overflow-y-auto">
              <AlignmentStats summary={programAlignmentSummarySorted} breakdown={programView?.alignmentBreakdown ?? []} total={programView?.alignmentTotal ?? 0} title={`Alignment coverage for ${programView?.program.name}`} subtitle={`${startYear}–${endYear}`} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}