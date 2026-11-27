import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { router } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

export type LaravelPaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number | null
  to?: number | null
  links?: Array<{ url: string | null; label: string; active: boolean }>
}

type Props = {
  meta: LaravelPaginationMeta
  onChange?: (page: number, perPage?: number) => void
  hrefBuilder?: (page: number, perPage?: number) => string
  preserveScroll?: boolean
  perPageOptions?: number[]
  className?: string
}

function getPages(current: number, last: number, windowSize: number) {
  const pages: (number | '...')[] = []
  const start = Math.max(1, current - windowSize)
  const end = Math.min(last, current + windowSize)
  if (start > 1) pages.push(1, '...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < last) pages.push('...', last)
  return pages
}

/** Plain text-style Previous / Next buttons (no border, no background). */
const NAV_BUTTON_CLS =
  'h-9 gap-1 px-3 text-sm font-medium text-slate-900 shadow-none hover:bg-slate-100 disabled:text-slate-400 disabled:opacity-60'

/** Page number buttons: plain text, the current page gets a white chip with a light border. */
const PAGE_BUTTON_CLS = 'size-9 rounded-lg p-0 text-sm font-medium text-slate-900 shadow-none hover:bg-slate-100'
const PAGE_BUTTON_ACTIVE_CLS = 'pointer-events-none border border-slate-200 bg-white hover:bg-white'

export default function Pagination({
  meta,
  onChange,
  hrefBuilder,
  preserveScroll = true,
  perPageOptions = [10, 25, 50, 100],
  className,
}: Props) {
  const isMobile = useIsMobile()
  const windowSize = isMobile ? 1 : meta.last_page > 10 ? 3 : 2
  const pages = useMemo(() => getPages(meta.current_page, meta.last_page, windowSize), [meta.current_page, meta.last_page, windowSize])

  const navigate = (page: number, perPage = meta.per_page) => {
    if (onChange) return onChange(page, perPage)
    if (hrefBuilder) return router.get(hrefBuilder(page, perPage), {}, { preserveScroll, preserveState: true })
  }

  return (
    <div className={cn('flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2', className)}>
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-slate-900">Rows per page</span>
        <Select value={String(meta.per_page)} onValueChange={(v) => navigate(1, Number(v))}>
          <SelectTrigger
            aria-label="Rows per page"
            className="h-10 w-[80px] rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:border-slate-200 focus-visible:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {perPageOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Previous / page numbers / Next */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label="Previous page"
          className={NAV_BUTTON_CLS}
          disabled={meta.current_page <= 1}
          onClick={() => navigate(meta.current_page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        {!isMobile &&
          pages.map((p, i) => {
            if (p === '...') {
              return (
                <span key={`e-${i}`} aria-hidden="true" className="flex size-9 items-center justify-center text-slate-900">
                  <MoreHorizontal className="size-4" />
                </span>
              )
            }
            const active = p === meta.current_page
            return (
              <Button
                key={p}
                type="button"
                variant="ghost"
                aria-label={`Page ${p}`}
                aria-current={active ? 'page' : undefined}
                className={cn(PAGE_BUTTON_CLS, active && PAGE_BUTTON_ACTIVE_CLS)}
                onClick={() => navigate(p)}
              >
                {p}
              </Button>
            )
          })}

        <Button
          type="button"
          variant="ghost"
          aria-label="Next page"
          className={NAV_BUTTON_CLS}
          disabled={meta.current_page >= meta.last_page}
          onClick={() => navigate(meta.current_page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  )
}

export type { Props as PaginationProps }