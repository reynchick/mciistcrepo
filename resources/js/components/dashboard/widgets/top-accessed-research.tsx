import { FileTextIcon } from 'lucide-react'
import { router } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Table,
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
  return (
    <Table>
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
            <TableCell className="text-muted-foreground text-right text-sm whitespace-nowrap">
              {formatDate(i.lastAccessed)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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