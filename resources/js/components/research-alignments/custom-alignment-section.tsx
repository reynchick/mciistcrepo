import { router, useForm } from '@inertiajs/react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ConfirmationModal from '@/components/modals/confirmation-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export type CustomEntry = { id: number; name: string; description: string | null; researches_count: number }
export type CustomCategory = { id: number; name: string; label: string | null; description: string | null; entries: CustomEntry[] }

type SortOrder = 'code-asc' | 'code-desc' | 'most-used' | 'least-used' | 'unused'

const BASE_URL = '/admin/research-alignments/custom-categories'

export const customTabValue = (category: CustomCategory) => `custom-${category.id}`
export const customTabLabel = (category: CustomCategory) => category.label || category.name

const requestOptions = { preserveScroll: true, preserveState: true }

/** Promise wrapper so ConfirmationModal shows its loading state until the request finishes. */
function destroyRequest(url: string, onSuccess?: () => void): Promise<void> {
  return new Promise((resolve) => router.delete(url, { ...requestOptions, onSuccess, onFinish: () => resolve() }))
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function CustomCategoryDialog({ category, open, onOpenChange, onCreated }: { category?: CustomCategory | null; open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (category: CustomCategory) => void }) {
  const form = useForm({ name: category?.name ?? '', label: category?.label ?? '', description: category?.description ?? '' })
  const edit = Boolean(category)

  const close = (next: boolean) => {
    if (!next) {
      form.reset()
      form.clearErrors()
    }
    onOpenChange(next)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (category) {
      form.put(`${BASE_URL}/${category.id}`, { ...requestOptions, onSuccess: () => close(false) })
      return
    }
    form.post(BASE_URL, {
      ...requestOptions,
      onSuccess: (page) => {
        const categories = ((page.props as { customCategories?: CustomCategory[] }).customCategories ?? [])
        const created = categories.reduce<CustomCategory | null>((latest, item) => (!latest || item.id > latest.id ? item : latest), null)
        close(false)
        if (created) onCreated?.(created)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? 'Edit alignment category' : 'Add alignment category'}</DialogTitle>
          <DialogDescription>{edit ? 'Rename this alignment category or update its details.' : 'Create a new alignment category, such as “National Development Priority”. It appears as a new tab.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="custom-category-name">Category name</Label>
            <Input id="custom-category-name" value={form.data.name} maxLength={100} onChange={(event) => form.setData('name', event.target.value)} placeholder="e.g. National Development Priority" aria-invalid={Boolean(form.errors.name)} />
            <FieldError message={form.errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-category-label">Short label <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="custom-category-label" value={form.data.label} maxLength={30} onChange={(event) => form.setData('label', event.target.value)} placeholder="e.g. NDP" aria-invalid={Boolean(form.errors.label)} />
            <p className="text-xs text-muted-foreground">Used as the tab label when the name is long.</p>
            <FieldError message={form.errors.label} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-category-description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="custom-category-description" value={form.data.description} maxLength={1000} onChange={(event) => form.setData('description', event.target.value)} aria-invalid={Boolean(form.errors.description)} />
            <FieldError message={form.errors.description} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={form.processing}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CustomAlignmentSection({ category, onDeleted }: { category: CustomCategory; onDeleted: () => void }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CustomEntry | null>(null)
  const [deleting, setDeleting] = useState<CustomEntry | null>(null)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('code-asc')
  const entries = category.entries
  const label = customTabLabel(category)
  const visibleEntries = useMemo(() => filterAndSort(entries, search, sort), [entries, search, sort])
  const categoryHasEntries = entries.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <CardTitle>{category.name} entries</CardTitle>
          <CardDescription>{category.description || 'Custom alignment category. Entries are not yet available in research upload and edit forms.'}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditCategoryOpen(true)}><Pencil className="mr-2 size-4" />Edit category</Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteCategoryOpen(true)}><Trash2 className="mr-2 size-4" />Delete category</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Add entry</Button>
        </div>
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
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Name / code</th><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Used by research</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {visibleEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium">{entry.name}</td>
                    <td className="max-w-lg px-4 py-3 text-muted-foreground">{entry.description || '—'}</td>
                    <td className="px-4 py-3">Used in {entry.researches_count} research record{entry.researches_count === 1 ? '' : 's'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(entry)} title={`Edit ${entry.name}`} aria-label={`Edit ${entry.name}`}><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleting(entry)} title={`Delete ${entry.name}`} aria-label={`Delete ${entry.name}`}><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{entries.length ? `No ${label} entries match your search and filter.` : `No ${label} entries have been added yet.`}</div>}
      </CardContent>

      <CustomEntryDialog category={category} open={createOpen} onOpenChange={setCreateOpen} />
      <CustomEntryDialog key={editing?.id ?? 'none'} category={category} entry={editing} open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }} />
      <CustomCategoryDialog key={`edit-${category.id}-${category.name}-${category.label ?? ''}`} category={category} open={editCategoryOpen} onOpenChange={setEditCategoryOpen} />

      <ConfirmationModal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title={`Delete ${label} entry`}
        description={deleting && deleting.researches_count > 0
          ? `${deleting.researches_count} research record(s) use “${deleting.name}”, so it cannot be deleted.`
          : `Delete “${deleting?.name ?? ''}”? This action cannot be undone.`}
        confirmText="Delete"
        danger
        confirmDisabled={(deleting?.researches_count ?? 0) > 0}
        onConfirm={() => deleting ? destroyRequest(`${BASE_URL}/${category.id}/entries/${deleting.id}`) : undefined}
      />
      <ConfirmationModal
        open={deleteCategoryOpen}
        onOpenChange={setDeleteCategoryOpen}
        title="Delete alignment category"
        description={categoryHasEntries
          ? `“${category.name}” still has ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}. Delete its entries before deleting the category.`
          : `Delete the “${category.name}” category? This action cannot be undone.`}
        confirmText="Delete category"
        danger
        confirmDisabled={categoryHasEntries}
        onConfirm={() => destroyRequest(`${BASE_URL}/${category.id}`, onDeleted)}
      />
    </Card>
  )
}

function CustomEntryDialog({ category, entry, open, onOpenChange }: { category: CustomCategory; entry?: CustomEntry | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const form = useForm({ name: entry?.name ?? '', description: entry?.description ?? '' })
  const edit = Boolean(entry)
  const label = customTabLabel(category)

  const close = (next: boolean) => {
    if (!next) {
      form.reset()
      form.clearErrors()
    }
    onOpenChange(next)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const options = { ...requestOptions, onSuccess: () => close(false) }
    if (entry) form.put(`${BASE_URL}/${category.id}/entries/${entry.id}`, options)
    else form.post(`${BASE_URL}/${category.id}/entries`, options)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? `Edit ${label} entry` : `Add ${label} entry`}</DialogTitle>
          <DialogDescription>{edit ? `Update this ${category.name} entry.` : `Create an entry in ${category.name}.`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`custom-${category.id}-name`}>Name / code</Label>
            <Input id={`custom-${category.id}-name`} value={form.data.name} maxLength={255} onChange={(event) => form.setData('name', event.target.value)} placeholder="e.g. NDP1: Inclusive Growth" aria-invalid={Boolean(form.errors.name)} />
            <FieldError message={form.errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`custom-${category.id}-description`}>Description</Label>
            <Textarea id={`custom-${category.id}-description`} value={form.data.description} maxLength={1000} onChange={(event) => form.setData('description', event.target.value)} aria-invalid={Boolean(form.errors.description)} />
            <FieldError message={form.errors.description} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={form.processing}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function filterAndSort(entries: CustomEntry[], search: string, sort: SortOrder): CustomEntry[] {
  const query = search.trim().toLocaleLowerCase()
  const matching = entries.filter((entry) => !query || `${entry.name} ${entry.description ?? ''}`.toLocaleLowerCase().includes(query))

  if (sort === 'unused') return matching.filter((entry) => entry.researches_count === 0).sort(compareCode)
  if (sort === 'most-used') return matching.sort((a, b) => b.researches_count - a.researches_count || compareCode(a, b))
  if (sort === 'least-used') return matching.sort((a, b) => a.researches_count - b.researches_count || compareCode(a, b))
  return matching.sort(sort === 'code-desc' ? (a, b) => compareCode(b, a) : compareCode)
}

/** Same ordering as the built-in tabs: by the first number in the name, then alphabetically. */
function compareCode(a: CustomEntry, b: CustomEntry): number {
  const aNumber = Number(a.name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  const bNumber = Number(b.name.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER)
  return aNumber - bNumber || a.name.localeCompare(b.name)
}
