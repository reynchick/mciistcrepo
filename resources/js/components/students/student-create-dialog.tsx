import React, { type FormEvent, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import InputError from '@/components/input-error'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StudentCreateDialog({ open, onOpenChange }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: '',
    middle_name: '',
    last_name: '',
    student_id: '',
    email: '',
  })
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailUnique, setEmailUnique] = useState(true)
  const [studentIdChecked, setStudentIdChecked] = useState(false)
  const [studentIdUnique, setStudentIdUnique] = useState(true)

  React.useEffect(() => {
    if (!open) return
    reset()
    setEmailChecked(false)
    setEmailUnique(true)
    setStudentIdChecked(false)
    setStudentIdUnique(true)
  }, [open, reset])

  const handleEmailCheck = React.useCallback(async () => {
    if (!data.email) return
    try {
      const response = await fetch(`/admin/api/students/check-email?email=${encodeURIComponent(data.email)}`)
      const result = await response.json()
      setEmailUnique(result.unique)
      setEmailChecked(true)
    } catch (error) {
      console.error('Error checking email:', error)
    }
  }, [data.email])

  const handleStudentIdCheck = React.useCallback(async () => {
    if (!data.student_id) return
    try {
      const response = await fetch(`/admin/api/students/check-student-id?student_id=${encodeURIComponent(data.student_id)}`)
      const result = await response.json()
      setStudentIdUnique(result.unique)
      setStudentIdChecked(true)
    } catch (error) {
      console.error('Error checking student ID:', error)
    }
  }, [data.student_id])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    post('/admin/students', {
      preserveScroll: true,
      onSuccess: () => onOpenChange(false),
    })
  }

  const isFormValid =
    Boolean(
      data.first_name.trim() &&
      data.last_name.trim() &&
      data.student_id.trim() &&
      data.email.trim() &&
      emailUnique &&
      studentIdUnique,
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/40 backdrop-blur-sm"
        className="flex h-[min(90dvh,760px)] max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            Add Student
          </DialogTitle>
          <DialogDescription>Create a new student record and approve system access.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-900">
              <strong>Note:</strong> Students added here will be automatically approved for system access and can log in via Google SSO.
            </AlertDescription>
          </Alert>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
              <Input value={data.first_name} onChange={(event) => setData('first_name', event.target.value)} className="mt-1.5" placeholder="John" />
              <InputError message={errors.first_name} />
            </div>
            <div>
              <label className="block text-sm font-medium">Middle Name</label>
              <Input value={data.middle_name} onChange={(event) => setData('middle_name', event.target.value)} className="mt-1.5" placeholder="Michael" />
              <InputError message={errors.middle_name} />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
              <Input value={data.last_name} onChange={(event) => setData('last_name', event.target.value)} className="mt-1.5" placeholder="Doe" />
              <InputError message={errors.last_name} />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium">Student ID <span className="text-red-500">*</span></label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={data.student_id}
                onChange={(event) => {
                  setData('student_id', event.target.value)
                  setStudentIdChecked(false)
                }}
                placeholder="2023-00800"
                pattern="\d{4}-\d{5}"
                title="Format: YYYY-NNNNN (e.g., 2023-00800)"
              />
              {data.student_id && !studentIdChecked && (
                <Button type="button" variant="outline" onClick={handleStudentIdCheck} className="shrink-0">
                  <Check className="mr-2 size-4" /> Check
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Format: YYYY-NNNNN (e.g., 2023-00800)</p>
            {studentIdChecked && !studentIdUnique && <p className="mt-1 text-sm text-red-600">This student ID is already in use</p>}
            {studentIdChecked && studentIdUnique && <p className="mt-1 text-sm text-green-600">Student ID is available</p>}
            <InputError message={errors.student_id} />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium">Email <span className="text-red-500">*</span></label>
            <div className="mt-1.5 flex gap-2">
              <Input
                type="email"
                value={data.email}
                onChange={(event) => {
                  setData('email', event.target.value)
                  setEmailChecked(false)
                }}
                placeholder="john.doe@usep.edu.ph"
              />
              {data.email && !emailChecked && (
                <Button type="button" variant="outline" onClick={handleEmailCheck} className="shrink-0">
                  <Check className="mr-2 size-4" /> Check
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Must be a USeP email (@usep.edu.ph)</p>
            {emailChecked && !emailUnique && <p className="mt-1 text-sm text-red-600">This email is already in use</p>}
            {emailChecked && emailUnique && <p className="mt-1 text-sm text-green-600">Email is available</p>}
            <InputError message={errors.email} />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!isFormValid || processing}>
              {processing ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
