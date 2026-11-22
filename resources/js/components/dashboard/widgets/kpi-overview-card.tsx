import { Link } from '@inertiajs/react'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type FacultyStatsOverviewCardProps = {
  /** Total number of active faculty members */
  totalFaculty: number
  /** Total number of active research entries */
  totalResearch: number
  /** Pre-formatted last-updated string, e.g. "Jul 16, 2026 at 7:54 AM" */
  lastUpdated: string
  /** Pre-formatted timestamp of the most recently updated research, e.g. "Jul 16, 2026 at 7:54 AM". Falls back to lastUpdated. */
  recentResearchUpdated?: string
  /** Route to navigate to when the Total Faculty card is clicked, e.g. "/staff/faculty" */
  facultyHref: string
  /** Route to navigate to when the Total Research card is clicked, e.g. "/staff/research" */
  researchHref: string
  className?: string
}

// Same gradient card as the admin dashboard's "Total Research" card: borderless, no shadow.
// h-full so every card fills its grid cell and the gradient covers the whole card.
const statCardClasses =
  'relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-[#0B5CCB] via-[#0047AB] to-[#003B91] text-white shadow-none'

const linkClasses =
  'block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Splits a string like "Nov 22, 2026 at 3:01 PM" into its date and time parts
function parseStamp(value?: string) {
  if (!value || value === '—') return null
  const [datePart, timePart] = value.split(' at ')
  const parsed = new Date(datePart)
  if (Number.isNaN(parsed.getTime())) return null
  return { date: parsed, dateLabel: datePart, timeLabel: timePart ?? '' }
}

// Icon badge for the clickable KPI cards: neutral by default, white on the blue hover state
function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 group-hover:border-white/40 group-hover:text-white group-focus-visible:border-white/40 group-focus-visible:text-white group-active:border-white/40 group-active:text-white">
      {children}
    </span>
  )
}

// Clickable KPI card: no background by default, blue gradient fades in on hover / focus / click.
function KpiLinkCard({
  href,
  title,
  value,
  caption,
}: {
  href: string
  title: string
  value: number
  caption: string
}) {
  const hoverText = 'group-hover:text-white group-focus-visible:text-white group-active:text-white'
  const hoverCaption = 'group-hover:text-white/80 group-focus-visible:text-white/80 group-active:text-white/80'

  return (
    <Link href={href} className={cn(linkClasses, 'group')}>
      <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden border-0 bg-card text-foreground shadow-none">
        {/* Blue gradient overlay, only visible on hover / focus / press */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B5CCB] via-[#0047AB] to-[#003B91] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100"
        />
        <CardContent className="relative z-10 flex min-h-[184px] flex-1 flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <p className={cn('font-sans text-base font-bold text-foreground transition-colors duration-200', hoverText)}>
              {title}
            </p>
            <IconBadge>
              <ArrowUpRight className="size-4" />
            </IconBadge>
          </div>
          <p className={cn('text-4xl font-semibold leading-none tracking-tight text-foreground transition-colors duration-200', hoverText)}>
            {value.toLocaleString()}
          </p>
          <p className={cn('font-sans text-xs font-medium text-muted-foreground transition-colors duration-200', hoverCaption)}>
            {caption}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Three standalone KPI cards — Total Research, Total Faculty, Last Updated —
 * laid out side by side, all with the same blue gradient and the same size.
 * Total Research and Total Faculty are clickable links to their respective
 * management pages; the calendar card is informational only.
 */
export default function FacultyStatsOverviewCard({
  totalFaculty,
  totalResearch,
  lastUpdated,
  recentResearchUpdated,
  facultyHref,
  researchHref,
  className,
}: FacultyStatsOverviewCardProps) {
  const updated = parseStamp(lastUpdated)
  const research = parseStamp(recentResearchUpdated ?? lastUpdated)

  // Week strip (Sun–Sat) around the last-updated date; falls back to the current week
  const anchor = updated?.date ?? new Date()
  const weekStart = new Date(anchor)
  weekStart.setDate(anchor.getDate() - anchor.getDay())
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const monthLabel = updated
    ? `${anchor.toLocaleDateString('en-US', { month: 'short' })} ${anchor.getFullYear()}`
    : '—'

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Total Research -> manage research */}
      <KpiLinkCard href={researchHref} title="Total Research" value={totalResearch} caption="Active research entries" />

      {/* Total Faculty -> view faculty */}
      <KpiLinkCard href={facultyHref} title="Total Faculty" value={totalFaculty} caption="Active faculty members" />

      {/* Calendar-style card: month + week strip, one agenda row. Same blue gradient and size as the KPI cards. */}
      <Card className={cn(statCardClasses, 'cursor-default')} title={lastUpdated}>
        <CardContent className="flex min-h-[184px] flex-1 flex-col p-0">
          {/* Month + week strip */}
          <div className="px-4 pt-4">
            <p className="font-sans text-base font-bold leading-tight tracking-tight text-white">{monthLabel}</p>
            <div className="mt-2.5 grid grid-cols-7 text-center">
              {WEEKDAY_LETTERS.map((letter, i) => (
                <span key={i} className="font-sans text-[10px] font-medium text-white/70">
                  {letter}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 text-center">
              {week.map((d, i) => {
                const selected = updated !== null && i === anchor.getDay()
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full font-sans text-sm tabular-nums',
                        selected ? 'bg-white font-semibold text-[#0047AB] shadow-sm' : 'text-white/80',
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <span className={cn('size-[3px] rounded-full', selected ? 'bg-transparent' : 'bg-white/50')} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda sheet — single row */}
          <div className="mx-1.5 mb-1.5 mt-3 flex flex-1 flex-col justify-center rounded-2xl bg-white/15 px-4 py-2">
            <p className="truncate font-sans text-xs font-semibold leading-tight text-white">
              Most recent research updated
            </p>
            <p className="mt-0.5 truncate font-sans text-[11px] leading-tight text-white/80">
              {research
                ? `${research.timeLabel ? `${research.timeLabel} · ` : ''}${research.dateLabel}`
                : 'No updates yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}