import { useMemo, useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Stats = { total_research: number }
type ProgramCount = { program: string; count: number }
type Keyword = { name: string; count: number }
type RecentGlobal = Array<{ id: number; title: string; program?: string | null; created_at: string }>
type SharedData = { auth: { user: { first_name: string; middle_name?: string | null; last_name: string } } }

type Props = { stats: Stats; programCounts?: ProgramCount[]; topKeywords?: Keyword[]; recentGlobal?: RecentGlobal }

export default function StudentDashboard({ stats, programCounts = [], topKeywords = [], recentGlobal = [] }: Props) {
  const { auth } = usePage<SharedData>().props
  const name = useMemo(() => `${auth.user.first_name} ${auth.user.middle_name ? auth.user.middle_name + ' ' : ''}${auth.user.last_name}`.trim(), [auth])
  const [searchTerm, setSearchTerm] = useState('')
  const handleSearch = () => router.get('/browse', { search: searchTerm }, { preserveScroll: true })
  const keywordMax = useMemo(() => Math.max(1, ...(topKeywords ?? []).map((k) => k.count)), [topKeywords])

  return (
    <AppLayout>
      <Head title="Dashboard" />
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {name}!</h1>
          <p className="text-muted-foreground">Explore our research repository</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Find research by title or keyword</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] items-start">
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search research by title or keyword..." />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topKeywords.map((k) => (
                <Button key={k.name} variant="outline" size="sm" onClick={() => { setSearchTerm(k.name); handleSearch() }}>{k.name}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browse by Program</CardTitle>
            <CardDescription>Total entries: {stats.total_research}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {programCounts.map((p) => (
                <Button key={p.program} variant="secondary" onClick={() => router.get('/browse', { program: p.program }, { preserveScroll: true })}>
                  {p.program}
                  <Badge variant="outline" className="ml-2">{p.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Popular Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map((k) => {
                  const scale = 0.8 + (k.count / keywordMax)
                  return (
                    <span key={k.name} onClick={() => { setSearchTerm(k.name); handleSearch() }} className="inline-flex items-center rounded-md border px-2 py-1 cursor-pointer" style={{ fontSize: `${Math.min(1.4, scale)}rem` }}>
                      {k.name}
                    </span>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recently Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentGlobal.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <Button variant="link" className="px-0" onClick={() => router.visit(`/research/${r.id}`)}>{r.title}</Button>
                    <span className="text-xs text-muted-foreground">{r.program ?? '-'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={() => router.visit('/browse')}>Browse Research</Button>
          <Button variant="outline" onClick={() => router.visit('/faculty')}>View Faculty</Button>
          <Button variant="outline" onClick={() => router.visit('/browse')}>Advanced Search</Button>
        </div>
      </div>
    </AppLayout>
  )
}
