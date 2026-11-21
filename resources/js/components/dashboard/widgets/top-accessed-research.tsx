import { useRef } from 'react'
import { FileTextIcon } from 'lucide-react'
import { router } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Item {
  id: number | string
  title: string
  count: number
  lastAccessed: string
}

interface Props {
  items: Item[]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AccessedResearchTable({ items, onSelect }: { items: Item[]; onSelect: (title: string) => void }) {
  const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)

  const finishDrag = () => {
    const moved = dragRef.current?.moved ?? false
    dragRef.current = null
    if (moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
  }

  return (
    <div
      className="scrollbar-hidden w-full overflow-x-auto cursor-grab active:cursor-grabbing"
      onMouseDown={(event) => {
        if (event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return
        dragRef.current = {
          startX: event.clientX,
          startScrollLeft: event.currentTarget.scrollLeft,
          moved: false,
        }
      }}
      onMouseMove={(event) => {
        const drag = dragRef.current
        if (!drag) return

        const delta = event.clientX - drag.startX
        if (Math.abs(delta) > 3) drag.moved = true
        if (drag.moved) {
          event.preventDefault()
          event.currentTarget.scrollLeft = drag.startScrollLeft - delta
        }
      }}
      onMouseUp={finishDrag}
      onMouseLeave={finishDrag}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return
        event.preventDefault()
        event.stopPropagation()
        suppressClickRef.current = false
      }}
    >
      <table className="w-full min-w-[600px] table-fixed caption-bottom text-sm select-none">
        <colgroup>
          <col className="w-[62%]" />
          <col className="w-[14%]" />
          <col className="w-[24%]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Last Accessed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => (
            <TableRow
              key={i.id}
              onClick={() => onSelect(i.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(i.title)
                }
              }}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-sm">
                    <FileTextIcon className="text-muted-foreground size-4" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium line-clamp-1">{i.title}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">
                  {i.count.toLocaleString()}
                </Badge>
              </TableCell>
              <TableCell
                className="text-muted-foreground text-right text-sm"
                style={{ whiteSpace: 'nowrap', overflowWrap: 'normal', wordBreak: 'normal' }}
              >
                {formatDate(i.lastAccessed)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  )
}

export default function TopAccessedResearch({ items }: Props) {
  const goToResearchSearch = (title: string) => {
    const params = new URLSearchParams()
    params.append('search', title)
    router.get(`/browse?${params.toString()}`)
  }

  return (
    <div>
      <div className="md:hidden">
        <Collapsible>
          <CollapsibleTrigger className="w-full rounded-md border px-3 py-3 text-sm font-medium">
            Top Accessed Research
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <AccessedResearchTable items={items} onSelect={goToResearchSearch} />
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="hidden md:block">
        <AccessedResearchTable items={items} onSelect={goToResearchSearch} />
      </div>
    </div>
  )
}