import { useMemo } from 'react'
import { router } from '@inertiajs/react'
import { Cell, Pie, PieChart } from 'recharts'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Props {
  title: string
  /** Optional subtext shown under the title, e.g. "Faculty with the most advised research". */
  description?: string
  /** Faculty full names — one per row/slice, already limited to top N. */
  labels: string[]
  /** Counts, index-aligned with {@link labels}. */
  counts: number[]
  /** Faculty primary keys, index-aligned with {@link labels}. Enables click-through. */
  facultyIds?: Array<number | string>
  /** Which /research filter a row click applies. Omit to disable click-through. */
  linkParam?: 'adviser' | 'panelist'
  /** Header label for the count column, e.g. "Research Advised". */
  countLabel: string
  emptyMessage?: string
  /** Years available for the year-filter dropdown. Omit/empty hides the dropdown. */
  years?: number[]
  /** Currently selected year, or 'all' for no filter. */
  selectedYear?: number | 'all'
  /** Called when the user picks a year from the dropdown. */
  onYearChange?: (year: number | 'all') => void
  /**
   * Color set cycled through per faculty row, shared by the pie slices and
   * avatar backgrounds. Defaults to DEFAULT_PALETTE. Pass a distinct set
   * per card instance (e.g. advisers vs panelists) so sibling cards read
   * as visually separate at a glance — see PALETTE_TEAL / PALETTE_AMBER /
   * PALETTE_VIOLET exported below for ready-made alternates.
   */
  palette?: string[]
}

/** Default palette (teal/navy) — used when no `palette` prop is passed. */
const DEFAULT_PALETTE = ['#4EBDAC', '#9FE8DD', '#4F7053', '#23568D', '#143143']

/** Ready-made alternates so sibling Top-5 cards can each get their own look. */
export const PALETTE_TEAL = DEFAULT_PALETTE
export const PALETTE_AMBER = ['#F2B84B', '#F7DA9E', '#B8863B', '#8C4E2A', '#4A2A17']
export const PALETTE_VIOLET = ['#8B7FD6', '#C9C2EE', '#5A4E9E', '#3B2E70', '#231A47']
/** Panelist palette — light-to-deep blue range, for the "Top 5 Panelists" card. */
export const PALETTE_PANELIST = ['#B9D6F2', '#061A40', '#0353A4', '#006DAA', '#003559']

function buildChartConfig(labels: string[], palette: string[]): ChartConfig {
  return labels.reduce((config, name, i) => {
    config[name] = { label: name, color: palette[i % palette.length] }
    return config
  }, {} as ChartConfig)
}

/** "Sarah Johnson" -> "SJ", "Hobert A. Abrigana" -> "HA" (first + last initial). */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Picks readable text (dark slate or white) against a given hex background, since the palette mixes light and dark swatches. */
function getContrastText(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness >= 150 ? '#0f172a' : '#ffffff'
}

/** Renders the count value centered inside the donut ring for its slice (halfway between inner and outer radius), instead of recharts' default outside-the-slice placement. Text color auto-contrasts against the slice's fill. */
function renderInsideLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value, fill, payload } = props
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) / 2
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const sliceColor = fill ?? payload?.fill ?? '#143143'

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={getContrastText(sliceColor)}
      fontSize={13}
      fontWeight={600}
    >
      {value}
    </text>
  )
}

/**
 * Single card combining the pie-chart breakdown (value labels centered
 * inside each slice, tooltip shows name and value with a real gap between
 * them) and a ranked Top-5 table for one metric (advised or paneled
 * research). Row text de-emphasizes the name and emphasizes the count,
 * with explicit slate shades so both stay legible in light mode as well
 * as dark. The year-filter dropdown trigger is a pill button with a
 * calendar icon; its menu slides in from the left with a "Filter by
 * year" label above the year options. Palette color lives on each row's
 * initials avatar, keeping the pie and table visually linked through
 * color alone. Avatar and slice label text auto-contrast against their
 * background since the palette includes both light and dark swatches.
 * The color set itself is configurable per instance via the `palette`
 * prop, so sibling cards (e.g. advisers vs panelists) can each use a
 * different set of colors instead of sharing one.
 */
export default function TopFacultyCard({
  title,
  description,
  labels,
  counts,
  facultyIds,
  linkParam,
  countLabel,
  emptyMessage = 'No faculty data available',
  years,
  selectedYear = 'all',
  onYearChange,
  palette = DEFAULT_PALETTE,
}: Props) {
  const pieData = useMemo(
    () =>
      labels.map((name, i) => ({
        faculty: name,
        count: counts[i] ?? 0,
        fill: palette[i % palette.length],
      })),
    [labels, counts, palette],
  )
  const chartConfig = useMemo(() => buildChartConfig(labels, palette), [labels, palette])

  const rows = useMemo(
    () =>
      labels.map((name, i) => ({
        name,
        count: counts[i] ?? 0,
        facultyId: facultyIds?.[i],
        fill: palette[i % palette.length],
        rank: i + 1,
      })),
    [labels, counts, facultyIds, palette],
  )

  const hasData = rows.some((r) => r.count > 0)

  const handleRowClick = (facultyId?: number | string) => {
    if (!linkParam || facultyId === undefined || facultyId === null) return
    router.get('/research', { [linkParam]: facultyId }, { preserveScroll: true })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-slate-900 dark:text-foreground">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          {years && years.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full px-4 text-sm">
                  <CalendarDays className="h-5 w-5" />
                  {selectedYear !== 'all' ? selectedYear : 'All Years'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="data-open:slide-in-from-left-20 data-open:zoom-in-100 data-open:data-[side=bottom]:slide-in-from-top-0 data-open:data-[side=top]:slide-in-from-bottom-0 data-closed:slide-out-to-left-20 data-closed:zoom-out-100 w-48 duration-400"
              >
                <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onYearChange?.('all')} className="px-3 py-1.5">
                  All Years
                </DropdownMenuItem>
                {years.map((year) => (
                  <DropdownMenuItem key={year} onClick={() => onYearChange?.(year)} className="px-3 py-1.5">
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <ChartContainer config={chartConfig} className="mx-auto h-[220px] w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span>{item.payload.faculty}</span>
                          <span className="font-semibold tabular-nums">{value}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="faculty"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  cornerRadius={8}
                  label={renderInsideLabel}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.faculty} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
                  <th className="w-3/4 py-2 pl-1 text-left font-medium">Faculty</th>
                  <th className="w-1/4 py-2 pr-1 text-center font-medium">{countLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.facultyId ?? row.name}
                    onClick={() => handleRowClick(row.facultyId)}
                    className={`border-b last:border-b-0 transition-colors ${linkParam ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  >
                    <td className="py-3 pl-1 pr-4 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {row.rank}
                        </span>
                        <span
                          className="flex size-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ backgroundColor: row.fill, color: getContrastText(row.fill) }}
                        >
                          {getInitials(row.name)}
                        </span>
                        <p className="min-w-0 truncate font-normal text-slate-600 dark:text-muted-foreground">
                          {row.name}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-1 text-center text-base font-bold text-slate-900 tabular-nums dark:text-foreground">
                      {row.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}