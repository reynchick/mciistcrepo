import { useEffect, useRef, useState } from 'react'
import { router, useForm, usePage } from '@inertiajs/react'
import { Camera, Save, User } from 'lucide-react'
import { type Faculty, type SharedData } from '@/types'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FacultyTagInput from './faculty-tag-input'

type EditableFaculty = Faculty & { profile_picture?: string | null }

interface Props {
  faculty: EditableFaculty | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fields = [
  ['faculty_id', 'Faculty ID'],
  ['first_name', 'First name'],
  ['middle_name', 'Middle name'],
  ['last_name', 'Last name'],
  ['position', 'Position'],
  ['designation', 'Designation'],
  ['email', 'Email'],
  ['contact_number', 'Contact number'],
  ['orcid', 'ORCID'],
] as const

export default function FacultyEditModal({ faculty, open, onOpenChange }: Props) {
  const { isAdmin, isFaculty } = usePermissions()
  const { auth } = usePage<SharedData>().props
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [education, setEducation] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  const { data, setData, post, processing, errors, reset, transform } = useForm({
    faculty_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    position: '',
    designation: '',
    email: '',
    contact_number: '',
    orcid: '',
    educational_attainment: '',
    field_of_specialization: '',
    research_interest: '',
    photo: null as File | null,
  })

  useEffect(() => {
    if (!faculty || !open) return
    reset()
    setData({
      faculty_id: faculty.faculty_id ?? '',
      first_name: faculty.first_name ?? '',
      middle_name: faculty.middle_name ?? '',
      last_name: faculty.last_name ?? '',
      position: faculty.position ?? '',
      designation: faculty.designation ?? '',
      email: faculty.email ?? '',
      contact_number: faculty.contact_number ?? '',
      orcid: faculty.orcid ?? '',
      educational_attainment: faculty.educational_attainment ?? '',
      field_of_specialization: faculty.field_of_specialization ?? '',
      research_interest: faculty.research_interest ?? '',
      photo: null,
    })
    setEducation(parseTags(faculty.educational_attainment))
    setSpecializations(parseTags(faculty.field_of_specialization))
    setInterests(parseTags(faculty.research_interest))
    setPhotoPreview(null)
    setPhotoError('')
  }, [faculty, open, reset, setData])

  if (!faculty) return null

  const isSelfEdit = isFaculty() && !isAdmin() && auth.user.faculty_id === faculty.faculty_id
  const fullName = [faculty.first_name, faculty.middle_name, faculty.last_name].filter(Boolean).join(' ')

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
    transform((values) => {
      const taggedValues = {
        ...values,
        educational_attainment: education.join(', '),
        field_of_specialization: specializations.join(', '),
        research_interest: interests.join(', '),
      }
      if (!isSelfEdit) return { ...taggedValues, _method: 'put' as const }
      const { faculty_id, email, ...selfEditableValues } = taggedValues
      void faculty_id
      void email
      return { ...selfEditableValues, _method: 'put' as const }
    })
    post(isSelfEdit ? '/faculty/my-profile' : `/faculty/${faculty.id}`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false)
        router.get('/faculty', {}, { preserveScroll: true, preserveState: false })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90dvh,760px)] max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2"><User className="size-5 text-primary" />Edit faculty member</DialogTitle>
          <DialogDescription>Update {fullName}&apos;s profile.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhotoChange} />

              <div className="h-40 w-40 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="New profile preview" className="h-full w-full object-cover" />
                ) : faculty.profile_picture ? (
                  <img src={`/storage/${faculty.profile_picture}`} alt={`${fullName} profile`} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
                )}
              </div>

              <button
                type="button"
                aria-label="Change photo"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -right-1 -bottom-1 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/90 shadow hover:bg-background"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">JPG or PNG, up to 2 MB</p>
              {photoError && <p className="text-xs text-destructive">{photoError}</p>}
              {errors.photo && <p className="text-xs text-destructive">{errors.photo}</p>}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(([name, label]) => (
              <div key={name}>
                <Label htmlFor={`faculty-edit-${name}`}>{label}</Label>
                <Input id={`faculty-edit-${name}`} value={data[name]} disabled={isSelfEdit && (name === 'faculty_id' || name === 'email')} onChange={(event) => setData(name, event.target.value)} className="mt-1.5" />
                {errors[name] && <p className="mt-1 text-xs text-destructive">{errors[name]}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="faculty-edit-educational">Educational attainment</Label>
              <FacultyTagInput id="faculty-edit-educational" value={education} onChange={setEducation} placeholder="Type and press Enter" />
              {errors.educational_attainment && <p className="mt-1 text-xs text-destructive">{errors.educational_attainment}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="faculty-edit-specialization">Field of specialization</Label>
              <FacultyTagInput id="faculty-edit-specialization" value={specializations} onChange={setSpecializations} placeholder="Type and press Enter" />
              {errors.field_of_specialization && <p className="mt-1 text-xs text-destructive">{errors.field_of_specialization}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="faculty-edit-interests">Research interests</Label>
              <FacultyTagInput id="faculty-edit-interests" value={interests} onChange={setInterests} placeholder="Type and press Enter" disabled={isSelfEdit} />
              {errors.research_interest && <p className="mt-1 text-xs text-destructive">{errors.research_interest}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={processing}><Save className="mr-2 size-4" />{processing ? 'Saving…' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function parseTags(value?: string | null) {
  return value?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? []
}
