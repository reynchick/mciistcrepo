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

// Soft, light circle colors from the "Blue Serenity" palette. Used instead of
// plain white so the ring/avatar circles keep a tinted, on-brand look when a
// role card is hovered or actively selected (against the dark blue overlay).
const HOVER_TRACK_COLOR = '#B6CCFE'
const HOVER_ARC_COLOR = '#EDF2FB'
const HOVER_CIRCLE_BG = '#EDF2FB'
const HOVER_CIRCLE_TEXT = '#00296B'

// CSS custom properties used so the same hex values from the palette above
// drive both the "highlighted" (clicked/active) state and the CSS-only
// ":hover" state, without hardcoding the hex string in multiple class names.
const paletteVars = {
  ['--ring-hover-track' as string]: HOVER_TRACK_COLOR,
  ['--ring-hover-arc' as string]: HOVER_ARC_COLOR,
  ['--hover-circle-bg' as string]: HOVER_CIRCLE_BG,
  ['--hover-circle-text' as string]: HOVER_CIRCLE_TEXT,
} as React.CSSProperties

// Circular progress ring: gray track, teal rounded arc, count + label in the center.
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
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        {/* These must switch to white on hover/selected — otherwise the dark
            text sits on the dark blue card overlay and becomes unreadable. */}
        <span
          className={cn(
            'text-sm font-bold tabular-nums transition-colors duration-300',
            highlightOnHover && 'group-hover:text-white',
            highlighted && 'text-white'
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            'text-[7px] font-medium text-muted-foreground transition-colors duration-300',
            highlightOnHover && 'group-hover:text-white/80',
            highlighted && 'text-white/80'
          )}
        >
          Users
        </span>
      </div>
    </div>
  )
}

const AVATAR_COLORS = [
  'bg-[#FFA400] text-[#00296B]',
  'bg-[#FFB700] text-[#00296B]',
  'bg-[#FFC300] text-[#00296B]',
]

// Overlapping circles (up to 3) plus a "···" circle when there are more.
// When `people` is supplied, each circle shows that person's real initials,
// tinted with a tone that reflects whether they're active or deleted. When a
// card is hovered or selected, every circle (including the "more" dots) is
// re-tinted with the light Blue Serenity color instead of going transparent,
// so the initials/dots stay readable against the dark blue overlay.
function AvatarStack({
  count,
  people = [],
  size = 'md',
  variant = 'default',
}: {
  count: number
  people?: AvatarPerson[]
  size?: 'sm' | 'md'
  variant?: 'default' | 'light' | 'onBlue'
}) {
  const shown = people.length > 0 ? Math.min(people.length, 3) : Math.min(Math.max(count, 0), 3)
  const palettes = {
    default: {
      dots: AVATAR_COLORS,
      ring: 'ring-card',
      more: 'bg-[#1e3a6e] text-white',
    },
    // Lighter circles for white cards
    light: {
      dots: AVATAR_COLORS,
      ring: 'ring-card',
      more: 'bg-[#FFD000] text-[#00296B]',
    },
    // Solid circles for the blue selected card (no transparency)
    onBlue: {
      dots: AVATAR_COLORS,
      ring: 'ring-[#2b55cf]',
      more: 'bg-[#FFDD00] text-[#00296B]',
    },
  }
  const p = palettes[variant]
  const dim = size === 'md' ? 'h-8 w-8' : 'h-6 w-6'
  const box = size === 'md' ? 'h-8' : 'h-6'
  const textSize = size === 'md' ? 'text-[10px]' : 'text-[8px]'
  // The wrapper always keeps its height, so nothing shifts when there are no users
  return (
    <div className={cn('flex items-center', box)} aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => {
        const person = people[i]
        return (
          <span
            key={i}
            className={cn(
              '-ml-2 flex items-center justify-center rounded-full font-bold leading-none first:ml-0 transition-colors duration-300',
              dim,
              cn(textSize, p.dots[i]),
            )}
            style={paletteVars}
          >
            {person?.initials}
          </span>
        )
      })}
      {count > 3 && (
        <span
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full text-[10px] font-bold leading-none transition-colors duration-300',
            p.more,
            dim,
          )}
          style={paletteVars}
        >
          ···
        </span>
      )}
    </div>
  )
}

/**
 * The stat/filter cards row shown above the users table (Active, Deleted,
 * Administrator, Faculty, MCIIS Staff, Student). Pure presentational —
 * the parent builds `cards` (values, click handlers, active state, avatar
 * previews) and this component only renders them.
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
              'group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-colors duration-300 ease-out hover:bg-muted/50',
              'focus-visible:outline-none focus-visible:ring-0',
              // Tall cards span both rows on desktop
              isLarge && 'lg:row-span-2',
              // Non-admins have no Deleted card, so Active takes its space too
              card.id === 'active' && !isAdmin && 'lg:col-span-2'
            )}
          >
            {/* Blue fill of the selected/hovered card. This is an absolutely
                positioned overlay, so every piece of content painted on top
                of it (label, value, avatars, ring) MUST also be positioned
                (e.g. via `relative`) or it will be stacked *underneath* this
                overlay per CSS stacking rules, regardless of DOM order. */}
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2f5bd8] to-[#1e3a8a] transition-opacity duration-300 ease-out',
                card.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            />
            {isLarge ? (
              /* Big card: title + arrow button on top, big number, small caption below */
              <CardContent className="relative flex h-full min-h-0 flex-col justify-between gap-2.5 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-base font-semibold transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                    {card.label}
                  </p>
                </div>
                <p className={cn('text-4xl font-bold leading-none tabular-nums transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                  {card.value}
                </p>
                <div className="flex items-end justify-between gap-2">
                  <p className={cn('text-xs transition-colors duration-300 group-hover:text-white/80', card.active ? 'text-white/80' : 'text-muted-foreground')}>
                    {card.id === 'active' ? 'Accounts with access' : 'Removed, can be restored'}
                  </p>
                  <AvatarStack
                    count={card.value}
                    people={card.people}
                    size="sm"
                    variant={card.id === 'deleted' ? 'light' : 'default'}
                  />
                </div>
              </CardContent>
            ) : (
              /* Small card: label + avatars on the left, progress ring on the right.
                 `relative` here is what keeps this content above the overlay span
                 above — this was missing before, which is why the text/avatars
                 disappeared under the blue overlay on hover and when selected. */
              <CardContent
                className={cn(
                  'relative flex h-full min-h-0 items-center justify-between gap-2 px-3 py-2.5 transition-colors duration-300',
                  card.active && 'text-white'
                )}
              >
                <div className="min-w-0">
                  <p className={cn('truncate text-sm font-bold transition-colors duration-300 group-hover:text-white', card.active && 'text-white')}>
                    {card.label}
                  </p>
                  <div className="mt-1.5">
                    <AvatarStack
                      count={card.value}
                      people={card.people}
                      size="sm"
                    />
                  </div>
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