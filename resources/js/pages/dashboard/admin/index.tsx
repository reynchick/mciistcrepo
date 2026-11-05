import { useEffect, useMemo, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import ErrorBoundary from '@/components/errors/error-boundary'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import HeadingSmall from '@/components/heading-small'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChevronRight, Minus, X } from 'lucide-react'
import ProgramBarChart from '@/components/dashboard/charts/program-bar-chart'
import YearBarChart from '@/components/dashboard/charts/year-bar-chart'
import ProgramTrendChart from '@/components/dashboard/charts/program-trend-chart'
import TopAccessedResearch from '@/components/dashboard/widgets/top-accessed-research'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Minus as MinusIcon } from 'lucide-react'
import AlignmentStats from '@/components/dashboard/widgets/alignment-stats'
import { Cell, Label, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"


type ProgramEntry = { program_id: number; program_name: string; program_code: string | null; count: number; top_alignments: Array<{ name: string; count: number; percentage: number }> }
type Totals = { total: number }
type AlignmentSummaryItem = { type: 'agenda' | 'sdg' | 'srig'; label: string; count: number; percentage: number }
type AlignmentBreakdownItem = { type: 'agenda' | 'sdg' | 'srig'; name: string; code: string; count: number; percentage: number; order_key: string }
type CollegeView = { yearStart: number; yearEnd: number; programs: ProgramEntry[]; totals: Totals; mostResearchProgram?: string | null }
type ProgramView = {
  program: { id: number; name: string; code: string | null }
  yearly: Array<{ year: number; count: number; top_alignments: Array<{ name: string; count: number; percentage: number }> }>
  summary: { total: number; avg_per_year: number; peak_year?: number | null; peak_count?: number | null }
  overall_alignments: { agenda: number; sdg: number; srig: number }
  alignmentSummary: AlignmentSummaryItem[]
  alignmentBreakdown: AlignmentBreakdownItem[]
  alignmentTotal: number
} | null
type Props = { collegeView: CollegeView; yearOptions: number[]; timeRange?: string; programView?: ProgramView; topAccessedResearch: TopAccessedItem[]; topKeywords: TopKeywordItem[]; alignmentSummary: AlignmentSummaryItem[]; alignmentBreakdown: AlignmentBreakdownItem[] }
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

// Segmented progress bar (same height as the old line bar)
const SEGMENTS = 20

function SegmentedBar({ percentage }: { percentage: number }) {
  const pct = Math.max(0, Math.min(100, percentage))
  const segSize = 100 / SEGMENTS // each segment represents this many percent
  return (
    <div
      className="flex w-full gap-1"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => {
        // 0-100% of this single segment, so a value like 23% shows 2 full segments
        // and a partly filled third one
        const fill = Math.max(0, Math.min(1, (pct - i * segSize) / segSize)) * 100
        return (
          <div
            key={i}
            className="h-2 flex-1 overflow-hidden rounded-[3px] bg-slate-200 dark:bg-slate-700"
          >
            <div className="h-full bg-[#2E6B3A]" style={{ width: `${fill}%` }} />
          </div>
        )
      })}
    </div>
  )
}

const totalResearchChartConfig = {
  total: {
    label: 'Total Research',
    // Navy, same as the Research Trend line
    color: '#1C3766',
  },
} satisfies ChartConfig

const collegeTrendConfig = {
  count: {
    label: 'Research Count',
    color: '#1C3766',
  },
} satisfies ChartConfig

type YearCount = { year: number; count: number }

// Compact card: research growth text on the left and a ring on the right
// showing the overall research count for the selected year range.
function TotalResearchCard({
  total,
  years = [],
  startYear,
  endYear,
  onClick,
}: {
  total: number
  years?: YearCount[] // every year in the selected range
  startYear: number
  endYear: number
  onClick: () => void
}) {
  // Growth: last year of the range vs the first year (same basis as the College Growth card)
  const growth = useMemo(() => {
    if (years.length < 2) return null
    const first = years[0]
    const last = years[years.length - 1]
    const diff = last.count - first.count
    const pct = first.count > 0 ? (diff / first.count) * 100 : null
    const dir = diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('flat' as const)
    return { dir, pct, diff, fromYear: first.year }
  }, [years])

  const tone =
    growth?.dir === 'up' ? 'text-emerald-600' : growth?.dir === 'down' ? 'text-red-500' : 'text-slate-500'
  const GrowthIcon =
    growth?.dir === 'up' ? TrendingUpIcon : growth?.dir === 'down' ? TrendingDownIcon : MinusIcon

  const ringData = [{ name: 'all', value: 1, fill: total > 0 ? '#1C3766' : '#E2E8F0' }]

  return (
    <Card
      className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Research growth</p>
          {growth ? (
            <>
              <p className={`flex items-center gap-1 text-xs font-medium ${tone}`}>
                <GrowthIcon className="size-3.5" />
                {growth.pct !== null
                  ? `${growth.pct > 0 ? '+' : ''}${growth.pct.toFixed(1)}%`
                  : `${growth.diff > 0 ? '+' : ''}${growth.diff}`}
                <span className="font-normal text-slate-500 dark:text-slate-400">from {growth.fromYear}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {growth.diff > 0 ? '+' : ''}
                {growth.diff} records over {startYear}–{endYear}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">Pick at least two years to see growth.</p>
          )}
        </div>

        <ChartContainer config={totalResearchChartConfig} className="aspect-square h-[84px] w-[84px] shrink-0">
          <PieChart>
            <Pie
              data={ringData}
              dataKey="value"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
              innerRadius={30}
              outerRadius={40}
              cornerRadius={4}
              stroke="none"
            >
              {ringData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-base font-bold">
                          {total.toLocaleString()}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard({ collegeView, yearOptions, timeRange = 'all', programView = null, topAccessedResearch, topKeywords, alignmentSummary, alignmentBreakdown }: Props) {
  console.log('AdminDashboard props', { collegeView, yearOptions, timeRange, programView, topAccessedResearch, topKeywords, alignmentSummary, alignmentBreakdown })
  const [startYear, setStartYear] = useState<number>(collegeView.yearStart)
  const [endYear, setEndYear] = useState<number>(collegeView.yearEnd)
  const [currentTimeRange, setCurrentTimeRange] = useState<string>(timeRange)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(programView?.program.id ?? null)
  const [showAlignmentModal, setShowAlignmentModal] = useState(false)
  const [showProgramAlignmentModal, setShowProgramAlignmentModal] = useState(false)

  useEffect(() => {
    setStartYear(collegeView.yearStart)
    setEndYear(collegeView.yearEnd)
  }, [collegeView.yearStart, collegeView.yearEnd])

  useEffect(() => {
    if (timeRange) {
      setCurrentTimeRange(timeRange)
    }
  }, [timeRange])

  useEffect(() => {
    setSelectedProgramId(programView?.program.id ?? null)
  }, [programView?.program.id])

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

  // College-wide research count per year. The college view only has per-program
  // totals, so add up each program's yearly trend (same endpoint the Research
  // Trend chart uses) to find the peak year.
  const [collegeYearly, setCollegeYearly] = useState<Record<number, number> | null>(null)
  useEffect(() => {
    if (programView) return
    const ids = collegeView.programs.map((p) => p.program_id)
    if (ids.length === 0) {
      setCollegeYearly({})
      return
    }
    let cancelled = false
    Promise.all(
      ids.map((id) =>
        fetch(`/dashboard/programs/${id}/trend`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        })
          .then((res) => (res.ok ? res.json() : { data: [] }))
          .then((json) => (json.data ?? []) as Array<{ year: number; count: number }>)
          .catch(() => [] as Array<{ year: number; count: number }>),
      ),
    ).then((lists) => {
      if (cancelled) return
      const totals: Record<number, number> = {}
      lists.flat().forEach((pt) => {
        totals[pt.year] = (totals[pt.year] ?? 0) + pt.count
      })
      setCollegeYearly(totals)
    })
    return () => {
      cancelled = true
    }
  }, [programView, collegeView.programs])

  // College-wide research count for every year in the selected range
  // (all programs combined), used by the College Growth line chart.
  const collegeTrendData = useMemo(() => {
    if (!collegeYearly) return null
    return Array.from({ length: Math.max(0, endYear - startYear + 1) }, (_, i) => ({
      year: startYear + i,
      count: collegeYearly[startYear + i] ?? 0,
    }))
  }, [collegeYearly, startYear, endYear])

  // Overall direction of the college trend: last year of the range vs the first
  const collegeTrendInfo = useMemo(() => {
    if (!collegeTrendData || collegeTrendData.length < 2) return null
    const first = collegeTrendData[0]
    const last = collegeTrendData[collegeTrendData.length - 1]
    const delta = last.count - first.count
    const dir = delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('flat' as const)
    return { dir, delta }
  }, [collegeTrendData])

  // Every year in the selected range with the college-wide count for each (0 if none)
  const collegeYearList = useMemo<YearCount[]>(() => {
    if (!collegeYearly) return []
    return Array.from({ length: Math.max(0, endYear - startYear + 1) }, (_, i) => ({
      year: startYear + i,
      count: collegeYearly[startYear + i] ?? 0,
    }))
  }, [collegeYearly, startYear, endYear])

  // Every year in the selected range for the program view (0 if none)
  const programYearList = useMemo<YearCount[]>(() => {
    if (!programView) return []
    return Array.from({ length: Math.max(0, endYear - startYear + 1) }, (_, i) => {
      const yr = startYear + i
      return { year: yr, count: programView.yearly.find((y) => y.year === yr)?.count ?? 0 }
    })
  }, [programView, startYear, endYear])

  const applyRange = (s: number, e: number, preset?: string) => {
    const min = Math.min(s, e)
    const max = Math.max(s, e)
    setStartYear(min)
    setEndYear(max)
    const resolvedPreset = preset ?? 'custom'
    setCurrentTimeRange(resolvedPreset)
    const params: Record<string, string | number> = {
      year_start: min,
      year_end: max,
      time_range: resolvedPreset,
    }
    if (selectedProgramId) params.program_id = selectedProgramId
    console.log('applyRange', { min, max, params })
    router.get('/dashboard', params, { preserveState: true, preserveScroll: true })
  }

  const applyProgram = (programId: number | null) => {
    setSelectedProgramId(programId)
    const params: Record<string, string | number> = {
      year_start: startYear,
      year_end: endYear,
      time_range: currentTimeRange,
    }
    if (programId) params.program_id = programId
    console.log('applyProgram', { programId, params })
    router.get('/dashboard', params, { preserveState: true, preserveScroll: false })
  }

  const goToKeywordSearch = (keyword: string) => {
    const params = new URLSearchParams()
    params.append('search', keyword)
    router.get(`/browse?${params.toString()}`)
  }

  return (
    <ErrorBoundary>
      <AppLayout title={programView ? 'Program View' : 'Admin Dashboard'}>
        <Head title={programView ? `Program View: ${programView.program.name}` : 'Dashboard'} />
        <div className="-mx-2 min-h-full space-y-4 bg-slate-100 px-2 pb-4 pt-0 sm:px-2 sm:pt-0">

        {!programView && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">College Research Summary</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Program-level research trends and alignment coverage</p>
            </div>
          </div>
          <div>
            {/* Chart card (with filters inline in its header) and Total Research
                card share a row; chart takes 2/3 width. */}
            <div className="mt-2 grid gap-4 grid-cols-1 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2">
                <ProgramBarChart
                  data={chartData}
                  colors={programColors}
                  programs={collegeView.programs}
                  years={years}
                  startYear={startYear}
                  endYear={endYear}
                  timeRange={currentTimeRange}
                  selectedProgramId={selectedProgramId}
                  onProgramChange={(id) => applyProgram(id)}
                  onRangeChange={(s, e, preset) => applyRange(s, e, preset)}
                  onStartYearChange={(y) => applyRange(y, endYear, 'custom')}
                  onEndYearChange={(y) => applyRange(startYear, y, 'custom')}
                  onTimeRangeChange={(s, e, preset) => applyRange(s, e, preset)}
                  onProgramClick={(_, index) => {
                    const p = collegeView.programs[index]
                    applyProgram(p?.program_id ?? null)
                  }}
                  onProgramDoubleTap={(programId) => {
                    applyProgram(programId ?? null)
                  }}
                />
              </div>

              <div className="flex flex-col gap-4 lg:col-span-1">
                <TotalResearchCard
                  total={collegeView.totals.total}
                  years={collegeYearList}
                  startYear={startYear}
                  endYear={endYear}
                  onClick={() => {
                    const params = new URLSearchParams()
                    const yearsInRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
                    yearsInRange.forEach(y => params.append('years[]', String(y)))
                    router.get(`/browse?${params.toString()}`)
                  }}
                />
              {(() => {
                const ready = collegeTrendData !== null && collegeTrendData.length >= 2 && collegeTrendInfo !== null
                const dir = collegeTrendInfo?.dir ?? 'flat'
                const delta = collegeTrendInfo?.delta ?? 0
                const first = collegeTrendData?.[0]?.count ?? 0
                const pct = first > 0 ? (delta / first) * 100 : null
                const lastIndex = (collegeTrendData?.length ?? 1) - 1
                const Icon = dir === 'up' ? TrendingUpIcon : dir === 'down' ? TrendingDownIcon : MinusIcon

                let message = 'Loading growth data…'
                if (collegeTrendData !== null && !ready) {
                  message = 'Pick a range of at least two years to see growth'
                } else if (ready) {
                  if (dir === 'flat') {
                    message = `College research has stayed flat since ${startYear}`
                  } else if (pct === null) {
                    message = `College research has grown by ${delta} records since ${startYear}`
                  } else {
                    const shown = Number(Math.abs(pct).toFixed(1)).toString()
                    message = `College research has ${dir === 'up' ? 'increased' : 'decreased'} by ${shown}% since ${startYear}`
                  }
                }

                return (
                  <Card className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-white/20 bg-[#3D40F5] text-white">
                    {/* Decorative circles */}
                    <svg
                      aria-hidden
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 300 300"
                      preserveAspectRatio="xMidYMid slice"
                      fill="none"
                      stroke="white"
                      strokeOpacity="0.35"
                    >
                      {/* Arcs and dots are kept out of the sparkline band (roughly y 95-165) so nothing overlaps the line or its end dot */}
                      <circle cx="0" cy="420" r="250" />
                      <circle cx="300" cy="0" r="70" strokeOpacity="0.2" />
                      <circle cx="232" cy="200" r="9" />
                      <circle cx="120" cy="26" r="1.6" fill="white" stroke="none" />
                      <circle cx="40" cy="50" r="1.6" fill="white" stroke="none" />
                    </svg>

                    <CardContent className="relative flex h-full flex-col justify-between gap-3 p-5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-white/60 px-3 py-1 text-xs font-medium">
                          Findings
                        </span>
                        <span className="flex size-9 items-center justify-center rounded-full border border-white/60">
                          <Icon className="size-4" />
                        </span>
                      </div>

                      {ready && collegeTrendData ? (
                        <ChartContainer config={collegeTrendConfig} className="aspect-auto !h-16 w-full [&_svg]:overflow-visible">
                          <LineChart data={collegeTrendData} margin={{ top: 10, left: 8, right: 14, bottom: 10 }}>
                            <XAxis dataKey="year" hide padding={{ left: 6, right: 6 }} />
                            <YAxis hide domain={['dataMin', 'dataMax']} />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                  hideIndicator
                                  className="border-slate-200 bg-white text-slate-900 [&_*]:text-slate-900"
                                  formatter={(value, _name, item) => `${item?.payload?.year}: ${value} records`}
                                />
                              }
                            />
                            <Line
                              dataKey="count"
                              type="monotone"
                              stroke="#FFFFFF"
                              strokeOpacity={0.85}
                              strokeWidth={2}
                              dot={(props: { cx?: number; cy?: number; index?: number }) =>
                                props.index === lastIndex ? (
                                  <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill="#FFFFFF" stroke="#3D40F5" strokeWidth={1.5} />
                                ) : (
                                  <g key={props.index} />
                                )
                              }
                              activeDot={{ r: 5, fill: '#FFFFFF' }}
                            />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-14" />
                      )}

                      <p className="text-[1.65rem] font-normal leading-tight">{message}</p>
                    </CardContent>
                  </Card>
                )
              })()}
              </div>
            </div>

            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Card className="cursor-pointer" onClick={() => setShowAlignmentModal(true)}>
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
                      <SegmentedBar percentage={item.percentage} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="cursor-pointer" onClick={() => {
                const mostResearchProgram = collegeView.programs.reduce((max, p) => p.count > max.count ? p : max, collegeView.programs[0])
                if (mostResearchProgram) {
                  const params = new URLSearchParams()
                  const yearsInRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
                  yearsInRange.forEach(y => params.append('years[]', String(y)))
                  params.append('programs[]', String(mostResearchProgram.program_id))
                  router.get(`/browse?${params.toString()}`)
                }
              }}>
                <CardHeader className="pb-3">
                  <HeadingSmall title="Programs with Most Research" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-base md:text-2xl font-bold leading-tight">
                    {collegeView.mostResearchProgram ?? '-'}
                  </div>
                </CardContent>
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
                <Select value={String(programView.program.id)} onValueChange={(v) => applyProgram(parseInt(v, 10))}>
                  <SelectTrigger className="w-full gap-3 sm:w-[240px] h-10 text-sm"><SelectValue /></SelectTrigger>
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
                  years={programYearList}
                  startYear={startYear}
                  endYear={endYear}
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
                        <SegmentedBar percentage={item.percentage} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Accessed Research & Top Keywords Section - Only show in college view */}
        {!selectedProgramId && (
          <div>
  <div className="mb-4 flex items-center gap-2.5">
    <div>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Research Activity Overview</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Research trends, search activity, and most accessed entries</p>
    </div>
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

      <Card className="lg:col-span-2 h-full flex flex-col">
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

    <Card>
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
        </div>
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