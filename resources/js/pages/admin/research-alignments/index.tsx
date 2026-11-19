import { Head, router, useForm, usePage } from '@inertiajs/react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import Heading from '@/components/heading'
import AppLayout from '@/layouts/app/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type Alignment = { id: number; name: string; description: string | null; researches_count: number }
type Kind = 'sdgs' | 'srigs' | 'agendas'
type SortOrder = 'code-asc' | 'code-desc' | 'most-used' | 'least-used' | 'unused'
type Props = { sdgs: Alignment[]; srigs: Alignment[]; agendas: Alignment[] }

const labels: Record<Kind, string> = { sdgs: 'SDG', srigs: 'SRIG', agendas: 'Agenda' }

export default function ResearchAlignmentsIndexPage({ sdgs, srigs, agendas }: Props) {
  const { errors } = usePage<{ errors: { delete?: string } }>().props

  return (
    <AppLayout>
      <Head title="Research Alignment Management" />
      <div className="space-y-6 p-4 sm:p-6">
        <Heading title="Research Alignment Management" description="Manage the SDG, SRIG, and Agenda tags available for research records." />
        {errors.delete ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.delete}</div> : null}
        <Tabs defaultValue="sdgs">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="sdgs">SDG ({sdgs.length})</TabsTrigger>
            <TabsTrigger value="srigs">SRIG ({srigs.length})</TabsTrigger>
            <TabsTrigger value="agendas">Agenda ({agendas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="sdgs"><AlignmentSection kind="sdgs" entries={sdgs} /></TabsContent>
          <TabsContent value="srigs"><AlignmentSection kind="srigs" entries={srigs} /></TabsContent>
          <TabsContent value="agendas"><AlignmentSection kind="agendas" entries={agendas} /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function AlignmentSection({ kind, entries }: { kind: Kind; entries: Alignment[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Alignment | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('code-asc')
  const label = labels[kind]
  const visibleEntries = useMemo(() => filterAndSort(entries, search, sort), [entries, search, sort])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{label} entries</CardTitle>
          <CardDescription>These entries are immediately available in research upload and edit forms.</CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Add {label}</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${label} code, title, or description...`} className="pl-9 pr-9" />
            {search ? <button type="button" onClick={() => setSearch('')} aria-label={`Clear ${label} search`} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button> : null}
          </div>
          <Select value={sort} onValueChange={(value) => setSort(value as SortOrder)}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Sort entries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="code-asc">Code order</SelectItem>
              <SelectItem value="code-desc">Code order, descending</SelectItem>
              <SelectItem value="most-used">Most used</SelectItem>
              <SelectItem value="least-used">Least used</SelectItem>
              <SelectItem value="unused">Unused only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visibleEntries.length ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Name / code</th><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Used by research</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
              <tbody className="divide-y">
                {visibleEntries.map((entry) => <tr key={entry.id}><td className="px-4 py-3 font-medium">{entry.name}</td><td className="max-w-lg px-4 py-3 text-muted-foreground">{entry.description || '—'}</td><td className="px-4 py-3">Used in {entry.researches_count} research record{entry.researches_count === 1 ? '' : 's'}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(entry)}><Pencil className="mr-1 size-4" />Edit</Button><Button variant="destructive" size="sm" onClick={() => destroy(kind, entry)}><Trash2 className="mr-1 size-4" />Delete</Button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{entries.length ? `No ${label} entries match your search and filter.` : `No ${label} entries have been added yet.`}</div>}
      </CardContent>
      <AlignmentDialog kind={kind} open={createOpen} onOpenChange={setCreateOpen} />
      <AlignmentDialog key={editing?.id ?? 'none'} kind={kind} entry={editing} open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }} />
    </Card>
  )
}

function AlignmentDialog({ kind, entry, open, onOpenChange }: { kind: Kind; entry?: Alignment | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const label = labels[kind]
  const form = useForm({ name: entry?.name ?? '', description: entry?.description ?? '' })
  const edit = Boolean(entry)
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const options = { preserveScroll: true, preserveState: true, onSuccess: () => { form.reset(); onOpenChange(false) } }
    if (entry) form.put(`/admin/research-alignments/${kind}/${entry.id}`, options)
    else form.post(`/admin/research-alignments/${kind}`, options)
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{edit ? `Edit ${label}` : `Add ${label}`}</DialogTitle><DialogDescription>{edit ? `Update this ${label} entry.` : `Create a ${label} entry for research tagging.`}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor={`${kind}-name`}>Name / code</Label><Input id={`${kind}-name`} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />{form.errors.name ? <p className="text-sm text-destructive">{form.errors.name}</p> : null}</div><div className="space-y-2"><Label htmlFor={`${kind}-description`}>Description</Label><Textarea id={`${kind}-description`} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />{form.errors.description ? <p className="text-sm text-destructive">{form.errors.description}</p> : null}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={form.processing}>{edit ? 'Save changes' : `Add ${label}`}</Button></DialogFooter></form></DialogContent></Dialog>
}

function destroy(kind: Kind, entry: Alignment) {
  const label = labels[kind]
  const warning = entry.researches_count > 0 ? `${entry.researches_count} research record(s) use this ${label}. Deletion will be blocked. Continue to see the details?` : `Delete “${entry.name}”? This cannot be undone.`
  if (window.confirm(warning)) router.delete(`/admin/research-alignments/${kind}/${entry.id}`, { preserveScroll: true, preserveState: true })
}

function filterAndSort(entries: Alignment[], search: string, sort: SortOrder): Alignment[] {
  const query = search.trim().toLocaleLowerCase()
  const matching = entries.filter((entry) => {
    const searchable = `${entry.name} ${entry.description ?? ''}`.toLocaleLowerCase()
    return !query || searchable.includes(query)
  })

  if (sort === 'unused') return matching.filter((entry) => entry.researches_count === 0).sort(compareCode)
  if (sort === 'most-used') return matching.sort((a, b) => b.researches_count - a.researches_count || compareCode(a, b))
  if (sort === 'least-used') return matching.sort((a, b) => a.researches_count - b.researches_count || compareCode(a, b))
  return matching.sort(sort === 'code-desc' ? (a, b) => compareCode(b, a) : compareCode)
}

function compareCode(a: Alignment, b: Alignment): number {
  const aNumber = Number(a.name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  const bNumber = Number(b.name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  return aNumber - bNumber || a.name.localeCompare(b.name)
}
