import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import BarChart from './bar-chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ListFilter, LayoutGrid } from 'lucide-react'

interface Alignment {
  label: string
  percentage: number
}

interface Datum {
  programId?: number
  program: string
  count: number
  topAlignments: Alignment[]
}

interface ProgramOption {
  program_id: number
  program_name: string
  program_code: string | null
}

interface Props {
  data: Datum[]
  onProgramClick?: (program: string, index: number) => void
  onProgramDoubleTap?: (programId: number | null, program: string, index: number) => void
  colors?: string[]

  // NEW: filter controls rendered inside the chart card header
  programs: ProgramOption[]
  years: number[]
  startYear: number
  endYear: number
  selectedProgramId: number | null
  onProgramChange: (programId: number | null) => void
  onStartYearChange: (year: number) => void
  onEndYearChange: (year: number) => void
}

const ALL = '__all__'

function abbr(name: string) {
  const words = name.split(/\s+/).filter((w) => !['of', 'in', 'and', 'the'].includes(w.toLowerCase()))
  const code = words.map((w) => w[0]?.toUpperCase() ?? '').join('')
  return code.slice(0, 6)
}

function programLabel(p: ProgramOption) {
  return p.program_code || abbr(p.program_name)
}

export default function ProgramBarChart({
  data,
  onProgramClick,
  onProgramDoubleTap,
  colors,
  programs,
  years,
  startYear,
  endYear,
  selectedProgramId,
  onProgramChange,
  onStartYearChange,
  onEndYearChange,
}: Props) {
  const [navigating, setNavigating] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const labels = useMemo(() => data.map((d) => d.program), [data])
  const counts = useMemo(() => data.map((d) => d.count), [data])
  const alignments = useMemo(() => data.map((d) => d.topAlignments), [data])
  const programIds = useMemo(() => data.map((d) => d.programId ?? null), [data])
  const palette = useMemo(() => ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(132, 204, 22, 0.8)', 'rgba(219, 39, 119, 0.8)'], [])
  const computedColors = useMemo(() => colors && colors.length === labels.length ? colors : labels.map((_, i) => palette[i % palette.length]), [colors, labels, palette])

  const minYear = years.length ? Math.min(...years) : startYear
  const maxYear = years.length ? Math.max(...years) : endYear

  // "All Time" is its own preset select, independent of the program filter.
  const timeRangeValue = useMemo(() => {
    if (startYear === minYear && endYear === maxYear) return 'all'
    if (endYear === maxYear && startYear === Math.max(minYear, maxYear - 4)) return '5y'
    if (endYear === maxYear && startYear === Math.max(minYear, maxYear - 2)) return '3y'
    return 'all'
  }, [startYear, endYear, minYear, maxYear])

  const applyTimeRange = (value: string) => {
    if (value === '5y') {
      onStartYearChange(Math.max(minYear, maxYear - 4))
      onEndYearChange(maxYear)
    } else if (value === '3y') {
      onStartYearChange(Math.max(minYear, maxYear - 2))
      onEndYearChange(maxYear)
    } else {
      onStartYearChange(minYear)
      onEndYearChange(maxYear)
    }
  }

  const onClickIndex = (index: number) => {
    const program = labels[index]
    const programId = programIds[index]
    if (onProgramClick) {
      onProgramClick(program, index)
      return
    }
    setNavigating(true)
    const params = new URLSearchParams()
    if (programId !== null && programId !== undefined) {
      params.append('programs[]', String(programId))
    } else {
      params.set('search', program)
    }
    router.visit(`/browse?${params.toString()}`, { preserveScroll: true, onFinish: () => setNavigating(false) })
  }

  const onDoubleTapIndex = (index: number) => {
    const program = labels[index]
    const programId = programIds[index]
    if (onProgramDoubleTap) {
      onProgramDoubleTap(programId, program, index)
      return
    }
    setNavigating(true)
    const params = new URLSearchParams()
    if (programId !== null && programId !== undefined) {
      params.append('programs[]', String(programId))
    } else {
      params.set('search', program)
    }
    router.visit(`/browse?${params.toString()}`, { preserveScroll: true, onFinish: () => setNavigating(false) })
  }

  const filterRow = (
    <div className="flex items-center gap-2">
      <Select value={timeRangeValue} onValueChange={applyTimeRange}>
        <SelectTrigger className="w-[140px] shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="5y">Last 5 Years</SelectItem>
          <SelectItem value="3y">Last 3 Years</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Open filters" className="shadow-none">
            <ListFilter className="size-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-filter">Program</Label>
              <Select
                value={selectedProgramId ? String(selectedProgramId) : ALL}
                onValueChange={(v) => onProgramChange(v === ALL ? null : parseInt(v, 10))}
              >
                <SelectTrigger id="program-filter" className="w-full shadow-none">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.program_id} value={String(p.program_id)} title={p.program_name}>
                      {p.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year Range</Label>
              <div className="flex items-center gap-2">
                <Select value={String(startYear)} onValueChange={(v) => onStartYearChange(parseInt(v, 10))}>
                  <SelectTrigger className="w-full shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground">to</span>

                <Select value={String(endYear)} onValueChange={(v) => onEndYearChange(parseInt(v, 10))}>
                  <SelectTrigger className="w-full shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <BarChart
      title="Research Count per Program"
      description={`${startYear}–${endYear}`}
      icon={<LayoutGrid className="size-4 text-[#0C234A] dark:text-white" />}
      labels={labels}
      counts={counts}
      alignments={alignments}
      onBarClick={onClickIndex}
      onBarDoubleTap={onDoubleTapIndex}
      isLoading={navigating}
      colors={computedColors}
      xAxisLabel="Program"
      yAxisLabel="Research Count"
      headerActions={filterRow}
      chartClassName="h-64 w-full sm:h-72 md:h-80 lg:h-[360px]"
    />
  )
}