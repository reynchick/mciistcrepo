import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import BarChart from './bar-chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const labels = useMemo(() => data.map((d) => d.program), [data])
  const counts = useMemo(() => data.map((d) => d.count), [data])
  const alignments = useMemo(() => data.map((d) => d.topAlignments), [data])
  const programIds = useMemo(() => data.map((d) => d.programId ?? null), [data])
  const palette = useMemo(() => ['rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(132, 204, 22, 0.8)', 'rgba(219, 39, 119, 0.8)'], [])
  const computedColors = useMemo(() => colors && colors.length === labels.length ? colors : labels.map((_, i) => palette[i % palette.length]), [colors, labels, palette])

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
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={selectedProgramId ? String(selectedProgramId) : ALL}
        onValueChange={(v) => onProgramChange(v === ALL ? null : parseInt(v, 10))}
      >
        <SelectTrigger className="h-9 w-[110px] text-xs sm:text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.program_id} value={String(p.program_id)} title={p.program_name}>
              {programLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(startYear)} onValueChange={(v) => onStartYearChange(parseInt(v, 10))}>
        <SelectTrigger className="h-9 w-[84px] text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-slate-400">–</span>

      <Select value={String(endYear)} onValueChange={(v) => onEndYearChange(parseInt(v, 10))}>
        <SelectTrigger className="h-9 w-[84px] text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <BarChart
      title="Research Count per Program"
      description={`${startYear}–${endYear}`}
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