import { Head, router, useForm, usePage } from '@inertiajs/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
import SearchBar from '@/components/shared/search-bar'
import AppLayout from '@/layouts/app/app-layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CustomAlignmentSection, CustomCategoryDialog, customTabLabel, customTabValue, type CustomCategory } from '@/components/research-alignments/custom-alignment-section'

type Alignment = { id: number; name: string; description: string | null; researches_count: number }
type Kind = 'sdgs' | 'srigs' | 'agendas'
type SortOrder = 'code-asc' | 'code-desc' | 'most-used' | 'least-used' | 'unused'
type Props = { sdgs: Alignment[]; srigs: Alignment[]; agendas: Alignment[]; customCategories?: CustomCategory[] }

const labels: Record<Kind, string> = { sdgs: 'SDG', srigs: 'SRIG', agendas: 'Agenda' }

/* ------------------------------------------------------------------ */
/* Folder-style tabs (same shell as the Activity Logs page)            */
/* ------------------------------------------------------------------ */
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
        zIndex: Math.max(30 - distance, 1),
        shadeClass: distance === 0 ? '' : index < activeIndex ? SHADE_RIGHT_EDGE : SHADE_LEFT_EDGE,
    }
}

/* Makes any shadcn Card rendered inside the panel (e.g. the custom section)
   blend into the panel instead of showing its own border, shadow and background. */
const FLATTEN_CARD_CLASS =
    '[&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:shadow-none'

export default function ResearchAlignmentsIndexPage({ sdgs, srigs, agendas, customCategories = [] }: Props) {
    const { errors } = usePage<{ errors: { delete?: string } }>().props
    const [activeTab, setActiveTab] = useState<string>('sdgs')
    const [addCategoryOpen, setAddCategoryOpen] = useState(false)

    const tabs = [
        { value: 'sdgs', label: `SDG (${sdgs.length})`, title: 'SDG' },
        { value: 'srigs', label: `SRIG (${srigs.length})`, title: 'SRIG' },
        { value: 'agendas', label: `Agenda (${agendas.length})`, title: 'Agenda' },
        ...customCategories.map((category) => ({
            value: customTabValue(category),
            label: `${customTabLabel(category)} (${category.entries.length})`,
            title: category.name,
        })),
    ]
    const activeTabIndex = tabs.findIndex((tab) => tab.value === activeTab)

    return (
        <AppLayout>
            <Head title="Alignment Management" />
            <div className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between [&>div]:mb-2">
                    <Heading title="Alignment Management" description="Manage the SDG, SRIG, and Agenda tags available for research records." />
                    <Button className="shrink-0 self-start" onClick={() => setAddCategoryOpen(true)}>
                        <Plus className="mr-2 size-4" />
                        Add Alignment
                    </Button>
                </div>

                {errors.delete ? (
                    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errors.delete}
                    </div>
                ) : null}

                {/* Folder tabs + the panel they attach to.
                    --tab-surface is shared by the active tab, its shoulders and the panel. */}
                <div className="relative [--tab-surface:#ffffff] [--tab-shade:rgba(15,23,42,0.2)] dark:[--tab-surface:#0f172a] dark:[--tab-shade:rgba(0,0,0,0.45)]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
                        <TabsList className={TAB_LIST_CLASS}>
                            {tabs.map((tab, index) => {
                                const { zIndex, shadeClass } = getTabDepth(index, activeTabIndex)
                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        title={tab.title}
                                        className={`${TAB_TRIGGER_CLASS} ${shadeClass}`}
                                        style={{ zIndex, boxShadow: 'none' }}
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>

                        <div className="relative z-10 -mt-px rounded-b-[20px] rounded-t-none bg-[var(--tab-surface)] shadow-sm">
                            <div className="px-5 pb-5 pt-3 sm:p-6">
                                <TabsContent value="sdgs" className="mt-0">
                                    <AlignmentSection kind="sdgs" entries={sdgs} />
                                </TabsContent>
                                <TabsContent value="srigs" className="mt-0">
                                    <AlignmentSection kind="srigs" entries={srigs} />
                                </TabsContent>
                                <TabsContent value="agendas" className="mt-0">
                                    <AlignmentSection kind="agendas" entries={agendas} />
                                </TabsContent>
                                {customCategories.map((category) => (
                                    <TabsContent key={category.id} value={customTabValue(category)} className={`mt-0 ${FLATTEN_CARD_CLASS}`}>
                                        <CustomAlignmentSection category={category} onDeleted={() => setActiveTab('sdgs')} />
                                    </TabsContent>
                                ))}
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
            <CustomCategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} onCreated={(category) => setActiveTab(customTabValue(category))} />
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
        <div>
            <div className="min-w-0">
                <HeadingSmall title={`${label} entries`} description="These entries are immediately available in research upload and edit forms." />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {entries.length} {label} {entries.length === 1 ? 'entry' : 'entries'} found
                </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Same search bar as the User Management table */}
                <SearchBar
                    initialValue={search}
                    placeholder={`Search ${label} code, title, or description...`}
                    onSubmit={(query) => setSearch(query)}
                    logEndpoint={null}
                    className="w-full sm:w-3/5 sm:flex-none"
                />

                {/* Sort + Add sit together on the right */}
                <div className="flex w-full gap-3 sm:ml-auto sm:w-auto sm:items-center">
                    <Select value={sort} onValueChange={(value) => setSort(value as SortOrder)}>
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Sort entries" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="code-asc">Code order</SelectItem>
                            <SelectItem value="code-desc">Code order, descending</SelectItem>
                            <SelectItem value="most-used">Most used</SelectItem>
                            <SelectItem value="least-used">Least used</SelectItem>
                            <SelectItem value="unused">Unused only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 size-4" />
                        Add {label}
                    </Button>
                </div>
            </div>

            <div className="mt-4 min-w-0">
                {visibleEntries.length ? (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name / code</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium">Used by research</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {visibleEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 font-medium">{entry.name}</td>
                                        <td className="max-w-lg px-4 py-3 text-muted-foreground">{entry.description || '—'}</td>
                                        <td className="px-4 py-3">
                                            Used in {entry.researches_count} research record{entry.researches_count === 1 ? '' : 's'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setEditing(entry)} title={`Edit ${entry.name}`} aria-label={`Edit ${entry.name}`}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => destroy(kind, entry)}
                                                    title={`Delete ${entry.name}`}
                                                    aria-label={`Delete ${entry.name}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {entries.length ? `No ${label} entries match your search and filter.` : `No ${label} entries have been added yet.`}
                    </div>
                )}
            </div>

            <AlignmentDialog kind={kind} open={createOpen} onOpenChange={setCreateOpen} />
            <AlignmentDialog key={editing?.id ?? 'none'} kind={kind} entry={editing} open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }} />
        </div>
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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{edit ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
                    <DialogDescription>{edit ? `Update this ${label} entry.` : `Create a ${label} entry for research tagging.`}</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${kind}-name`}>Name / code</Label>
                        <Input id={`${kind}-name`} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        {form.errors.name ? <p className="text-sm text-destructive">{form.errors.name}</p> : null}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${kind}-description`}>Description</Label>
                        <Textarea id={`${kind}-description`} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />
                        {form.errors.description ? <p className="text-sm text-destructive">{form.errors.description}</p> : null}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>{edit ? 'Save changes' : `Add ${label}`}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
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