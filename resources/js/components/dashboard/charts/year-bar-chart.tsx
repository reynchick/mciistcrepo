import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import BarChart from './bar-chart'

interface Alignment {
  label: string
  percentage: number
}

interface Datum {
  year: number
  count: number
  topAlignments: Alignment[]
}

interface Props { data: Datum[]; color?: string; tooltipTitlePrefix?: string; customTitle?: string; programId?: number }

export default function YearBarChart({ data, color, tooltipTitlePrefix, customTitle, programId }: Props) {
  const [navigating, setNavigating] = useState(false)
  const labels = useMemo(() => data.map((d) => String(d.year)), [data])
  const counts = useMemo(() => data.map((d) => d.count), [data])
  const alignments = useMemo(() => data.map((d) => d.topAlignments), [data])
  const colors = useMemo(() => labels.map(() => color ?? 'rgba(59, 130, 246, 0.8)'), [labels, color])

  const onClickIndex = (index: number) => {
    const year = parseInt(labels[index], 10)
    setNavigating(true)
    const params = new URLSearchParams()
    params.append('years[]', String(year))
    if (programId !== undefined && programId !== null) {
      params.append('programs[]', String(programId))
    }
    router.visit(`/browse?${params.toString()}`, { preserveScroll: true, onFinish: () => setNavigating(false) })
  }

  return (
    <BarChart
      title={customTitle || "Research Count per Year"}
      labels={labels}
      counts={counts}
      alignments={alignments}
      onBarClick={onClickIndex}
      isLoading={navigating}
      colors={colors}
      tooltipHeader={(label) => `${tooltipTitlePrefix ? tooltipTitlePrefix + ' ' : ''}${label}`}
      xAxisLabel="Year"
      yAxisLabel="Research Count"
    />
  )
}
