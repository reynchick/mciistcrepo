import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

export type AvatarPerson = { initials: string; tone: string }

export type StatCardConfig = {
  id: string
  label: string
  value: number
  icon: LucideIcon
  tone: string
  active: boolean
  onClick: () => void
  people?: AvatarPerson[]
}

// The ring is completely filled at 100 users (or more)
const RING_CAP = 100

// The blue used by the users table. This is the color a card turns into when
// hovered or selected. Change it here to change it everywhere in this file.
const TABLE_BLUE = '#00296B'

// Soft, light ring colors from the "Blue Serenity" palette. Used instead of
// plain white so the ring keeps a tinted, on-brand look when a role card is
// hovered or selected (against the blue overlay).
const HOVER_TRACK_COLOR = '#B6CCFE'
const HOVER_ARC_COLOR = '#EDF2FB'

// CSS custom properties so the same hex values drive both the "highlighted"
// (selected) state and the CSS-only ":hover" state.
const paletteVars = {
  ['--ring-hover-track' as string]: HOVER_TRACK_COLOR,
  ['--ring-hover-arc' as string]: HOVER_ARC_COLOR,
} as React.CSSProperties

// Circular progress ring: gray track, teal rounded arc, the count in the center.
// The arc starts at the bottom-left and sweeps clockwise up to 270° at 100%.
function RingProgress({
  value,
  size = 40,
  stroke = 4,
  highlightOnHover = false,
  highlighted = false,
}: {
  value: number
  size?: number
  stroke?: number
  highlightOnHover?: boolean
  highlighted?: boolean
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0) / RING_CAP, 1)
  const arc = circumference * 0.75 * progress
  const center = size / 2

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn(
            'stroke-muted transition-colors duration-300',
            highlightOnHover && 'group-hover:stroke-[var(--ring-hover-track)]',
            highlighted && 'stroke-[var(--ring-hover-track)]'
          )}
          style={paletteVars}
        />
        {arc > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
            transform={`rotate(135 ${center} ${center})`}
            className={cn(
              'stroke-teal-600 transition-[stroke-dasharray,stroke] duration-500 ease-out dark:stroke-teal-400',
              highlightOnHover && 'group-hover:stroke-[var(--ring-hover-arc)]',
              highlighted && 'stroke-[var(--ring-hover-arc)]'
            )}
            style={paletteVars}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center leading-none">
        {/* Must switch to white on hover/selected — otherwise the dark text
            sits on the blue card overlay and becomes unreadable. */}
        <span
          className={cn(
            'text-sm font-bold tabular-nums transition-colors duration-300',
            highlightOnHover && 'group-hover:text-white',
            highlighted && 'text-white'
          )}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

/**
 * The stat/filter cards row shown above the users table (Active, Deleted,
 * Administrator, Faculty, MCIIS Staff, Student). Pure presentational —
 * the parent builds `cards` (values, click handlers, active state) and this
 * component only renders them.
 */
export default function UserStatCards({ cards, isAdmin }: { cards: StatCardConfig[]; isAdmin: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1.15fr_1.15fr_1fr_1fr]">
      {cards.map((card) => {
        const isLarge = card.id === 'active' || card.id === 'deleted'
        return (
          <Card
            key={card.id}
            role="button"
            tabIndex={0}
            aria-pressed={card.active}
            onClick={card.onClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                card.onClick()
              }
            }}
            className={cn(
              'group relative cursor-pointer overflow-hidden border border-border bg-card shadow-xs transition-colors duration-300 ease-out hover:bg-muted/50',
              'focus-visible:outline-none focus-visible:ring-0',
              // Active / Deleted keep the original corner; role cards are rounder
              isLarge ? 'rounded-lg' : 'rounded-[2rem]',
              // Tall cards span both rows on desktop
              isLarge && 'lg:row-span-2',
              // Non-admins have no Deleted card, so Active takes its space too
              card.id === 'active' && !isAdmin && 'lg:col-span-2'
            )}
          >
            {/* Table-blue fill of the selected/hovered card. This is an
                absolutely positioned overlay, so every piece of content painted
                on top of it MUST also be positioned (e.g. via `relative`) or it
                will be stacked *underneath* this overlay per CSS stacking rules. */}
            <span
              aria-hidden="true"
              style={{ backgroundColor: TABLE_BLUE }}
              className={cn(
                'pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out',
                card.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            />
            {isLarge ? (
              /* Compact big card: title, big number, and caption */
              <CardContent className="relative flex h-full min-h-0 flex-col justify-between gap-1 px-3.5 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-base font-semibold transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                    {card.label}
                  </p>
                </div>
                <p className={cn('text-3xl font-bold leading-none tabular-nums transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                  {card.value}
                </p>
                <div className="flex items-center gap-2">
                  <p className={cn('text-xs transition-colors duration-300 group-hover:text-white/80', card.active ? 'text-white/80' : 'text-muted-foreground')}>
                    {card.id === 'active' ? 'Can sign in' : 'Can be restored'}
                  </p>
                </div>
              </CardContent>
            ) : (
              /* Small card: label + "2 users" text on the left, progress ring (number only) on the right. */
              <CardContent
                className={cn(
                  // px-4 (was px-3) so content clears the rounder corners
                  'relative flex h-full min-h-0 items-center justify-between gap-2 px-5 py-1.5 transition-colors duration-300',
                  card.active && 'text-white'
                )}
              >
                <div className="min-w-0">
                  <p className={cn('truncate text-sm font-bold transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                    {card.label}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs transition-colors duration-300 group-hover:text-white/80',
                      card.active ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {card.value} {card.value === 1 ? 'user' : 'users'}
                  </p>
                </div>
                <RingProgress value={card.value} size={42} highlightOnHover highlighted={card.active} />
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}