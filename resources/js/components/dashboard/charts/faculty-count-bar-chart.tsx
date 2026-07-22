import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Same Chart.js building blocks the Faculty dashboard registers.
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  title: string
  description: string
  /** X-axis categories — one full faculty name per bar. */
  labels: string[]
  /** Y-axis values, index-aligned with {@link labels}. */
  counts: number[]
  /** Bar fill. */
  color: string
  /** Bar fill on hover (emphasis). */
  hoverColor: string
  /** Legend label for the single series, e.g. "Researches Advised". */
  legendLabel: string
  /** Faculty primary keys, index-aligned with {@link labels}. Enables click-through. */
  facultyIds?: Array<number | string>
  /** Which /research filter a bar click applies. Omit to disable click-through. */
  linkParam?: 'adviser' | 'panelist'
  emptyMessage?: string
}

/**
 * Single-series vertical bar chart of a per-faculty count, built on the same
 * react-chartjs-2 stack as the Faculty dashboard. Interactivity (hover tooltip,
 * hover emphasis, clickable legend to toggle the series, load animation, and
 * responsive resize) comes from Chart.js defaults. Faculty names are rotated on
 * the x-axis; with the full active-faculty list the plot is given a min-width
 * and the container scrolls horizontally so labels stay readable on narrow
 * screens. Clicking a bar (when linkParam is set) opens that faculty's filtered
 * research list.
 */
export default function FacultyCountBarChart({
  title,
  description,
  labels,
  counts,
  color,
  hoverColor,
  legendLabel,
  facultyIds,
  linkParam,
  emptyMessage = 'No faculty data available',
}: Props) {
  const hasData = labels.length > 0
  // ~40px per bar keeps rotated names legible; never narrower than the panel.
  const minWidth = Math.max(labels.length * 40, 320)

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels,
      datasets: [
        {
          label: legendLabel,
          data: counts,
          backgroundColor: color,
          hoverBackgroundColor: hoverColor,
          borderRadius: 4,
          maxBarThickness: 48,
        },
      ],
    }),
    [labels, counts, legendLabel, color, hoverColor],
  )

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      onClick: (_event, elements) => {
        if (!linkParam || !facultyIds || elements.length === 0) return
        const id = facultyIds[elements[0].index]
        if (id === undefined || id === null) return
        router.get('/research', { [linkParam]: id }, { preserveScroll: true })
      },
      onHover: (event, elements) => {
        const target = event.native?.target as HTMLElement | null
        if (target) target.style.cursor = linkParam && elements.length > 0 ? 'pointer' : 'default'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          // Left-aligned so it stays visible even when the chart is wider than
          // the panel and scrolls horizontally. Chart.js' default legend
          // onClick toggles this dataset on/off.
          align: 'start',
          labels: { usePointStyle: true, boxWidth: 8, padding: 16 },
        },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label ?? '',
            label: (item) => `${legendLabel}: ${item.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { autoSkip: false, maxRotation: 60, minRotation: 45, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }),
    [legendLabel, linkParam, facultyIds],
  )

  return (
    <Card className="shadow-sm">
      {/* Tighter bottom padding pulls the chart's legend up close to the
          subtitle. Chart.js' layout.padding.top is 0 and the legend sits at the
          canvas top, so this card spacing was the only excess gap above it. */}
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[320px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth, height: 320 }}>
              <Bar data={data} options={options} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
