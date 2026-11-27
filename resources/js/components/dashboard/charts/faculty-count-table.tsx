import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import HeadingSmall from '@/components/heading-small'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
// Applied to both real and filler rows so every row is the same height.
// Every page renders exactly PAGE_SIZE rows, so the table height is constant.
const ROW_HEIGHT_CLASS = 'h-14'

/**
 * Folder-style tabs — same shell as the Activity Logs page.
 * Applied through className only, so the shared <Tabs /> component stays untouched.
 *
 * - The active tab uses the same surface colour as the panel below it, so the two
 *   read as one piece.
 * - The two ::before / ::after squares draw the curved "shoulders" where the
 *   active tab flows into the panel.
 * - Inactive tabs are a darker blue-gray and overlap slightly.
 * - No margin, border or focus ring on the list/triggers, and the panel overlaps
 *   the list by 1px (-mt-px), so there is no visible seam between tab and panel.
 */
const TAB_LIST_CLASS =
  'relative z-20 flex h-10 w-full items-start justify-between gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const TAB_TRIGGER_CLASS = [
  'relative h-[39px] min-w-[155px] data-[state=active]:h-10 flex-1 -ml-2 first:ml-0 rounded-t-xl rounded-b-none border-0 px-2 text-center text-sm font-medium',
  'focus-visible:outline-none focus-visible:ring-0',
  'bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
  'data-[state=active]:border-transparent data-[state=active]:bg-[var(--tab-surface)] data-[state=active]:text-slate-900 dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--tab-surface)] dark:data-[state=active]:text-white',
  "data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:-left-3 data-[state=active]:before:h-3 data-[state=active]:before:w-3 data-[state=active]:before:content-[''] data-[state=active]:before:bg-[radial-gradient(circle_at_0_0,transparent_12px,var(--tab-surface)_12px)] data-[state=active]:first:before:hidden",
  "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:-right-3 data-[state=active]:after:h-3 data-[state=active]:after:w-3 data-[state=active]:after:content-[''] data-[state=active]:after:bg-[radial-gradient(circle_at_100%_0,transparent_12px,var(--tab-surface)_12px)] data-[state=active]:last:after:hidden",
].join(' ')

const SHADE_BASE =
  "before:pointer-events-none before:absolute before:inset-y-0 before:w-4 before:content-[''] before:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,transparent_10px,black_30px)] before:[mask-image:linear-gradient(to_bottom,transparent_0,transparent_10px,black_30px)]"
const SHADE_RIGHT_EDGE = `${SHADE_BASE} before:right-0 before:bg-[linear-gradient(to_left,var(--tab-shade),transparent)]`
const SHADE_LEFT_EDGE = `${SHADE_BASE} before:left-0 before:bg-[linear-gradient(to_right,var(--tab-shade),transparent)]`

const getTabDepth = (index: number, activeIndex: number) => {
  const distance = Math.abs(index - activeIndex)
  return {
    // active = 30, neighbours = 29, next = 28 ... (never below 1)
    zIndex: Math.max(30 - distance, 1),
    shadeClass: distance === 0 ? '' : index < activeIndex ? SHADE_RIGHT_EDGE : SHADE_LEFT_EDGE,
  }
}

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
  browseResearchHref: string
}

/** Panel content (heading + table + pagination). The surrounding panel shell lives in FacultyResearchTable. */
function RolePanel({
  title,
  description,
  countLabel,
  linkParam,
  data,
  emptyMessage,
  browseResearchHref,
}: RolePanelProps) {
  const [page, setPage] = useState(0)

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

  return (
    <div className="px-5 pb-4 pt-3 sm:px-6 sm:pb-4 sm:pt-5">
      <HeadingSmall title={title} description={description} />

      <div className="mt-3 min-w-0 space-y-3">
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="w-full">
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
                          className="size-8 justify-center rounded-md border-0 bg-[#023e7d] p-0 text-sm font-semibold text-white shadow-sm"
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
      </div>
    </div>
  )
}

type RoleTab = 'advised' | 'paneled'

const TABS: Array<{ value: RoleTab; label: string }> = [
  { value: 'advised', label: 'Research Advised' },
  { value: 'paneled', label: 'Research Paneled' },
]

/**
 * Tab-switchable faculty research table — one tab for "Research Advised",
 * one for "Research Paneled". Styled like the Activity Logs page: folder-style
 * tabs that flow into a single white panel holding the heading, table and pagination.
 * Clicking any row in EITHER tab always goes to the Browse Research page
 * (/staff/browse), never the /research Manage Research resource route.
 */
export default function FacultyResearchTable({
  advised,
  paneled,
  emptyMessage = 'No faculty data available',
  browseResearchHref = '/staff/browse',
}: Props) {
  const [activeTab, setActiveTab] = useState<RoleTab>('advised')
  const activeTabIndex = TABS.findIndex((tab) => tab.value === activeTab)

  return (
    // --tab-surface is shared by the active tab, its shoulders and the panel.
    <div className="relative isolate z-0 pt-2 [--tab-surface:#ffffff] [--tab-shade:rgba(15,23,42,0.2)] dark:[--tab-surface:#0f172a] dark:[--tab-shade:rgba(0,0,0,0.45)]">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RoleTab)} className="w-full">
        <TabsList className={TAB_LIST_CLASS}>
          {TABS.map((tab, index) => {
            const { zIndex, shadeClass } = getTabDepth(index, activeTabIndex)
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`${TAB_TRIGGER_CLASS} ${shadeClass}`}
                style={{ zIndex, boxShadow: 'none' }}
              >
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* The tab row spans the full width, so the first and last tabs are flush with the panel's
          left and right edges. Both top corners of the panel stay square so no wedge of background can show. */}
      <div className="relative z-10 -mt-px rounded-b-[20px] rounded-t-none bg-[var(--tab-surface)] shadow-sm">
        {activeTab === 'advised' ? (
          <RolePanel
            key="advised"
            title="Research Advised per Faculty"
            description="Number of research projects advised by each faculty member"
            countLabel="Researches Advised"
            linkParam="adviser"
            data={advised}
            emptyMessage={emptyMessage}
            browseResearchHref={browseResearchHref}
          />
        ) : (
          <RolePanel
            key="paneled"
            title="Research Paneled per Faculty"
            description="Number of research panels each faculty member has participated in"
            countLabel="Researches Paneled"
            linkParam="panelist"
            data={paneled}
            emptyMessage={emptyMessage}
            browseResearchHref={browseResearchHref}
          />
        )}
      </div>
    </div>
  )
}