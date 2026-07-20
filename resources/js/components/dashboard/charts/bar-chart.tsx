import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

interface AlignmentItem {
  label: string
  percentage: number
}

interface Props {
  title: string
  description?: string
  labels: string[]
  counts: number[]
  alignments: AlignmentItem[][]
  onBarClick?: (index: number) => void
  onBarDoubleTap?: (index: number) => void
  isLoading?: boolean
  emptyMessage?: string
  colors?: string[]
  tooltipHeader?: (label: string, index: number) => string
  xAxisLabel?: string
  yAxisLabel?: string
}

type ChartDatum = {
  label: string
  count: number
  color: string
  alignments: AlignmentItem[]
  index: number
}

const chartConfig = {
  count: {
    label: 'Research Count',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function TopFiveTooltip({
  item,
  tooltipHeader,
  x,
  y,
}: {
  item: ChartDatum
  tooltipHeader?: (label: string, index: number) => string
  x: number
  y: number
}) {
  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[240px] rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
      style={{ left: x + 14, top: y + 14 }}
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {tooltipHeader ? tooltipHeader(item.label, item.index) : item.label}
      </p>

      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Total research:{' '}
        <span className="font-semibold text-slate-900 dark:text-white">
          {item.count}
        </span>
      </p>

      <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Top 5 Research Alignments
        </p>

        {item.alignments.slice(0, 5).map((research, index) => {
          const percentage = Math.max(0, Math.min(100, Math.round(research.percentage)))

          return (
            <div key={`${research.label}-${index}`} className="mb-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="max-w-[175px] truncate font-medium text-slate-700 dark:text-slate-200">
                  {research.label}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {percentage}%
                </span>
              </div>

              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}

        {item.alignments.length === 0 && (
          <p className="text-xs text-slate-500">No research details available.</p>
        )}
      </div>
    </div>
  )
}

export default function BarChart({
  title,
  description,
  labels,
  counts,
  alignments,
  onBarClick,
  onBarDoubleTap,
  isLoading = false,
  emptyMessage = 'No data available',
  colors,
  tooltipHeader,
  xAxisLabel,
  yAxisLabel,
}: Props) {
  const [ready, setReady] = useState(false)
  const [isSmall, setIsSmall] = useState(false)
  const [lastTap, setLastTap] = useState<{
    time: number
    index: number | null
  }>({ time: 0, index: null })
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null)

  useEffect(() => {
    setReady(true)

    const updateScreenSize = () => setIsSmall(window.innerWidth < 768)

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)

    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const hasData = labels.length > 0 && counts.length > 0

  const chartData = useMemo<ChartDatum[]>(
    () =>
      labels.map((label, index) => ({
        label,
        count: counts[index] ?? 0,
        color: colors?.[index] ?? 'var(--chart-1)',
        alignments: alignments[index] ?? [],
        index,
      })),
    [alignments, colors, counts, labels],
  )

  const handleBarClick = (index: number) => {
    const now = Date.now()

    if (isSmall && lastTap.index === index && now - lastTap.time < 500) {
      setLastTap({ time: 0, index: null })
      ;(onBarDoubleTap ?? onBarClick)?.(index)
      return
    }

    setLastTap({ time: now, index })

    if (!isSmall) {
      onBarClick?.(index)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        {isLoading || !ready ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : !hasData ? (
          <div className="py-12 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full sm:h-96 md:h-[400px] lg:h-[450px]"
          >
            <RechartsBarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 8 }}
            >
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={isSmall ? 'preserveStartEnd' : 0}
                angle={isSmall ? -45 : 0}
                textAnchor={isSmall ? 'end' : 'middle'}
                height={isSmall ? 64 : 40}
                label={
                  xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: 'insideBottom',
                        offset: -12,
                      }
                    : undefined
                }
              />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  label={
                    yAxisLabel
                      ? {
                          value: yAxisLabel,
                          angle: -90,
                          position: 'insideLeft',
                          offset: 8,
                          style: {
                            textAnchor: 'middle'
                          },
                        }
                      : undefined
                  }
                />
              <Bar
                dataKey="count"
                radius={8}
                maxBarSize={60}
                onClick={(_, index) => handleBarClick(index)}
              >
                {chartData.map((item) => (
                  <Cell
                    key={`${item.label}-${item.index}`}
                    fill={item.color}
                    onMouseEnter={(e: React.MouseEvent) =>
                      setHovered({ index: item.index, x: e.clientX, y: e.clientY })
                    }
                    onMouseMove={(e: React.MouseEvent) =>
                      setHovered({ index: item.index, x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHovered(null)}
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        )}
      </CardContent>

      {hovered && (
        
        <TopFiveTooltip
          item={chartData[hovered.index]}
          tooltipHeader={tooltipHeader}
          x={hovered.x}
          y={hovered.y}
        />
      )}
    </Card>
  )
}