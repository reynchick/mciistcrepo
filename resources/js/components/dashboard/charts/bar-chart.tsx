import { useMemo, useRef, useState, useEffect } from 'react'
import type { MouseEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bar, getElementAtEvent } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type ChartInstance = ChartJS<'bar', number[], string> | undefined

interface AlignmentItem { label: string; percentage: number }

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

export default function BarChart({ title, description, labels, counts, alignments, onBarClick, onBarDoubleTap, isLoading = false, emptyMessage = 'No data available', colors, tooltipHeader, xAxisLabel, yAxisLabel }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartInstance>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const [tapIdx, setTapIdx] = useState<number | null>(null)
  const [tapPos, setTapPos] = useState<{ x: number; y: number } | null>(null) // chart-relative position
  const [tapScreenPos, setTapScreenPos] = useState<{ x: number; y: number } | null>(null) // absolute screen position for overlay
  const [lastTap, setLastTap] = useState<{ time: number; idx: number | null }>({ time: 0, idx: null })

  const [isSmall, setIsSmall] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsSmall(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const hasData = labels.length > 0 && counts.length > 0
  const DOUBLE_TAP_MS = 500

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors && colors.length === labels.length ? colors : labels.map(() => 'rgba(59, 130, 246, 0.8)'),
        hoverBackgroundColor: colors && colors.length === labels.length ? colors : labels.map(() => 'rgba(37, 99, 235, 0.9)'),
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.85,
      },
    ],
  }), [labels, counts, colors])

  const externalTooltipHandler = (ctx: any) => {
    const { chart, tooltip } = ctx
    // Don't show hover tooltip on mobile/tablet (they should use tap tooltip)
    if (isSmall) {
      const tooltipEl = (chart?.canvas?.parentNode as HTMLElement)?.querySelector('div.chartjs-tooltip') as HTMLDivElement | null
      if (tooltipEl) tooltipEl.style.opacity = '0'
      return
    }
    // Don't show hover tooltip if a tap tooltip is already showing
    if (tapIdx !== null) {
      const tooltipEl = (chart?.canvas?.parentNode as HTMLElement)?.querySelector('div.chartjs-tooltip') as HTMLDivElement | null
      if (tooltipEl) tooltipEl.style.opacity = '0'
      return
    }
    if (!chart?.canvas || !chart.canvas.parentNode) return
    let tooltipEl = (chart.canvas.parentNode as HTMLElement).querySelector('div.chartjs-tooltip') as HTMLDivElement | null
    if (!tooltipEl) {
      tooltipEl = document.createElement('div')
      tooltipEl.className = 'chartjs-tooltip'
      tooltipEl.style.position = 'absolute'
      tooltipEl.style.background = 'white'
      tooltipEl.style.border = '1px solid #e5e7eb'
      tooltipEl.style.borderRadius = '6px'
      tooltipEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      tooltipEl.style.padding = '8px 10px'
      tooltipEl.style.pointerEvents = 'none'
      tooltipEl.style.transform = 'translate(-50%, -100%)'
      tooltipEl.style.transition = 'all 150ms ease'
      ;(chart.canvas.parentNode as HTMLElement).appendChild(tooltipEl)
    }
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0'
      return
    }
    const index = tooltip.dataPoints?.[0]?.dataIndex ?? 0
    const name = tooltipHeader ? tooltipHeader(labels[index], index) : labels[index]
    const total = counts[index]
    const items: AlignmentItem[] = alignments[index] || []
    
    // Clear previous content safely
    tooltipEl.innerHTML = ''
    
    // Create root container
    const rootDiv = document.createElement('div')
    rootDiv.style.display = 'flex'
    rootDiv.style.flexDirection = 'column'
    rootDiv.style.gap = '6px'
    
    // Add header
    const headerDiv = document.createElement('div')
    headerDiv.style.fontWeight = '600'
    headerDiv.style.color = '#111827'
    headerDiv.textContent = String(name)
    rootDiv.appendChild(headerDiv)
    
    // Add total
    const totalDiv = document.createElement('div')
    totalDiv.style.color = '#374151'
    totalDiv.textContent = `Total: ${total}`
    rootDiv.appendChild(totalDiv)
    
    // Add items container
    const itemsContainer = document.createElement('div')
    itemsContainer.style.marginTop = '6px'
    itemsContainer.style.display = 'flex'
    itemsContainer.style.flexDirection = 'column'
    itemsContainer.style.gap = '6px'
    
    items.slice(0, 5).forEach((a) => {
      const pct = Math.max(0, Math.min(100, Math.round(a.percentage)))
      
      // Item row
      const itemRow = document.createElement('div')
      itemRow.style.display = 'flex'
      itemRow.style.justifyContent = 'space-between'
      itemRow.style.gap = '8px'
      itemRow.style.alignItems = 'center'
      
      const labelSpan = document.createElement('span')
      labelSpan.style.color = '#4b5563'
      labelSpan.style.fontWeight = '600'
      labelSpan.style.fontSize = '12px'
      labelSpan.textContent = a.label
      
      const pctSpan = document.createElement('span')
      pctSpan.style.padding = '2px 6px'
      pctSpan.style.borderRadius = '10px'
      pctSpan.style.background = '#f3f4f6'
      pctSpan.style.color = '#374151'
      pctSpan.style.fontSize = '11px'
      pctSpan.textContent = `${pct}%`
      
      itemRow.appendChild(labelSpan)
      itemRow.appendChild(pctSpan)
      itemsContainer.appendChild(itemRow)
      
      // Progress bar
      const barContainer = document.createElement('div')
      barContainer.style.height = '6px'
      barContainer.style.width = '100%'
      barContainer.style.background = '#e5e7eb'
      barContainer.style.borderRadius = '6px'
      barContainer.style.overflow = 'hidden'
      
      const barFill = document.createElement('div')
      barFill.style.height = '6px'
      barFill.style.width = `${pct}%`
      barFill.style.background = '#9ca3af'
      barContainer.appendChild(barFill)
      itemsContainer.appendChild(barContainer)
    })
    
    rootDiv.appendChild(itemsContainer)
    tooltipEl.appendChild(rootDiv)
    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas
    tooltipEl.style.opacity = '1'
    tooltipEl.style.left = positionX + tooltip.caretX + 'px'
    tooltipEl.style.top = positionY + tooltip.caretY + 'px'
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    layout: { padding: { top: isSmall ? 28 : 40, right: isSmall ? 8 : 20, bottom: isSmall ? 48 : 60, left: isSmall ? 8 : 40 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.92)',
          font: { size: isSmall ? 10 : 12, weight: '600' },
          maxRotation: isSmall ? 45 : 0,
          minRotation: isSmall ? 45 : 0,
          autoSkip: isSmall,
          padding: isSmall ? 10 : 12,
          callback: (v: unknown) => {
            const index = Number(v)
            const label = labels[index] ?? String(v)
            const s = String(label)
            const limit = isSmall ? 8 : 18
            return s.length > limit ? s.slice(0, limit - 1) + '…' : s
          },
        },
        ...(xAxisLabel ? {
          title: {
            display: true,
            text: xAxisLabel,
            font: { size: 13, weight: 'bold' },
            color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.92)',
            padding: { top: 8 },
          },
        } : {}),
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.92)',
          font: { size: isSmall ? 11 : 12 },
        },
        grid: {
          color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
        },
        ...(yAxisLabel ? {
          title: {
            display: true,
            text: yAxisLabel,
            font: { size: 13, weight: 'bold' },
            color: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.92)',
            padding: { right: 8 },
          },
        } : {}),
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
      title: { display: false },
    },
    datasets: {
      bar: {
        maxBarThickness: isSmall ? 40 : 60,
        minBarLength: 2,
      },
    },
  } as any

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current
    if (!chart) return
    const elems = getElementAtEvent(chart, event)
    if (!elems || elems.length === 0) return
    const idx = elems[0].index
    const meta = chart.getDatasetMeta(0)
    const el: any = meta?.data?.[idx]
    const pos = el ? { x: el.x, y: el.y } : { x: (event as any).nativeEvent.offsetX ?? 0, y: (event as any).nativeEvent.offsetY ?? 0 }
    const canvasRect = (chartRef.current?.canvas as HTMLCanvasElement | undefined)?.getBoundingClientRect()
    const absPos = canvasRect ? { x: canvasRect.left + pos.x, y: canvasRect.top + pos.y } : pos
    const now = Date.now()
    if (lastTap.idx === idx && now - lastTap.time < DOUBLE_TAP_MS) {
      // Double tap detected - navigate
      setTapIdx(null)
      setTapPos(null)
      setTapScreenPos(null)
      if (onBarDoubleTap) {
        onBarDoubleTap(idx)
      } else {
        // Fallback to onBarClick if no double tap handler
        onBarClick?.(idx)
      }
      setLastTap({ time: 0, idx: null })
      return
    }
    // Single tap - only show tooltip on mobile, navigate on desktop
    setLastTap({ time: now, idx: idx })
    setTapIdx(idx)
    setTapPos(pos)
    setTapScreenPos(absPos)
    // Only call onBarClick on desktop (where tooltip isn't the primary interaction)
    if (!isSmall) {
      onBarClick?.(idx)
    }
  }

  return (
    <Card ref={cardRef} className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description && <CardDescription className="text-sm mt-1">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : !ready ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : !hasData ? (
          <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="relative h-80 sm:h-96 md:h-[400px] lg:h-[450px]">
            <Bar ref={chartRef} data={chartData} options={options} onClick={handleClick} />
            {tapIdx !== null && tapPos && tapScreenPos && (
              <div className="fixed inset-0 z-40 sm:hidden pointer-events-none">
                <div
                  className="absolute rounded-md border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg pointer-events-auto"
                  style={{
                    left: Math.max(12, tapScreenPos.x),
                    top: Math.max(12, tapScreenPos.y - 12),
                    transform: 'translate(-50%, -115%)',
                    width: 'min(280px, 90vw)',
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                    <div className="font-semibold text-sm">{tooltipHeader ? tooltipHeader(labels[tapIdx], tapIdx) : labels[tapIdx]}</div>
                    <button
                      onClick={() => { setTapIdx(null); setTapPos(null); setTapScreenPos(null) }}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-semibold"
                      aria-label="Close tooltip"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-3 text-sm space-y-3">
                    <div className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{counts[tapIdx]}</span></div>
                    {((alignments[tapIdx] as AlignmentItem[] | undefined) ?? []).slice(0, 3).map((a: AlignmentItem, i: number) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{a.label}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold">{Math.max(0, Math.min(100, Math.round(a.percentage)))}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-800">
                          <div className="h-1.5 rounded bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, Math.round(a.percentage)))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
