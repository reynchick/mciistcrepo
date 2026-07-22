import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { router } from '@inertiajs/react'

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
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function TopAccessedResearch({ items }: Props) {
  const goToResearchSearch = (title: string) => {
    // Same pattern as keyword clicks: all-time, not scoped to the
    // dashboard's selected year range.
    const params = new URLSearchParams()
    params.append('search', title)
    router.get(`/browse?${params.toString()}`)
  }

  return (
    <div>
      <div className="md:hidden">
        <Collapsible>
          <CollapsibleTrigger className="w-full rounded-md border px-3 py-3 text-sm font-medium">Top Accessed Research</CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
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
                    onClick={() => goToResearchSearch(i.title)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToResearchSearch(i.title)
                      }
                    }}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <TableCell className="font-medium">
                      <span className="line-clamp-1">{i.title}</span>
                    </TableCell>
                    <TableCell className="text-right">{i.count}</TableCell>
                    <TableCell className="text-right">{formatDate(i.lastAccessed)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="hidden md:block">
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
                onClick={() => goToResearchSearch(i.title)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goToResearchSearch(i.title)
                  }
                }}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <TableCell className="font-medium">
                  <span className="line-clamp-1 hover:underline">{i.title}</span>
                </TableCell>
                <TableCell className="text-right">{i.count}</TableCell>
                <TableCell className="text-right">{formatDate(i.lastAccessed)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}