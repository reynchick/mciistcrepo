import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'


function getPageSequence(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result: Array<number | 'ellipsis'> = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}


function getSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1] ?? fullName
}

const PAGE_SIZE = 5
// Applied to both real and filler rows so every row is the same height,
// keeping the table body visually uniform within a page.
const ROW_HEIGHT_CLASS = 'h-14'

export interface FacultyRoleData {
  /** Faculty full names — one per row. */
  labels: string[]
  /** Counts, index-aligned with {@link labels}. */
  counts: number[]
  /** Faculty emails, index-aligned with {@link labels}. */
  emails?: string[]
  /** Faculty positions/designations, index-aligned with {@link labels}. */
  positions?: string[]
  /** Faculty primary keys, index-aligned with {@link labels}. Enables click-through. */
  facultyIds?: Array<number | string>
}

interface Props {
  /** Data for the "Research Advised" tab. */
  advised: FacultyRoleData
  /** Data for the "Research Paneled" tab. */
  paneled: FacultyRoleData
  emptyMessage?: string

  browseResearchHref?: string
}

interface RolePanelProps {
  title: string
  description: string
  countLabel: string
  linkParam: 'adviser' | 'panelist'
  data: FacultyRoleData
  emptyMessage: string
  accentColor: string
  browseResearchHref: string
}

function RolePanel({
  title,
  description,
  countLabel,
  linkParam,
  data,
  emptyMessage,
  accentColor,
  browseResearchHref,
}: RolePanelProps) {
  const [page, setPage] = useState(0)


  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [lockedHeight, setLockedHeight] = useState<number | undefined>(undefined)

  const allRows = useMemo(
    () =>
      data.labels
        .map((name, i) => ({
          name,
          email: data.emails?.[i],
          position: data.positions?.[i],
          count: data.counts[i] ?? 0,
          facultyId: data.facultyIds?.[i],
        }))
        .sort((a, b) => getSurname(a.name).localeCompare(getSurname(b.name))),
    [data],
  )

  const hasData = allRows.length > 0
  const totalPages = Math.max(Math.ceil(allRows.length / PAGE_SIZE), 1)
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = allRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const pageSequence = getPageSequence(safePage + 1, totalPages)


  const handleRowClick = (facultyId?: number | string) => {
    if (facultyId === undefined || facultyId === null) return
    const query = linkParam === 'adviser' ? { advisers: [facultyId] } : { panelist: facultyId }
    router.get(browseResearchHref, query, { preserveScroll: true })
  }

  const goToPage = (pageNumber: number) => setPage(pageNumber - 1)
  const goPrev = () => setPage((p) => Math.max(p - 1, 0))
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1))

  
  useLayoutEffect(() => {
    if (safePage !== 0) return
    const el = tableWrapperRef.current
    if (!el) return
    setLockedHeight(el.getBoundingClientRect().height)
  }, [safePage, data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div
              ref={tableWrapperRef}
              className="w-full overflow-hidden"
              style={lockedHeight ? { height: lockedHeight } : undefined}
            >
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
         
                    <TableHead className="w-[26%]">Faculty</TableHead>
                    <TableHead className="w-[28%]">Email</TableHead>
                    <TableHead className="w-[26%]">Position</TableHead>
                    <TableHead className="w-[20%] text-center">{countLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow
                      key={row.facultyId ?? row.name}
                      onClick={() => handleRowClick(row.facultyId)}
                      title={`View research ${linkParam === 'adviser' ? 'advised' : 'paneled'} by ${row.name}`}
                      className={`${ROW_HEIGHT_CLASS} cursor-pointer transition-colors hover:bg-muted/50`}
                    >
                      <TableCell className="truncate font-medium">{row.name}</TableCell>
                      <TableCell className="truncate text-muted-foreground">{row.email || '—'}</TableCell>
                      <TableCell className="truncate text-muted-foreground">{row.position || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="min-w-[3.25rem] justify-center rounded-full border px-3.5 py-1 text-sm font-semibold shadow-sm"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
                            color: accentColor,
                          }}
                        >
                          {row.count.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
         
                  {Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
                    <TableRow
                      key={`filler-${i}`}
                      className={`${ROW_HEIGHT_CLASS} pointer-events-none hover:bg-transparent`}
                    >
                
                      <TableCell className="font-medium">
                        <span className="invisible">—</span>
                      </TableCell>
                      <TableCell>
                        <span className="invisible">—</span>
                      </TableCell>
                      <TableCell>
                        <span className="invisible">—</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="invisible">—</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        goPrev()
                      }}
                      aria-disabled={safePage === 0}
                      className={safePage === 0 ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>

                  {pageSequence.map((entry, i) =>
                    entry === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={entry}>
                        <PaginationLink
                          href="#"
                          isActive={entry === safePage + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            goToPage(entry)
                          }}
                        >
                          {entry}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        goNext()
                      }}
                      aria-disabled={safePage === totalPages - 1}
                      className={safePage === totalPages - 1 ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Tab-switchable faculty research table — one tab for "Research Advised",
 * one for "Research Paneled" — replacing two separate stacked tables.
 * Each tab renders a full self-contained card (title, table, pagination),
 * following the shadcn Tabs + Table reference patterns directly. Clicking
 * any row in EITHER tab always goes to the Browse Research page
 * (/staff/browse), never the /research Manage Research resource route.
 */
export default function FacultyResearchTable({
  advised,
  paneled,
  emptyMessage = 'No faculty data available',
  browseResearchHref = '/staff/browse',
}: Props) {
  return (
    <Tabs defaultValue="advised" className="w-full">
      <TabsList>
        <TabsTrigger value="advised">Research Advised</TabsTrigger>
        <TabsTrigger value="paneled">Research Paneled</TabsTrigger>
      </TabsList>

      <TabsContent value="advised">
        <RolePanel
          title="Research Advised per Faculty"
          description="Number of research projects advised by each faculty member"
          countLabel="Researches Advised"
          linkParam="adviser"
          data={advised}
          emptyMessage={emptyMessage}
          accentColor="#4169E1"
          browseResearchHref={browseResearchHref}
        />
      </TabsContent>

      <TabsContent value="paneled">
        <RolePanel
          title="Research Paneled per Faculty"
          description="Number of research panels each faculty member has participated in"
          countLabel="Researches Paneled"
          linkParam="panelist"
          data={paneled}
          emptyMessage={emptyMessage}
          accentColor="var(--chart-2)"
          browseResearchHref={browseResearchHref}
        />
      </TabsContent>
    </Tabs>
  )
}