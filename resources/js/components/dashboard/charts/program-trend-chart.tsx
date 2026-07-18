import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type ProgramOption = { program_id: number; program_name: string; program_code?: string | null }
type TrendPoint = { year: number; count: number }

type Props = {
  programs: ProgramOption[]
  defaultProgramId?: number | null
}

const chartConfig = {
  count: {
    label: 'Research Count',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

// Same fallback abbreviation logic used by the college-view bar chart, so
// codes stay consistent across the dashboard when program_code isn't set.
function abbr(name: string) {
  const words = name.split(/\s+/).filter((w) => !['of', 'in', 'and', 'the'].includes(w.toLowerCase()))
  const code = words.map((w) => w[0]?.toUpperCase() ?? '').join('')
  return code.slice(0, 6)
}

function programLabel(p: ProgramOption) {
  return p.program_code || abbr(p.program_name)
}

export default function ProgramTrendChart({ programs, defaultProgramId = null }: Props) {
  const [programId, setProgramId] = useState<number | null>(
    defaultProgramId ?? programs[0]?.program_id ?? null,
  )
  const [data, setData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (defaultProgramId) setProgramId(defaultProgramId)
  }, [defaultProgramId])

  useEffect(() => {
    if (!programId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/dashboard/programs/${programId}/trend`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load trend data')
        return res.json()
      })
      .then((json: { data: TrendPoint[] }) => {
        // Data comes pre-sorted by year from the backend, but sort
        // defensively here since the trend math below depends on it.
        const sorted = [...(json.data ?? [])].sort((a, b) => a.year - b.year)
        if (!cancelled) setData(sorted)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [programId])

  const selectedProgram = useMemo(
    () => programs.find((p) => p.program_id === programId) ?? null,
    [programs, programId],
  )

  // Compares the two most recent years that actually have research
  // records. Because the dataset only contains years with data, the
  // last two points aren't guaranteed to be consecutive years (e.g. a
  // program with entries in 2020 and then nothing until 2023) — so the
  // description names the real years and, when there's a gap, says so
  // explicitly instead of implying "last year vs this year".
  const trend = useMemo(() => {
    if (data.length < 2) return null

    const current = data[data.length - 1]
    const previous = data[data.length - 2]

    if (previous.count === 0) return null

    const pct = ((current.count - previous.count) / previous.count) * 100
    const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
    const yearGap = current.year - previous.year
    const isConsecutive = yearGap === 1

    return {
      pct,
      direction,
      currentYear: current.year,
      previousYear: previous.year,
      isConsecutive,
    } as const
  }, [data])

  return (
    <Card className="h-full flex flex-col shadow-sm border hover:shadow-md transition-shadow">
      <CardHeader className="pb-1.5 pt-3 px-4 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold">Research Trend</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {selectedProgram ? selectedProgram.program_name : 'Select a program'} • all years
          </CardDescription>
        </div>
        <Select
          value={programId ? String(programId) : undefined}
          onValueChange={(v) => setProgramId(parseInt(v, 10))}
        >
          <SelectTrigger className="h-9 w-[110px] text-sm">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.program_id} value={String(p.program_id)}>
                {programLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0 px-4 flex-1">
        {loading && (
          <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
            Loading…
          </div>
        )}
        {!loading && error && (
          <div className="flex h-[220px] items-center justify-center text-sm text-red-500">
            {error}
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
            No data available.
          </div>
        )}
        {!loading && !error && data.length > 0 && (() => {
          const maxCount = Math.max(...data.map((d) => d.count), 0)
          // Give the line some headroom so peaks don't touch/clip the top
          // edge once counts reach 3+; below that the tight domain is fine.
          const yMax = maxCount >= 3 ? maxCount + Math.ceil(maxCount * 0.2) : undefined
          const topMargin = maxCount >= 3 ? 20 : 12

          return (
            <ChartContainer config={chartConfig} className="max-h-[220px] w-full">
              <LineChart accessibilityLayer data={data} margin={{ top: topMargin, left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide domain={[0, yMax ?? 'auto']} allowDecimals={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      hideIndicator
                      formatter={(value) => `Research Count: ${value}`}
                    />
                  }
                />
                <Line
                  dataKey="count"
                  type="monotone"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )
        })()}
      </CardContent>
      {trend && (
        <CardFooter className="pt-0 px-4 pb-3">
          <div className="flex items-center gap-2 text-sm leading-none font-medium">
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
            {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend.direction === 'flat' && <Minus className="h-4 w-4 text-slate-400" />}
            <span>
              {trend.direction === 'up' ? 'Trending up' : trend.direction === 'down' ? 'Trending down' : 'Flat'} by{' '}
              {Math.abs(trend.pct).toFixed(1)}%{' '}
              {trend.isConsecutive
                ? 'vs previous year'
                : `vs ${trend.previousYear} (${trend.currentYear - trend.previousYear}-year gap)`}
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}