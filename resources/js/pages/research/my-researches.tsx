import { useState, useMemo } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/research/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Research } from '@/types'
import type { ResearchCapabilities, ResearchStatus } from '@/types/models'
import { getStatusFilterOptions } from '@/lib/research-status'

type ResearchWithCapabilities = Research & {
  status?: ResearchStatus | null
  capabilities?: Partial<ResearchCapabilities> | null
}

type Props = {
  researches: Array<ResearchWithCapabilities>
  filters?: { search?: string; status?: string }
}

type SharedData = {
  auth: { user: { first_name: string; middle_name?: string | null; last_name: string } }
}

export default function StudentMyResearches({ researches = [], filters = {} }: Props) {
  const { auth } = usePage<SharedData>().props
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '')
  const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all')

  const statusOptions = useMemo(() => {
    const options = getStatusFilterOptions()
    // Filter out 'archived' for students since archive revokes their access
    return options.filter((opt) => opt.value !== 'archived')
  }, [])

  const handleSearch = () => {
    router.get(
      '/student/my-researches',
      { search: searchTerm, status: statusFilter === 'all' ? undefined : statusFilter },
      { preserveScroll: true }
    )
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    router.get(
      '/student/my-researches',
      { search: searchTerm, status: value === 'all' ? undefined : value },
      { preserveScroll: true }
    )
  }

  const handleReset = () => {
    setSearchTerm('')
    setStatusFilter('all')
    router.get('/student/my-researches', {}, { preserveScroll: true })
  }

  return (
    <AppLayout>
      <Head title="My Research" />
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Research</h1>
          <p className="text-muted-foreground">
            Manage your research entries. Archived research is no longer available.
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search and Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
              <Input
                placeholder="Search by title or research ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="default">
                Search
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No Results */}
        {researches.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchTerm || statusFilter !== 'all'
                ? 'No research entries match your search criteria.'
                : 'You have no research entries yet. Create one to get started.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Research Cards */}
        {researches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {researches.map((research) => (
              <ResearchCard key={research.id} research={research} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ResearchCard({ research }: { research: ResearchWithCapabilities }) {
  const caps = research.capabilities ?? {}
  const canEdit = Boolean(caps.canEdit ?? (caps as Record<string, unknown>).can_edit)
  const canSubmit = Boolean(caps.canSubmit ?? (caps as Record<string, unknown>).can_submit)
  const canView = Boolean(caps.canView ?? (caps as Record<string, unknown>).can_view)

  // Determine the primary action button
  let primaryAction: { label: string; route: string; variant: 'default' | 'outline' } | null = null

  if (canEdit) {
    primaryAction = {
      label: 'Edit',
      route: `/research/${research.id}/edit`,
      variant: 'default',
    }
  } else if (canSubmit) {
    primaryAction = {
      label: 'Submit for Review',
      route: `/research/${research.id}/edit`,
      variant: 'default',
    }
  } else if (canView) {
    primaryAction = {
      label: 'View',
      route: `/research/${research.id}`,
      variant: 'outline',
    }
  }

  const readOnlyReason = (caps.readOnlyReason ?? (caps as Record<string, unknown>).read_only_reason) as string | undefined

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 text-base">{research.research_title}</CardTitle>
            <CardDescription className="mt-1 text-xs">{research.program?.name ?? '—'}</CardDescription>
          </div>
          <StatusBadge status={research.status} className="whitespace-nowrap" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pb-4">
        {/* Read-only reason if applicable */}
        {readOnlyReason && !canEdit && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 py-2">
            <AlertDescription className="text-xs">{readOnlyReason}</AlertDescription>
          </Alert>
        )}

        {/* Primary action button */}
        {primaryAction && (
          <Button
            onClick={() => router.visit(primaryAction.route)}
            variant={primaryAction.variant}
            className="w-full"
            size="sm"
          >
            {primaryAction.label}
          </Button>
        )}

        {/* Fallback message if no action is available */}
        {!primaryAction && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No actions available for this research.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
