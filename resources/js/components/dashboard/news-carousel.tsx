import { useState, useCallback, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

// Swap this out for real posts (e.g. fetched via Inertia props) —
// image, title, and href are the only fields the card needs.
export type NewsItem = {
  id: string
  image: string
  tag: string
  title: string
  href: string
}

const defaultNews: NewsItem[] = [
  {
    id: '1',
    image: '/news/news1.jpg',
    tag: 'Announcement',
    title: 'USeP\'s "HI-Tek na si IP" Marks the Third Year of Digital Empowerment for Indigenous Communities',
    href: 'https://www.facebook.com/share/p/19EmYjg1wa/',
  },
  {
    id: '2',
    image: '/news/news2.png',
    tag: 'Event Recap',
    title: 'UseP hosts IGaCoS GAD Focal Point System Team',
    href: 'https://www.facebook.com/share/p/15yLbVbir7e/',
  },
  {
    id: '3',
    image: '/news/news4.jpg',
    tag: 'Publication',
    title: '𝘾𝙊𝙉𝙂𝙍𝘼𝙏𝙐𝙇𝘼𝙏𝙄𝙊𝙉𝙎 | Congratulations to Asst. Prof. Hermoso J. Tupas, Jr. of the College of Information and Computing (CIC) on his international publication in a Scopus-indexed conference proceedings, published by IEEE.',
    href: 'https://www.facebook.com/share/p/1JgBU3Rqtc/',
  },
  {
    id: '4',
    image: '/news/news3.png',
    tag: 'Feature',
    title: 'STRENGTHENING REGIONAL INNOVATION THROUGH DIGITAL KNOWLEDGE SYSTEMS',
    href: 'https://www.facebook.com/share/p/1EwxiYWhih/',
  },
  {
    id: '5',
    image: '/news/news5.jpg',
    tag: 'Partnership',
    title: 'USeP, DOST XI stakeholders review milestones of RIKMS Phase 2',
    href: 'https://www.facebook.com/share/p/1LXL8Fhx4m/',
  },
]

// Visual geometry of the stack — tuned so 2 cards are visible on either
// side of center, like the reference poster carousel.
const STEP_X = 190
const STEP_SCALE = 0.14
const STEP_ROTATE = 10
const MAX_VISIBLE_OFFSET = 3

// How often the carousel jumps to the next card, in ms.
const AUTOPLAY_INTERVAL = 3000

// Small helper so each card manages its own "did the image fail" state
// instead of just hiding the <img> and leaving a blank gap.
function NewsImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300 dark:bg-neutral-800 dark:text-neutral-600">
        <ImageOff className="h-8 w-8" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      // Absolutely positioned + inset-0 means the img's own intrinsic
      // width/height never affects layout — the parent box (set by the
      // aspect-[4/3] wrapper) is always what it fills.
      // object-cover + object-center crops any aspect ratio (portrait,
      // ultra-wide, tiny, huge) so it always fills the box with no
      // stretching or letterboxing.
      className="absolute inset-0 h-full w-full object-cover object-center"
      loading="lazy"
    />
  )
}

export default function NewsCarousel({ items = defaultNews }: { items?: NewsItem[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback(
    (dir: 1 | -1) => {
      setActive((prev) => (prev + dir + count) % count)
    },
    [count],
  )

  const goToIndex = useCallback((i: number) => {
    setActive(i)
  }, [])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => go(1), AUTOPLAY_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [go, paused])

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative mx-auto h-[360px] w-full max-w-3xl"
        style={{ perspective: '1400px' }}
      >
        {items.map((item, i) => {
          let offset = i - active
          if (offset > count / 2) offset -= count
          if (offset < -count / 2) offset += count

          const isActive = offset === 0
          const abs = Math.abs(offset)
          const hidden = abs > MAX_VISIBLE_OFFSET

          const translateX = offset * STEP_X
          const scale = 1 - abs * STEP_SCALE
          const rotateY = offset === 0 ? 0 : -Math.sign(offset) * STEP_ROTATE
          const zIndex = 100 - abs
          const opacity = hidden ? 0 : 1 - abs * 0.18

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`Show: ${item.title}`}
              aria-current={isActive}
              onClick={() => goToIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  goToIndex(i)
                }
              }}
              className="group absolute left-1/2 top-1/2 w-[260px] cursor-pointer text-left focus-visible:outline-none"
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex,
                opacity,
                transition: 'transform 1000ms cubic-bezier(0.22, 1, 0.36, 1), opacity 550ms ease',
                pointerEvents: hidden ? 'none' : 'auto',
              }}
            >
              <div
                className={`overflow-hidden rounded-2xl border bg-white shadow-lg transition-shadow duration-300 dark:bg-neutral-900 ${
                  isActive
                    ? 'border-slate-300 shadow-slate-900/15 dark:border-white/20 dark:shadow-black/40'
                    : 'border-slate-200 shadow-slate-900/5 dark:border-white/10'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
                  <NewsImage src={item.image} alt="" />
                </div>

                {/* title band — bottom, with a real link on the circular arrow */}
                <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-4 dark:border-white/10">
                  <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
                    {item.title}
                  </p>
                  <a
                    href={item.href}
                    aria-label={`Read more: ${item.title}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors duration-200 ease-out hover:bg-slate-200 hover:border-slate-400 hover:text-slate-700 active:scale-90 active:bg-slate-300 active:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-slate-100 dark:active:bg-slate-600 dark:active:text-white dark:focus-visible:ring-offset-neutral-900"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* controls */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => go(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-90 active:bg-black active:border-black dark:border-slate-700 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900 dark:active:bg-slate-200 dark:active:border-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={() => go(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-90 active:bg-black active:border-black dark:border-slate-700 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900 dark:active:bg-slate-200 dark:active:border-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}