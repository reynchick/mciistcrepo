import { useEffect, useMemo, useRef, useState } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import { type SharedData, type Faculty } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InputError from '@/components/input-error'
import UnsavedChangesModal from '@/components/modals/unsaved-changes-modal'
import SelectRS, { type MultiValue, type StylesConfig } from 'react-select'
import { ArrowLeft, Briefcase, GraduationCap, Mail, Phone, Save, User as UserIcon } from 'lucide-react'
import { useFormDraft } from '@/hooks/use-form-draft'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import { useEmailValidation } from '@/hooks/use-email-validation'
import { debounce, formatPhone } from '@/lib/utils'
import { validateEmailDomain, validateOrcid, validateContact } from '@/lib/validation'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  initial?: Partial<Faculty> & { id?: number }
  onCancelHref?: string
  onSuccessHref?: string
  specializationOptions?: Array<{ value: string; label: string }>
}

export default function FacultyForm({ mode, initial, onCancelHref = '/faculty', onSuccessHref, specializationOptions = [] }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((r) => r.name === 'Administrator') ?? auth.user.role === 'Administrator'
  const isFaculty = auth.user.role === 'Faculty' || auth.user.roles?.some((r) => r.name === 'Faculty')
  const isOwnProfile = !!(isFaculty && initial?.faculty_id && auth.user.faculty_id === initial.faculty_id)

  const { data, setData, post, put, processing, errors, reset } = useForm({
    faculty_id: initial?.faculty_id ?? '',
    first_name: initial?.first_name ?? '',
    middle_name: initial?.middle_name ?? '',
    last_name: initial?.last_name ?? '',
    position: initial?.position ?? '',
    designation: initial?.designation ?? '',
    email: initial?.email ?? '',
    orcid: initial?.orcid ?? '',
    contact_number: initial?.contact_number ?? '',
    educational_attainment: initial?.educational_attainment ?? '',
    field_of_specialization: initial?.field_of_specialization ?? '',
    research_interest: initial?.research_interest ?? '',
  })

  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({})
  const [globalError, setGlobalError] = useState<string | undefined>()
  const [globalSuccess, setGlobalSuccess] = useState<string | undefined>()

  const [specializations, setSpecializations] = useState<Array<{ value: string; label: string }>>(
    parseSpecializations(initial?.field_of_specialization)
  )

  // Custom hook for email validation
  const { emailStatus, checkEmailUnique } = useEmailValidation({
    mode,
    initialId: initial?.id,
    endpoint: '/users/check-email',
  })

  const draftKey = useMemo(() => (mode === 'create' ? 'faculty-form:draft:create' : `faculty-form:draft:edit:${initial?.id ?? 'unknown'}`), [mode, initial?.id])

  // Form draft management: warns on navigation, does NOT persist after browser close
  const { clearDraft, isDirty } = useFormDraft({ key: draftKey, data })

  // Unsaved changes warning
  const { showWarning, setShowWarning, handleLeave, handleStay, checkAndWarn, isLoading, setPendingAction, allowNextNavigationRef } = useUnsavedChangesWarning({
    isDirty: isDirty(),
  })

  // Intercept Inertia navigation and show custom confirmation modal
  useEffect(() => {
    const handleInertiaNavigationAttempt = (event: any) => {
      if (allowNextNavigationRef.current) {
        allowNextNavigationRef.current = false
        return
      }
      if (!isDirty()) return

      const visit = event.detail?.visit
      if (visit) {
        setPendingAction(() => () => router.visit(visit.url, { ...visit }))
      }
      setShowWarning(true)
      return false // cancel navigation; resume only if user confirms
    }

    const unsubscribe = router.on('before', handleInertiaNavigationAttempt)
    return unsubscribe
  }, [allowNextNavigationRef, isDirty, setPendingAction, setShowWarning])

  const positions = ['Professor', 'Associate Professor', 'Assistant Professor', 'Instructor']

  const canEdit = isAdmin || (isFaculty && isOwnProfile)
  const disableEmail = isFaculty && isOwnProfile && mode === 'edit' && !isAdmin

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(undefined)
    setGlobalSuccess(undefined)
    const clientErrs: Record<string, string | undefined> = {}
    if (!data.first_name) clientErrs.first_name = 'First name is required'
    if (!data.last_name) clientErrs.last_name = 'Last name is required'
    if (!data.position) clientErrs.position = 'Position is required'
    if (!data.designation) clientErrs.designation = 'Designation is required'
    if (!data.email) clientErrs.email = 'Email is required'
    if (data.email && !validateEmailDomain(data.email)) clientErrs.email = 'Email must end with @usep.edu.ph'
    if (!validateOrcid(data.orcid)) clientErrs.orcid = 'ORCID must be 0000-0000-0000-0000'
    if (!data.contact_number) clientErrs.contact_number = 'Contact number is required'
    const formatted = formatPhone(data.contact_number)
    if (!validateContact(formatted)) clientErrs.contact_number = 'Invalid Philippine mobile number format'
    if (!data.educational_attainment) clientErrs.educational_attainment = 'Educational attainment is required'
    const interestLen = (data.research_interest || '').trim().length
    if (interestLen < 50) clientErrs.research_interest = 'Research interest must be at least 50 characters'
    if (interestLen > 500) clientErrs.research_interest = 'Research interest must be at most 500 characters'
    setClientErrors(clientErrs)
    if (Object.values(clientErrs).some(Boolean)) {
      setGlobalError('Please fix the errors below')
      return
    }

    const payload = { ...data, contact_number: formatted, field_of_specialization: joinSpecializations(specializations) }
    const opts = {
      preserveScroll: true,
      onSuccess: () => {
        setGlobalSuccess('Profile saved')
        clearDraft()
        reset() // Reset form data to initial state so isDirty() returns false
        if (onSuccessHref) window.location.href = onSuccessHref
      },
      onError: () => setGlobalError('Failed to save. Please review errors.'),
    }
    Object.entries(payload).forEach(([k, v]) => setData(k as keyof typeof data, v as never))
    if (mode === 'create') post('/faculty', opts)
    else put(`/faculty/${initial?.id}`, opts)
  }

  const emailIndicator = (
    <span className="text-xs">
      {emailStatus === 'checking' && 'Checking…'}
      {emailStatus === 'available' && 'Available'}
      {emailStatus === 'taken' && 'Already in use'}
    </span>
  )

  const selectStyles: StylesConfig<{ value: string; label: string }, true> = {
    control: (p, s) => ({ ...p, minHeight: 42, borderColor: s.isFocused ? '#3b82f6' : '#d1d5db', borderRadius: 8, boxShadow: s.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none' }),
    multiValue: (p) => ({ ...p, backgroundColor: '#dbeafe', borderRadius: 6 }),
    multiValueLabel: (p) => ({ ...p, color: '#1e40af', fontSize: '0.875rem', padding: '2px 6px' }),
    multiValueRemove: (p) => ({ ...p, color: '#3b82f6', ':hover': { backgroundColor: '#3b82f6', color: 'white' } }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? '#3b82f6' : s.isFocused ? '#dbeafe' : 'white', color: s.isSelected ? 'white' : '#111827' }),
    menuPortal: (p) => ({ ...p, zIndex: 50 }),
  }

  return (
    <div className="space-y-6">
      <Head title={mode === 'create' ? 'Add New Faculty Member' : 'Edit Faculty Member'} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={onCancelHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{mode === 'create' ? 'Add New Faculty Member' : 'Edit Faculty Member'}</h1>
            <p className="text-muted-foreground">{mode === 'create' ? 'Create a new faculty member record' : 'Update faculty information'}</p>
          </div>
        </div>
      </div>

      {!canEdit && (
        <Alert variant="destructive">
          <AlertTitle>Insufficient permissions</AlertTitle>
          <AlertDescription>Read-only access. Use the profile view.</AlertDescription>
        </Alert>
      )}

      {globalError && (
        <Alert variant="destructive">
          <AlertTitle>Submission error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {globalSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{globalSuccess}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><UserIcon className="mr-2 h-5 w-5" />Personal Information</CardTitle>
            <CardDescription>Basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} aria-invalid={!!(errors.first_name || clientErrors.first_name)} />
                <InputError message={errors.first_name || clientErrors.first_name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} aria-invalid={!!errors.middle_name} />
                <InputError message={errors.middle_name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} aria-invalid={!!(errors.last_name || clientErrors.last_name)} />
                <InputError message={errors.last_name || clientErrors.last_name} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Phone className="mr-2 h-5 w-5" />Contact Information</CardTitle>
            <CardDescription>Email and phone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <div className="flex items-center gap-2">
                  <Input id="email" type="email" value={data.email} onChange={(e) => { setData('email', e.target.value); checkEmailUnique(e.target.value) }} onBlur={(e) => checkEmailUnique(e.target.value)} aria-invalid={!!(errors.email || clientErrors.email) || emailStatus === 'taken'} disabled={disableEmail} />
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="h-4 w-4" />{emailIndicator}</span>
                </div>
                <InputError message={errors.email || clientErrors.email} />
                <p className="text-xs text-muted-foreground">Must end with @usep.edu.ph</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input id="contact_number" value={data.contact_number} onChange={(e) => setData('contact_number', formatPhone(e.target.value))} aria-invalid={!!(errors.contact_number || clientErrors.contact_number)} placeholder="09XX-XXX-XXXX or +63 9XXXXXXXXX" />
                <InputError message={errors.contact_number || clientErrors.contact_number} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" />Professional Details</CardTitle>
            <CardDescription>Position, designation, ORCID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Select value={data.position} onValueChange={(v) => setData('position', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={errors.position || clientErrors.position} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input id="designation" value={data.designation} onChange={(e) => setData('designation', e.target.value)} aria-invalid={!!(errors.designation || clientErrors.designation)} placeholder="Department Chair, Program Coordinator" />
                <InputError message={errors.designation || clientErrors.designation} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orcid">ORCID</Label>
              <Input id="orcid" value={data.orcid} onChange={(e) => setData('orcid', e.target.value)} aria-invalid={!!(errors.orcid || clientErrors.orcid)} placeholder="0000-0000-0000-0000" />
              <InputError message={errors.orcid || clientErrors.orcid} />
              <p className="text-xs text-muted-foreground">Optional. Format: 0000-0000-0000-0000</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5" />Academic Information</CardTitle>
            <CardDescription>Education, specialization, research interests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="educational_attainment">Educational Attainment *</Label>
              <Input id="educational_attainment" value={data.educational_attainment} onChange={(e) => setData('educational_attainment', e.target.value)} aria-invalid={!!(errors.educational_attainment || clientErrors.educational_attainment)} placeholder="e.g., PhD in CS, MS in IT" />
              <InputError message={errors.educational_attainment || clientErrors.educational_attainment} />
            </div>
            <div className="grid gap-2">
              <Label>Field of Specialization *</Label>
              <SelectRS
                isMulti
                menuPortalTarget={document.body}
                styles={selectStyles}
                value={specializations}
                onChange={(vals: MultiValue<{ value: string; label: string }>) => setSpecializations(vals.map((v) => ({ value: v.value, label: v.label })))}
                options={specializationOptions}
                placeholder="Select or type to search"
              />
              <InputError message={clientErrors.field_of_specialization} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="research_interest">Research Interest *</Label>
              <Textarea id="research_interest" value={data.research_interest} onChange={(e) => setData('research_interest', e.target.value)} aria-invalid={!!(errors.research_interest || clientErrors.research_interest)} rows={5} />
              <div className="flex items-center justify-between">
                <InputError message={errors.research_interest || clientErrors.research_interest} />
                <span className="text-xs text-muted-foreground">{(data.research_interest || '').length}/500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 bg-background/70 backdrop-blur border-t p-3 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { 
            if (isDirty()) {
              setShowWarning(true)
            } else {
              reset()
              clearDraft()
              setGlobalSuccess('Cleared')
            }
          }} disabled={mode !== 'create'}>
            Clear
          </Button>
          <Button type="button" variant="outline" onClick={() => { 
            clearDraft()
            if (isDirty()) {
              const handleNavigate = () => {
                window.location.href = onCancelHref
              }
              checkAndWarn(handleNavigate)
            } else {
              window.location.href = onCancelHref
            }
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={processing || !canEdit}>
            <Save className="mr-2 h-4 w-4" />
            {processing ? 'Saving…' : mode === 'create' ? 'Create Faculty Member' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showWarning}
        onOpenChange={setShowWarning}
        onLeave={handleLeave}
        onStay={handleStay}
        isLoading={isLoading}
      />
    </div>
  )
}

function parseSpecializations(v?: string | null) {
  if (!v) return []
  return v.split(',').map((s) => s.trim()).filter(Boolean).map((s) => ({ value: s, label: s }))
}

function joinSpecializations(arr: Array<{ value: string; label: string }>) {
  return arr.map((a) => a.value).join(', ')
}
