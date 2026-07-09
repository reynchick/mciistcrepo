import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, usePage, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import InputError from '@/components/input-error'
import RoleChangeConfirmation from '@/components/user/role-change-confirmation'
import PersonalInfoSection from '@/components/user/personal-info-section'
import ContactDetailsSection from '@/components/user/contact-details-section'
import AccountRoleSection from '@/components/user/account-role-section'
import UnsavedChangesModal from '@/components/modals/unsaved-changes-modal'
import { Save } from 'lucide-react'
import { type SharedData } from '@/types'
import { useFormDraft } from '@/hooks/use-form-draft'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import { useEmailValidation } from '@/hooks/use-email-validation'
import { useStudentIdValidation } from '@/hooks/use-student-id-validation'
import { useFacultyLookup } from '@/hooks/use-faculty-lookup'
import { formatPhone, formatNameCap } from '@/lib/utils'
import { validateName, validateEmailDomain, validateContact, validateStudentId } from '@/lib/validation'

type Mode = 'create' | 'edit'

type RoleOption = { id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }

type UserInitial = {
  id?: number
  first_name?: string
  middle_name?: string | null
  last_name?: string
  email?: string
  contact_number?: string | null
  student_id?: string | null
  faculty_id?: string | null
  roles?: Array<{ id: number; name: RoleOption['name'] }>
  created_at?: string
}

interface Props {
  mode: Mode
  initial?: UserInitial
  roles: RoleOption[]
  onCancelHref?: string
  onSuccessHref?: string
  adminCount?: number
}

export default function UserForm({ mode, initial, roles, onCancelHref = '/users', onSuccessHref, adminCount = 1 }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((r) => r.name === 'Administrator') ?? auth.user.role === 'Administrator'
  const isOwnAccount = !!(initial?.id && auth.user.id === initial.id)

  const { data, setData, post, put, processing, errors, reset } = useForm({
    first_name: initial?.first_name ?? '',
    middle_name: initial?.middle_name ?? '',
    last_name: initial?.last_name ?? '',
    email: initial?.email ?? '',
    contact_number: initial?.contact_number ?? '',
    role_ids: initial?.roles?.map((r) => r.id) ?? [],
    student_id: initial?.student_id ?? '',
    faculty_id: initial?.faculty_id ?? '',
  })

  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({})
  const [globalError, setGlobalError] = useState<string | undefined>()
  const [globalSuccess, setGlobalSuccess] = useState<string | undefined>()
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [nameEditedManually, setNameEditedManually] = useState(false)
  const [nameAutofilledFrom, setNameAutofilledFrom] = useState<string | null>(null)
  const [showRoleConfirmation, setShowRoleConfirmation] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // Custom hooks for validation and data fetching
  const { emailStatus, checkEmailUnique } = useEmailValidation({ mode, initialId: initial?.id })
  const { studentIdStatus, checkStudentIdUnique } = useStudentIdValidation({ mode, initialId: initial?.id })

  const selectedRoles = useMemo(() => roles.filter((r) => data.role_ids?.includes(r.id)), [roles, data.role_ids])
  const roleNames = useMemo(() => selectedRoles.map((r) => r.name), [selectedRoles])
  const isFacultyRole = roleNames.includes('Faculty')

  const handleFacultyFound = useCallback((json: { faculty_id: string; first_name?: string; middle_name?: string; last_name?: string }) => {
    setData('faculty_id', json.faculty_id ?? '')
    // Only auto-fill names if the user hasn't edited them and we haven't already auto-filled for this email
    const normalizedEmail = data.email.toLowerCase().trim()
    const canAutofillNames = !nameEditedManually && nameAutofilledFrom !== normalizedEmail
    if (canAutofillNames) {
      if (json.first_name) setData('first_name', json.first_name)
      if (json.middle_name) setData('middle_name', json.middle_name)
      if (json.last_name) setData('last_name', json.last_name)
      setNameAutofilledFrom(normalizedEmail)
    }
  }, [data.email, nameEditedManually, nameAutofilledFrom])

  const { facultyLookup } = useFacultyLookup({
    isFacultyRole,
    email: data.email,
    onFacultyFound: handleFacultyFound,
  })

  const draftKey = useMemo(() => (mode === 'create' ? 'user-form:draft:create' : `user-form:draft:edit:${initial?.id ?? 'unknown'}`), [mode, initial?.id])
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

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
      return false // cancel navigation; will resume if user confirms
    }

    const unsubscribe = router.on('before', handleInertiaNavigationAttempt)
    return unsubscribe
  }, [allowNextNavigationRef, isDirty, setPendingAction, setShowWarning])

  // Clear success message when user starts editing
  useEffect(() => {
    if (globalSuccess) setGlobalSuccess(undefined)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset name-autofill tracking when email changes
  useEffect(() => {
    setNameEditedManually(false)
    setNameAutofilledFrom(null)
  }, [data.email])

  // Focus management - move to first error field after submission
  useEffect(() => {
    const allErrors = { ...clientErrors, ...errors }
    const fieldOrder = ['first_name', 'last_name', 'email', 'contact_number', 'role_ids', 'student_id', 'faculty_id'] as const
    const firstErrorField = fieldOrder.find((f) => allErrors[f])

    if (firstErrorField) {
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.focus()
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [clientErrors, errors])

  const isStudentRole = roleNames.includes('Student')
  const hasAdminRole = roleNames.includes('Administrator')
  const hadAdminRole = useMemo(() => initial?.roles?.some((r) => r.name === 'Administrator') ?? false, [initial?.roles])
  const isLastAdminDemotion = mode === 'edit' && adminCount === 1 && hadAdminRole && !hasAdminRole

  // Compute role changes
  const addedRoles = useMemo(() => {
    const initialIds = initial?.roles?.map((r) => r.id) ?? []
    const newIds = data.role_ids ?? []
    return roles.filter((r) => !initialIds.includes(r.id) && newIds.includes(r.id))
  }, [initial?.roles, data.role_ids, roles])

  const removedRoles = useMemo(() => {
    const initialIds = initial?.roles?.map((r) => r.id) ?? []
    const newIds = data.role_ids ?? []
    return roles.filter((r) => initialIds.includes(r.id) && !newIds.includes(r.id))
  }, [initial?.roles, data.role_ids, roles])

  const hasRoleChanges = addedRoles.length > 0 || removedRoles.length > 0

  // Live validation - only validate if field has error
  const liveValidateField = (fieldName: string, value: any) => {
    const hasError = clientErrors[fieldName] || (errors as Record<string, string | undefined>)[fieldName]
    if (!hasError) return

    let error: string | undefined
    switch (fieldName) {
      case 'first_name':
        error = validateName(value, true)
        break
      case 'middle_name':
        error = validateName(value || '')
        break
      case 'last_name':
        error = validateName(value, true)
        break
      case 'email':
        if (!value) error = 'Email is required'
        else if (!validateEmailDomain(value)) error = 'Must use @usep.edu.ph email'
        break
      case 'contact_number':
        if (value && !validateContact(formatPhone(value))) error = 'Invalid Philippine mobile number format'
        break
      case 'student_id':
        if (isStudentRole) error = validateStudentId(value)
        break
      case 'role_ids':
        if (!value || value.length === 0) error = 'Select at least one role'
        break
    }

    if (!error && clientErrors[fieldName]) {
      setClientErrors((prev) => ({ ...prev, [fieldName]: undefined }))
    }
  }

  // Blur validation - validate format on blur
  const blurValidateField = (fieldName: string, value: any) => {
    const hasContent = Array.isArray(value) ? value.length > 0 : !!value?.trim?.() || !!value
    const hasExistingError = !!(clientErrors[fieldName] || (errors as Record<string, string | undefined>)[fieldName])

    if (hasContent || hasExistingError) {
      setTouchedFields((prev) => ({ ...prev, [fieldName]: true }))
    }

    let error: string | undefined
    switch (fieldName) {
      case 'first_name':
        error = validateName(value, true)
        break
      case 'middle_name':
        error = validateName(value || '')
        break
      case 'last_name':
        error = validateName(value, true)
        break
      case 'email':
        if (!value) error = 'Email is required'
        else if (!validateEmailDomain(value)) error = 'Must use @usep.edu.ph email'
        break
      case 'contact_number':
        if (value && !validateContact(formatPhone(value))) error = 'Invalid Philippine mobile number format'
        break
    }

    if (error && hasContent) {
      setClientErrors((prev) => ({ ...prev, [fieldName]: error }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(undefined)
    setGlobalSuccess(undefined)

    // Mark all fields as touched on submit
    setTouchedFields({
      first_name: true,
      last_name: true,
      email: true,
      contact_number: true,
      role_ids: true,
      student_id: true,
      faculty_id: true,
    })

    const clientErrs: Record<string, string | undefined> = {}
    const isFaculty = isFacultyRole
    clientErrs.first_name = validateName(data.first_name, true)
    clientErrs.middle_name = validateName(data.middle_name || '')
    clientErrs.last_name = validateName(data.last_name, true)
    if (!data.email) clientErrs.email = 'Email is required'
    if (data.email && !validateEmailDomain(data.email)) clientErrs.email = 'Must use @usep.edu.ph email'
    const formattedContact = formatPhone(data.contact_number)
    if (data.contact_number && !validateContact(formattedContact)) {
      clientErrs.contact_number = 'Invalid Philippine mobile number format'
    }

    if (!data.role_ids || data.role_ids.length === 0) clientErrs.role_ids = 'Select at least one role'

    // Enforce Faculty and Student mutual exclusivity (defense in depth)
    if (isStudentRole && isFaculty) {
      clientErrs.role_ids = 'A user cannot have both Faculty and Student roles'
    }

    if (isStudentRole) clientErrs.student_id = validateStudentId(data.student_id)
    if (isFaculty && facultyLookup.status !== 'found') clientErrs.faculty_id = 'Faculty email not found in faculty records'

    setClientErrors(clientErrs)
    if (Object.values(clientErrs).some(Boolean)) {
      const firstErrorField = ['first_name', 'last_name', 'email', 'contact_number', 'role_ids', 'student_id', 'faculty_id'].find(
        (f) => clientErrs[f]
      )
      if (firstErrorField) document.getElementById(firstErrorField)?.focus()
      return
    }

    // If there are role changes in edit mode, show confirmation dialog
    if (mode === 'edit' && hasRoleChanges && !pendingSubmit) {
      setPendingSubmit(true)
      setShowRoleConfirmation(true)
      return
    }

    // Allow next navigation during submission to prevent modal from appearing
    allowNextNavigationRef.current = true

    // Proceed with actual submission
    const payload: Record<string, unknown> = {
      first_name: formatNameCap(data.first_name.trim()),
      middle_name: data.middle_name?.trim() || '',
      last_name: formatNameCap(data.last_name.trim()),
      email: data.email.trim().toLowerCase(),
      contact_number: formattedContact,
      role_ids: data.role_ids ?? [],
      student_id: isStudentRole ? data.student_id.trim() : null,
      faculty_id: isFaculty ? data.faculty_id || null : null,
    }

    Object.entries(payload).forEach(([k, v]) => setData(k as keyof typeof data, v as never))
    const opts = {
      preserveScroll: true,
      onSuccess: () => {
        setGlobalSuccess(mode === 'create' ? 'User created successfully' : 'User updated successfully')
        clearDraft()
        reset()
        setPendingSubmit(false)

        // Auto-dismiss success and redirect after 2 seconds
        setTimeout(() => {
          setGlobalSuccess(undefined)
          if (onSuccessHref) window.location.href = onSuccessHref
        }, 2000)
      },
      onError: (errors: any) => {
        setPendingSubmit(false)
        // Only show global error for non-field errors
        const hasFieldErrors = Object.keys(errors).some((key) =>
          ['first_name', 'last_name', 'middle_name', 'email', 'contact_number', 'role_ids', 'student_id', 'faculty_id'].includes(key)
        )
        if (!hasFieldErrors) {
          setGlobalError('Submission failed. Please try again or contact support.')
        }
      },
    }
    if (mode === 'create') post('/users', opts)
    else if (initial?.id) put(`/users/${initial.id}`, opts)
  }

  const handleConfirmRoleChange = () => {
    setPendingSubmit(false)
    setShowRoleConfirmation(false)

    // Allow next navigation during submission to prevent modal from appearing
    allowNextNavigationRef.current = true

    // Re-submit the form without the role check
    const payload: Record<string, unknown> = {
      first_name: formatNameCap(data.first_name.trim()),
      middle_name: data.middle_name?.trim() || '',
      last_name: formatNameCap(data.last_name.trim()),
      email: data.email.trim().toLowerCase(),
      contact_number: formatPhone(data.contact_number),
      role_ids: data.role_ids ?? [],
      student_id: isStudentRole ? data.student_id.trim() : null,
      faculty_id: isFacultyRole ? data.faculty_id || null : null,
    }

    // Update form state with the payload before submitting
    Object.entries(payload).forEach(([k, v]) => setData(k as keyof typeof data, v as never))
    const opts = {
      preserveScroll: true,
      onSuccess: () => {
        setGlobalSuccess(mode === 'create' ? 'User created successfully' : 'User updated successfully')
        clearDraft()
        reset()

        // Auto-dismiss success and redirect after 2 seconds
        setTimeout(() => {
          setGlobalSuccess(undefined)
          if (onSuccessHref) window.location.href = onSuccessHref
        }, 2000)
      },
      onError: (errors: any) => {
        // Only show global error for non-field errors
        const hasFieldErrors = Object.keys(errors).some((key) =>
          ['first_name', 'last_name', 'middle_name', 'email', 'contact_number', 'role_ids', 'student_id', 'faculty_id'].includes(key)
        )
        if (!hasFieldErrors) {
          setGlobalError('Submission failed. Please try again or contact support.')
        }
      },
    }
    if (mode === 'create') post('/users', opts)
    else if (initial?.id) put(`/users/${initial.id}`, opts)
  }

  const canEditRole = isAdmin

  return (
    <div className="space-y-6">
      {globalError && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>Submission error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {globalSuccess && (
          <Alert role="status" aria-live="polite">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{globalSuccess}</AlertDescription>
        </Alert>
      )}

      {mode === 'create' && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <AlertTitle className="text-blue-900 dark:text-blue-100">Account Creation Notice</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            An account creation email with login instructions will be automatically sent to the user at the email address provided.
            {isFacultyRole && (
              <span> Faculty accounts must match an existing faculty record, and the name fields will be taken from that record.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PersonalInfoSection
          mode={mode}
          data={{
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
          }}
          errors={errors}
          clientErrors={clientErrors}
          touchedFields={touchedFields}
          onDataChange={(field, value) => setData(field as keyof typeof data, value as never)}
          onBlurValidate={blurValidateField}
          onLiveValidate={liveValidateField}
          onNameEdit={() => setNameEditedManually(true)}
        />

        <ContactDetailsSection
          data={{
            email: data.email,
            contact_number: data.contact_number,
          }}
          errors={errors}
          clientErrors={clientErrors}
          touchedFields={touchedFields}
          emailStatus={emailStatus}
          onDataChange={(field, value) => setData(field as keyof typeof data, value as never)}
          onBlurValidate={blurValidateField}
          onLiveValidate={liveValidateField}
          onEmailBlur={checkEmailUnique}
        />

        <AccountRoleSection
          mode={mode}
          data={{
            role_ids: data.role_ids,
            student_id: data.student_id,
            faculty_id: data.faculty_id,
          }}
          roles={roles}
          errors={errors}
          clientErrors={clientErrors}
          touchedFields={touchedFields}
          studentIdStatus={studentIdStatus}
          facultyLookup={facultyLookup}
          canEditRole={canEditRole}
          isLastAdminDemotion={isLastAdminDemotion}
          onDataChange={(field, value) => setData(field as keyof typeof data, value as never)}
          onBlurValidate={blurValidateField}
          onLiveValidate={liveValidateField}
          onStudentIdBlur={checkStudentIdUnique}
          onTouchedChange={setTouchedFields}
        />

        {/* Role Change Confirmation Dialog */}
        <RoleChangeConfirmation
          open={showRoleConfirmation}
          onOpenChange={setShowRoleConfirmation}
          onConfirm={handleConfirmRoleChange}
          addedRoles={addedRoles}
          removedRoles={removedRoles}
          isLastAdminWarning={isLastAdminDemotion}
          isOwnAccountWarning={isOwnAccount && hasRoleChanges}
          isLoading={processing}
        />

        {/* Mobile-first action bar: stacked on mobile, side-by-side on desktop */}
        <div className="sticky bottom-0 z-10 bg-background/70 backdrop-blur border-t p-3 md:p-4 flex flex-col-reverse md:flex-row md:items-center md:justify-end gap-2 md:gap-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {/* Save Button - Primary action, full-width on mobile */}
          <Button 
            type="submit" 
            disabled={processing || isLastAdminDemotion || Object.values(clientErrors).some(Boolean)}
            className={['w-full md:w-auto', processing ? 'opacity-75' : ''].filter(Boolean).join(' ')}
          >
            <Save className="mr-2 h-4 w-4" />
            <span className="md:hidden">{processing ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}</span>
            <span className="hidden md:inline">{processing ? 'Saving…' : mode === 'create' ? 'Create User' : 'Save Changes'}</span>
          </Button>

          {/* Cancel Button - Secondary action, full-width on mobile */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              clearDraft()
              if (isDirty()) {
                const handleNavigate = () => {
                  window.location.href = onCancelHref
                }
                checkAndWarn(handleNavigate)
              } else {
                window.location.href = onCancelHref
              }
            }}
            disabled={processing}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>

          {/* Reset Button - Hidden on mobile, visible on lg+ */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => { 
              if (isDirty()) {
                setShowWarning(true)
              } else {
                reset()
                clearDraft()
                setGlobalSuccess('Cleared')
              }
            }} 
            disabled={mode !== 'create' || processing}
            className="hidden lg:inline-flex"
          >
            Reset
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

      {/* Accessibility announcements */}
      {Object.values(clientErrors).some(Boolean) && (
        <div className="sr-only" role="alert" aria-live="polite">
          Form has {Object.values(clientErrors).filter(Boolean).length} error(s). Please correct them before submitting.
        </div>
      )}
      {globalSuccess && (
        <div className="sr-only" role="status" aria-live="polite">
          {globalSuccess}
        </div>
      )}
    </div>
  )
}
