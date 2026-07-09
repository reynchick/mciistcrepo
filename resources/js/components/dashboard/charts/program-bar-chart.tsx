import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import BarChart from './bar-chart'

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

interface Props { data: Datum[]; onProgramClick?: (program: string, index: number) => void; onProgramDoubleTap?: (programId: number | null, program: string, index: number) => void; colors?: string[] }

export default function ProgramBarChart({ data, onProgramClick, onProgramDoubleTap, colors }: Props) {
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

  return (
    <BarChart
      title="Research Count per Program"
      labels={labels}
      counts={counts}
      alignments={alignments}
      onBarClick={onClickIndex}
      onBarDoubleTap={onDoubleTapIndex}
      isLoading={navigating}
      colors={computedColors}
      xAxisLabel="Program"
      yAxisLabel="Research Count"
    />
  )
}
