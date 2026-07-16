import { useState, useMemo, useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, FileDown, Filter } from 'lucide-react'
import type { Research, Program, SDG, SRIG, Agenda } from '@/types'

interface Props {
  researches: Research[]
  programs: Program[]
  filters: {
    program?: string | number
    year?: string | number
    search?: string
  }
}

interface GroupedData {
  program: Program
  years: {
    year: number
    researches: Research[]
  }[]
}

export default function MatrixReport({ researches, programs, filters }: Props) {
  const [search, setSearch] = useState(String(filters.search ?? ''))
  const [program, setProgram] = useState(String(filters.program ?? ''))
  const [year, setYear] = useState(String(filters.year ?? ''))

  // Debug logging
  useEffect(() => {
    console.log('Reports & Analytics Page Loaded Successfully!')
    console.log('Research Data:', { 
      researchCount: researches?.length, 
      programCount: programs?.length,
      researches: researches,
      programs: programs,
      filters 
    })
  }, [])

  // Group researches by program, then by year
  const groupedData = useMemo(() => {
    const groups: Record<number, GroupedData> = {}

    researches.forEach((research) => {
      if (!research.program) return

      const programId = research.program.id
      const researchYear = research.published_year || 0

      if (!groups[programId]) {
        groups[programId] = {
          program: research.program,
          years: []
        }
      }

      let yearGroup = groups[programId].years.find(y => y.year === researchYear)
      if (!yearGroup) {
        yearGroup = { year: researchYear, researches: [] }
        groups[programId].years.push(yearGroup)
      }

      yearGroup.researches.push(research)
    })

    // Sort years within each program
    Object.values(groups).forEach(group => {
      group.years.sort((a, b) => b.year - a.year)
    })

    return Object.values(groups).sort((a, b) => 
      a.program.name.localeCompare(b.program.name)
    )
  }, [researches])

  // Filter researches based on search term
  const filteredGroupedData = useMemo(() => {
    if (!search.trim()) return groupedData

    const searchLower = search.toLowerCase()
    
    return groupedData.map(group => ({
      ...group,
      years: group.years.map(yearGroup => ({
        ...yearGroup,
        researches: yearGroup.researches.filter(research => 
          research.research_title.toLowerCase().includes(searchLower) ||
          research.research_abstract?.toLowerCase().includes(searchLower) ||
          research.researchers?.some(r => 
            `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchLower)
          ) ||
          research.adviser?.first_name?.toLowerCase().includes(searchLower) ||
          research.adviser?.last_name?.toLowerCase().includes(searchLower)
        )
      })).filter(yearGroup => yearGroup.researches.length > 0)
    })).filter(group => group.years.length > 0)
  }, [groupedData, search])

  const handleFilter = () => {
    const params: Record<string, string> = {}
    
    if (search) params.search = search
    if (program) params.program = program
    if (year) params.year = year
    
    router.get('/reports', params, { 
      preserveState: true, 
      preserveScroll: true 
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setProgram('')
    setYear('')
    router.get('/reports', {}, { 
      preserveState: false, 
      preserveScroll: false 
    })
  }

  const formatResearchers = (researchers?: Array<{ first_name: string; middle_name?: string | null; last_name: string }>) => {
    if (!researchers || researchers.length === 0) return 'N/A'
    return researchers.map(r => 
      `${r.first_name} ${r.middle_name ? r.middle_name.charAt(0) + '. ' : ''}${r.last_name}`
    ).join(', ')
  }

  const formatAdviser = (adviser?: { first_name?: string; middle_name?: string | null; last_name?: string } | null) => {
    if (!adviser) return 'N/A'
    return `${adviser.first_name || ''} ${adviser.middle_name ? adviser.middle_name.charAt(0) + '. ' : ''}${adviser.last_name || ''}`.trim()
  }

  const formatMonthYear = (month?: number | null, year?: number | null) => {
    if (!year) return 'N/A'
    if (!month) return String(year)
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[month - 1]} ${year}`
  }

  const totalResearches = researches.length
  const filteredTotal = filteredGroupedData.reduce((sum, group) => 
    sum + group.years.reduce((ySum, y) => ySum + y.researches.length, 0), 0
  )

  // Generate unique years for filter dropdown
  const years = useMemo(() => {
    const yearSet = new Set<number>()
    researches.forEach(r => {
      if (r.published_year) yearSet.add(r.published_year)
    })
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [researches])

  return (
    <AppLayout>
      <Head title="Reports & Analytics" />
      
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive research overview grouped by program and year
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter research by program, year, or search for specific content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, abstract, researcher, or adviser..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={program || undefined} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year || undefined} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleFilter}>Apply Filters</Button>
              <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredTotal} of {totalResearches} research entries</span>
          {(program || year || search) && (
            <Badge variant="secondary">Filtered</Badge>
          )}
        </div>

        {/* Grouped Research Tables */}
        <div className="space-y-8">
          {filteredGroupedData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-2">
                <p className="text-muted-foreground text-lg">
                  {totalResearches === 0 
                    ? 'No research entries found in the database' 
                    : 'No research found matching your criteria'}
                </p>
                {totalResearches === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add research entries from the Research menu to see them here.
                  </p>
                )}
                {totalResearches > 0 && (program || year || search) && (
                  <Button variant="outline" onClick={handleClearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredGroupedData.map((programGroup) => (
              <Card key={programGroup.program.id}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {programGroup.program.name}
                  </CardTitle>
                  <CardDescription>
                    {programGroup.program.code && `(${programGroup.program.code})`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {programGroup.years.map((yearGroup) => (
                    <div key={yearGroup.year} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {yearGroup.year || 'No Year Specified'}
                        </h3>
                        <Badge variant="outline">
                          {yearGroup.researches.length} {yearGroup.researches.length === 1 ? 'research' : 'researches'}
                        </Badge>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">ID</TableHead>
                              <TableHead className="min-w-[250px]">Title</TableHead>
                              <TableHead className="min-w-[200px]">Researchers</TableHead>
                              <TableHead className="min-w-[150px]">Adviser</TableHead>
                              <TableHead className="w-[140px]">Completion Date</TableHead>
                              <TableHead className="min-w-[150px]">SDG</TableHead>
                              <TableHead className="min-w-[150px]">SRIG</TableHead>
                              <TableHead className="min-w-[150px]">Agenda</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearGroup.researches.map((research) => (
                              <TableRow key={research.id}>
                                <TableCell className="font-mono text-xs">
                                  {research.id}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium line-clamp-2">
                                    {research.research_title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm line-clamp-2">
                                    {formatResearchers(research.researchers)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {formatAdviser(research.adviser)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatMonthYear(research.published_month, research.published_year)}
                                </TableCell>
                                <TableCell>
                                  {research.sdgs && research.sdgs.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {research.sdgs.map((sdg) => (
                                        <Badge key={sdg.id} variant="secondary" className="text-xs">
                                          {sdg.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {research.srigs && research.srigs.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {research.srigs.map((srig) => (
                                        <Badge key={srig.id} variant="secondary" className="text-xs">
                                          {srig.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {research.agendas && research.agendas.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {research.agendas.map((agenda) => (
                                        <Badge key={agenda.id} variant="secondary" className="text-xs">
                                          {agenda.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
