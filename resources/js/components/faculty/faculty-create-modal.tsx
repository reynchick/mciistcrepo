import { useRef, useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import { Briefcase, Camera, Save, User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import InputError from '@/components/input-error'
import FacultyTagInput from './faculty-tag-input'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// [field name, label, spans the full row?]
// Rearranged to mirror the reference layout's rhythm:
// full-width identifier -> paired short fields -> full-width fields at the end.
const fields = [
  ['faculty_id', 'Faculty ID', true],
  ['first_name', 'First name', false],
  ['last_name', 'Last name', false],
  ['middle_name', 'Middle name', false],
  ['position', 'Position', false],
  ['designation', 'Designation', false],
  ['contact_number', 'Contact number', false],
  ['email', 'Email', true],
  ['orcid', 'ORCID', true],
] as const

export default function FacultyCreateModal({ open, onOpenChange }: Props) {
  const { data, setData, post, processing, errors, reset, transform } = useForm({
    faculty_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    position: '',
    designation: '',
    email: '',
    orcid: '',
    contact_number: '',
    educational_attainment: '',
    field_of_specialization: '',
    research_interest: '',
    photo: null as File | null,
  })
  const [education, setEducation] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')

  // Live preview text shown in the right panel
  const previewName = [data.first_name, data.middle_name, data.last_name].filter((part) => part.trim()).join(' ')

  const close = () => {
    reset()
    setEducation([])
    setSpecializations([])
    setInterests([])
    setPhotoPreview(null)
    setPhotoError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setPhotoError('Choose a JPG or PNG image smaller than 2 MB.')
      event.target.value = ''
      return
    }
    setPhotoError('')
    setData('photo', file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    transform((values) => ({
      ...values,
      educational_attainment: education.join(', '),
      field_of_specialization: specializations.join(', '),
      research_interest: interests.join(', '),
    }))
    post('/faculty', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        close()
        router.get('/faculty', {}, { preserveState: false, preserveScroll: true })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90dvh,720px)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:!max-w-5xl">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" />Add new faculty member</DialogTitle>
          <DialogDescription>Create a faculty profile without leaving the directory.</DialogDescription>
        </DialogHeader>

        {/* The form wraps both the scrolling body and the footer bar so the submit button works from the footer */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Body: fields on the left, dashed divider, live preview on the right */}
          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px]">
            {/* Left: form fields */}
            <div className="px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(([name, label, wide]) => (
                  <div key={name} className={wide ? 'sm:col-span-2' : undefined}>
                    <Label htmlFor={`faculty-create-${name}`}>{label}</Label>
                    <Input id={`faculty-create-${name}`} value={data[name]} onChange={(event) => setData(name, event.target.value)} className="mt-1.5" />
                    <InputError message={errors[name]} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Label htmlFor="faculty-create-educational">Educational attainment</Label>
                  <FacultyTagInput id="faculty-create-educational" value={education} onChange={setEducation} placeholder="Type and press Enter" />
                  <InputError message={errors.educational_attainment} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="faculty-create-specialization">Field of specialization</Label>
                  <FacultyTagInput id="faculty-create-specialization" value={specializations} onChange={setSpecializations} placeholder="Type and press Enter" />
                  <InputError message={errors.field_of_specialization} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="faculty-create-interests">Research interests</Label>
                  <FacultyTagInput id="faculty-create-interests" value={interests} onChange={setInterests} placeholder="Type and press Enter" />
                  <InputError message={errors.research_interest} />
                </div>
              </div>
            </div>

            {/* Right: preview panel (on top on small screens) */}
            <aside className="order-first border-b border-dashed px-6 py-5 md:order-none md:border-b-0 md:border-l">
              <div className="flex flex-col items-center md:sticky md:top-5">
                <p className="mb-4 text-xs text-muted-foreground">Preview</p>

                <div className="relative">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhotoChange} />
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {photoPreview ? (
                      <img src={photoPreview} alt="New profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Add profile photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 shadow hover:bg-background"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 max-w-full break-words text-center text-base font-semibold">
                  {previewName || <span className="text-muted-foreground">Faculty name</span>}
                </p>
                <p className="mt-0.5 max-w-full break-words text-center text-sm text-muted-foreground">
                  {data.position.trim() || 'Position'}
                </p>
                <span className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <Briefcase className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{data.designation.trim() || 'Designation'}</span>
                </span>

                <p className="mt-4 text-xs text-muted-foreground">JPG or PNG, up to 2 MB</p>
                {photoError && <p className="text-center text-xs text-destructive">{photoError}</p>}
                {errors.photo && <p className="text-center text-xs text-destructive">{errors.photo}</p>}
              </div>
            </aside>
          </div>

          {/* Footer bar: note on the left, actions on the right */}
          <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
            <p className="hidden text-xs text-muted-foreground sm:block">Review the preview before saving.</p>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={processing}><Save className="mr-2 size-4" />{processing ? 'Saving...' : 'Create faculty member'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}