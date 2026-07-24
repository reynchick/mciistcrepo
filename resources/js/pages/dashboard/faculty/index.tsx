import { useEffect, useMemo, useState } from 'react'
import { Head, router, usePage, useRemember } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FacultyCountBarChart from '@/components/dashboard/charts/faculty-count-bar-chart'
import FilterSidebar from '@/components/browse/research-filters'
import { ArrowRight, FileText, Filter, FolderOpen, Search, Users } from 'lucide-react'

type FacultyStats = {
  totals: { advised: number; paneled: number }
  recent?: Array<{ id: number | string; title: string; program?: string; status?: 'ongoing' | 'completed'; year?: number; role?: 'adviser' | 'panelist' }>
  yearlyTrendAdvised?: Array<{ year: number; count: number }>
  yearlyTrendPaneled?: Array<{ year: number; count: number }>
  lastUpdated?: string
}

type SharedData = {
  auth: {
    user: {
      first_name: string
      middle_name?: string | null
      last_name: string
      faculty_id?: number | string | null
    }
  }
}

type Props = { facultyStats?: FacultyStats }

function getInitialYears(): number[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  return params.getAll('year[]').map((value) => Number(value)).filter((value) => !Number.isNaN(value))
}

function formatLastUpdated(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return '—'
  const date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

export default function FacultyDashboard({ facultyStats }: Props) {
  const fs: FacultyStats = facultyStats ?? {
    totals: { advised: 0, paneled: 0 },
    recent: [],
    yearlyTrendAdvised: [],
    yearlyTrendPaneled: [],
    lastUpdated: '',
  }
  const { auth } = usePage<SharedData>().props
  const name = useMemo(() => `${auth.user.first_name} ${auth.user.middle_name ? `${auth.user.middle_name} ` : ''}${auth.user.last_name}`.trim(), [auth])
  const [showFilters, setShowFilters] = useRemember(false, 'faculty.dashboard.showFilters')
  const [selectedYears, setSelectedYears] = useState<number[]>(() => getInitialYears())

  useEffect(() => {
    setSelectedYears(getInitialYears())
  }, [])

  const yearOptions = useMemo(() => {
    const allYears = Array.from(new Set([...(fs.yearlyTrendAdvised ?? []).map((item) => item.year), ...(fs.yearlyTrendPaneled ?? []).map((item) => item.year)])).sort((a, b) => a - b)

    return allYears.map((year) => {
      const advisedCount = fs.yearlyTrendAdvised?.find((item) => item.year === year)?.count ?? 0
      const paneledCount = fs.yearlyTrendPaneled?.find((item) => item.year === year)?.count ?? 0
      return { year, count: advisedCount + paneledCount }
    })
  }, [fs.yearlyTrendAdvised, fs.yearlyTrendPaneled])

  const filteredAdvisedCount = useMemo(() => {
    const source = fs.yearlyTrendAdvised ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendAdvised, selectedYears])

  const filteredPaneledCount = useMemo(() => {
    const source = fs.yearlyTrendPaneled ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendPaneled, selectedYears])

  const handleApplyFilters = (newFilters: { years: number[] }) => {
    setSelectedYears(newFilters.years)

    const params = new URLSearchParams()

    if (newFilters.years.length > 0) {
      newFilters.years.forEach((year) => params.append('year[]', String(year)))
    }

    router.get(`/dashboard${params.toString() ? `?${params.toString()}` : ''}`, {}, {
      preserveState: true,
      preserveScroll: false,
    })
  }

  const handleResetFilters = () => {
    setSelectedYears([])
    router.get('/dashboard', {}, {
      preserveState: true,
      preserveScroll: false,
    })
  }

  const facultyLabel = name || 'You'

  return (
    <AppLayout>
      <Head title="Faculty Dashboard" />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Research Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your research activities and statistics</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((value) => !value)} className="self-start sm:self-auto">
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <div className="hidden flex-shrink-0 lg:block lg:w-72">
              <div className="sticky top-6">
                <FilterSidebar
                  filterOptions={{
                    years: yearOptions,
                    programs: [],
                    advisers: [],
                  }}
                  currentFilters={{ years: selectedYears, programs: [], advisers: [] }}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  isMobile={false}
                  showProgramFilter={false}
                  showAdviserFilter={false}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
              <div className="w-full space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Research Advised
                      </CardTitle>
                      <CardDescription>Your advised research activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{filteredAdvisedCount.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Research Paneled
                      </CardTitle>
                      <CardDescription>Your paneled research activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{filteredPaneledCount.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Access your research information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <button
                      type="button"
                      onClick={() => router.visit('/faculty/my-researches')}
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-left transition-colors hover:bg-accent"
                    >
                      <span className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4" />
                        <span className="font-medium">View My Researches</span>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.visit('/faculty/browse')}
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-left transition-colors hover:bg-accent"
                    >
                      <span className="flex items-center gap-3">
                        <Search className="h-4 w-4" />
                        <span className="font-medium">Browse All Research</span>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
