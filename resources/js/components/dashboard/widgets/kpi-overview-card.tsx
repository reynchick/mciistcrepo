import { Link } from '@inertiajs/react'
import { UserRound, FileText, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type FacultyStatsOverviewCardProps = {
  /** Total number of active faculty members */
  totalFaculty: number
  /** Total number of active research entries */
  totalResearch: number
  /** Pre-formatted last-updated string, e.g. "Jul 16, 2026 at 7:54 AM" */
  lastUpdated: string
  /** Route to navigate to when the Total Faculty card is clicked, e.g. "/staff/faculty" */
  facultyHref: string
  /** Route to navigate to when the Total Research card is clicked, e.g. "/staff/research" */
  researchHref: string
  className?: string
}

const statCardClasses =
  'relative flex flex-col border-border transition-colors hover:border-foreground/20 hover:bg-muted/40 cursor-pointer'

/**
 * Three standalone KPI cards — Total Research, Total Faculty, Last Updated —
 * laid out side by side. Icon sits top-right, opposite the label/value stack.
 * Total Research and Total Faculty are clickable links to their respective
 * management pages; Last Updated is informational only.
 */
export default function FacultyStatsOverviewCard({
  totalFaculty,
  totalResearch,
  lastUpdated,
  facultyHref,
  researchHref,
  className,
}: FacultyStatsOverviewCardProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Total Research -> manage research */}
      <Link href={researchHref} className="block">
        <Card className={statCardClasses}>
          <CardContent className="flex min-h-[132px] flex-col p-5">
            <FileText className="absolute right-5 top-5 h-5 w-5 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Total Research</p>
            <div className="mt-3 text-3xl font-bold leading-none tracking-tight text-foreground">
              {totalResearch.toLocaleString()}
            </div>
            <p className="mt-auto pt-1 text-xs text-muted-foreground">Active research entries</p>
          </CardContent>
        </Card>
      </Link>

      {/* Total Faculty -> view faculty */}
      <Link href={facultyHref} className="block">
        <Card className={statCardClasses}>
          <CardContent className="flex min-h-[132px] flex-col p-5">
            <UserRound className="absolute right-5 top-5 h-5 w-5 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Total Faculty</p>
            <div className="mt-3 text-3xl font-bold leading-none tracking-tight text-foreground">
              {totalFaculty.toLocaleString()}
            </div>
            <p className="mt-auto pt-1 text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>
      </Link>

      {/* Last Updated — informational, not a link */}
      <Card className={cn(statCardClasses, 'cursor-default hover:border-border hover:bg-transparent')}>
        <CardContent className="flex min-h-[132px] flex-col p-5">
          <Clock className="absolute right-5 top-5 h-5 w-5 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <div className="mt-3 text-xl font-bold leading-tight tracking-tight text-foreground">
            {lastUpdated}
          </div>
          <p className="mt-auto pt-1 text-xs text-muted-foreground">Most recent research update</p>
        </CardContent>
      </Card>
    </div>
  )
}