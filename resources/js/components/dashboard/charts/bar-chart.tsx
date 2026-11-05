import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
  icon?: ReactNode // NEW: small badge rendered to the left of the title
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
  headerActions?: ReactNode
  chartClassName?: string // NEW: lets callers override the default height
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

// Segmented progress bar (10 segments)
const SEGMENTS = 10

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
            className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-slate-200 dark:bg-slate-700"
          >
            <div className="h-full bg-[#2E6B3A]" style={{ width: `${fill}%` }} />
          </div>
        )
      })}
    </div>
  )
}

// Size used to place the tooltip next to the hovered bar
const TOOLTIP_W = 250
const TOOLTIP_H = 270
const TOOLTIP_GAP = 12

// Anchored to the hovered bar. It does not follow the cursor; it stays put
// while you hover the same bar and moves only when you hover another bar.
function TopFiveTooltip({
  item,
  tooltipHeader,
  left,
  top,
}: {
  item: ChartDatum
  tooltipHeader?: (label: string, index: number) => string
  left: number
  top: number
}) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
      style={{ left, top, width: TOOLTIP_W }}
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

              <div className="mt-1">
                <SegmentedBar percentage={percentage} />
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
  icon, // NEW
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
  headerActions,
  chartClassName, // NEW
}: Props) {
  const [ready, setReady] = useState(false)
  const [isSmall, setIsSmall] = useState(false)
  const [lastTap, setLastTap] = useState<{
    time: number
    index: number | null
  }>({ time: 0, index: null })
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<{ index: number; left: number; top: number } | null>(null)

  // Place the tooltip beside the hovered bar (right side, or left if there is no room),
  // aligned with the top of the bar and kept inside the chart area.
  const anchorToBar = (index: number, e: React.MouseEvent) => {
    const wrap = wrapRef.current
    const bar = (e.currentTarget as Element | null)?.getBoundingClientRect()
    if (!wrap || !bar) return
    const box = wrap.getBoundingClientRect()

    const barLeft = bar.left - box.left
    const barRight = bar.right - box.left
    const barTop = bar.top - box.top

    const fitsRight = barRight + TOOLTIP_GAP + TOOLTIP_W <= box.width
    const left = fitsRight
      ? barRight + TOOLTIP_GAP
      : Math.max(0, barLeft - TOOLTIP_GAP - TOOLTIP_W)
    const top = Math.max(0, Math.min(barTop, box.height - TOOLTIP_H))

    setHovered({ index, left, top })
  }

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
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              {icon}
            </div>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {headerActions}
      </CardHeader>
      <CardContent>
        <div ref={wrapRef} className="relative">
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
            className={chartClassName ?? 'h-80 w-full sm:h-96 md:h-[400px] lg:h-[450px]'}
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
                    onMouseEnter={(e: React.MouseEvent) => anchorToBar(item.index, e)}
                    onMouseLeave={() => setHovered(null)}
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        )}

        {hovered && chartData[hovered.index] && (
          <TopFiveTooltip
            item={chartData[hovered.index]}
            tooltipHeader={tooltipHeader}
            left={hovered.left}
            top={hovered.top}
          />
        )}
        </div>
      </CardContent>
    </Card>
  )
}