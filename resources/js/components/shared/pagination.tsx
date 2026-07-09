import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { router } from '@inertiajs/react'

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

export default function Pagination({ meta, onChange, hrefBuilder, preserveScroll = true, perPageOptions = [10, 25, 50, 100], className }: Props) {
  const isMobile = useIsMobile()
  const windowSize = isMobile ? 1 : meta.last_page > 10 ? 3 : 2
  const pages = useMemo(() => getPages(meta.current_page, meta.last_page, windowSize), [meta.current_page, meta.last_page, windowSize])

  const navigate = (page: number, perPage = meta.per_page) => {
    if (onChange) return onChange(page, perPage)
    if (hrefBuilder) return router.get(hrefBuilder(page, perPage), {}, { preserveScroll, preserveState: true })
  }

  return (
    <div className={cn('flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-xs text-muted-foreground">
        Showing {Math.min(meta.from ?? (meta.current_page - 1) * meta.per_page + 1, meta.total)} to
        {' '}
        {Math.min(meta.to ?? meta.current_page * meta.per_page, meta.total)} of {meta.total}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Items per page:</span>
          <Select value={String(meta.per_page)} onValueChange={(v) => navigate(meta.current_page, Number(v))}>
            <SelectTrigger className="h-8 w-[60px]">
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
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => navigate(meta.current_page - 1)}>
            Previous
          </Button>
          {isMobile ? null : (
            <div className="hidden sm:flex items-center gap-1">{
              pages.map((p, i) => {
                if (p === '...') return (
                  <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
                )
                const active = p === meta.current_page
                return (
                  <Button
                    key={p}
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    className={cn('min-w-8', active && 'pointer-events-none')}
                    onClick={() => navigate(p)}
                  >
                    {p}
                  </Button>
                )
              })
            }</div>
          )}
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => navigate(meta.current_page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export type { Props as PaginationProps }
