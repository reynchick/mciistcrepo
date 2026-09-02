import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import Heading from '@/components/heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type AlignmentEntry = { id: number; name: string; code?: string | null; description?: string | null }
type AlignmentCategory = { id: number; name: string; description?: string | null; entries: AlignmentEntry[] }

type Props = { categories: AlignmentCategory[] }

export default function ResearchAlignmentsIndexPage({ categories }: Props) {
  const categoryForm = useForm({ name: '', description: '' })

  return (
    <AppLayout>
      <Head title="Research Alignment Management" />

      <div className="space-y-6 p-4 sm:p-6">
        <Heading title="Research Alignment Management" description="Create and manage research alignment categories and entries." />

        <Card>
          <CardHeader>
            <CardTitle>Add alignment category</CardTitle>
            <CardDescription>Define the alignment categories available to research records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                categoryForm.post('/admin/research-alignments/categories', { preserveScroll: true })
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category-name">Category name</Label>
                  <Input id="category-name" value={categoryForm.data.name} onChange={(e) => categoryForm.setData('name', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea id="category-description" value={categoryForm.data.description} onChange={(e) => categoryForm.setData('description', e.target.value)} />
                </div>
              </div>

              <Button type="submit" disabled={categoryForm.processing}>Save category</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {categories.length ? categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          )) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No alignment categories created yet.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function CategoryCard({ category }: { category: AlignmentCategory }) {
  const entryForm = useForm({ name: '', code: '', description: '' })

  const deleteCategory = () => {
    if (window.confirm('Delete this category?')) {
      router.delete(`/admin/research-alignments/categories/${category.id}`)
    }
  }

  const deleteEntry = (entryId: number) => {
    if (window.confirm('Delete this alignment entry?')) {
      router.delete(`/admin/research-alignments/entries/${entryId}`)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{category.name}</CardTitle>
          {category.description ? <CardDescription>{category.description}</CardDescription> : null}
        </div>
        <Button variant="destructive" size="sm" type="button" onClick={deleteCategory}>Delete category</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`entry-name-${category.id}`}>Entry name</Label>
            <Input id={`entry-name-${category.id}`} value={entryForm.data.name} onChange={(e) => entryForm.setData('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`entry-code-${category.id}`}>Code</Label>
            <Input id={`entry-code-${category.id}`} value={entryForm.data.code} onChange={(e) => entryForm.setData('code', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`entry-description-${category.id}`}>Description</Label>
            <Input id={`entry-description-${category.id}`} value={entryForm.data.description} onChange={(e) => entryForm.setData('description', e.target.value)} />
          </div>
        </div>

        <Button
          type="button"
          onClick={() => entryForm.post(`/admin/research-alignments/categories/${category.id}/entries`, { preserveScroll: true })}
          disabled={entryForm.processing}
        >
          Save entry
        </Button>

        <div className="space-y-2">
          {category.entries.length ? category.entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{entry.name}</div>
                {entry.code ? <div className="text-xs text-muted-foreground">{entry.code}</div> : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => deleteEntry(entry.id)}>Remove</Button>
            </div>
          )) : <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No entries added yet.</div>}
        </div>
      </CardContent>
    </Card>
  )
}