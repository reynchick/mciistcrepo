import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import InputError from '@/components/input-error'
import { Smartphone, ShieldAlert, ShieldCheck } from 'lucide-react'

type RoleOption = { id: number; name: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'; description?: string }

interface AccountRoleSectionProps {
  mode: 'create' | 'edit'
  data: {
    role_ids: number[]
    student_id: string
    faculty_id: string
  }
  roles: RoleOption[]
  errors: Record<string, string | undefined>
  clientErrors: Record<string, string | undefined>
  touchedFields: Record<string, boolean>
  studentIdStatus: 'idle' | 'checking' | 'available' | 'taken' | 'error'
  facultyLookup: { status: 'idle' | 'checking' | 'found' | 'not-found' | 'error'; facultyId?: string }
  canEditRole: boolean
  isLastAdminDemotion: boolean
  onDataChange: (field: string, value: any) => void
  onBlurValidate: (field: string, value: any) => void
  onLiveValidate: (field: string, value: any) => void
  onStudentIdBlur: (studentId: string) => void
  onTouchedChange: (fields: Record<string, boolean>) => void
}

export default function AccountRoleSection({
  mode,
  data,
  roles,
  errors,
  clientErrors,
  touchedFields,
  studentIdStatus,
  facultyLookup,
  canEditRole,
  isLastAdminDemotion,
  onDataChange,
  onBlurValidate,
  onLiveValidate,
  onStudentIdBlur,
  onTouchedChange,
}: AccountRoleSectionProps) {
  const selectedRoles = roles.filter((r) => data.role_ids?.includes(r.id))
  const roleNames = selectedRoles.map((r) => r.name)
  const isStudentRole = roleNames.includes('Student')
  const isFacultyRole = roleNames.includes('Faculty')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="mr-2 h-5 w-5" />
          Account Role
        </CardTitle>
        <CardDescription>Assign role and identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* Mobile-first: 1 column on mobile, 2 on tablet+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Roles Selection */}
          <div className="grid gap-3">
            <Label htmlFor="roles" className="text-sm md:text-base font-medium">
              Roles
              <abbr title="required" className="ml-1 text-red-600 no-underline cursor-help">
                *
              </abbr>
            </Label>
            <div className="space-y-2 md:space-y-2.5">
              {roles.map((r) => {
                const checked = data.role_ids?.includes(r.id)
                // Determine if checkbox should be disabled due to mutual exclusivity
                const isFacultyRole = r.name === 'Faculty'
                const isStudentRole = r.name === 'Student'
                const userHasStudentRole = data.role_ids?.some((id) =>
                  roles.find((role) => role.id === id)?.name === 'Student'
                )
                const userHasFacultyRole = data.role_ids?.some((id) =>
                  roles.find((role) => role.id === id)?.name === 'Faculty'
                )
                const shouldDisableFaculty = !checked && isFacultyRole && userHasStudentRole
                const shouldDisableStudent = !checked && isStudentRole && userHasFacultyRole
                const isDisabledByMutualExclusivity = shouldDisableFaculty || shouldDisableStudent

                return (
                  <label
                    key={r.id}
                    className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Checkbox
                      id={`role-${r.id}`}
                      checked={!!checked}
                      onCheckedChange={(checkedVal) => {
                        if (!canEditRole) return
                        onTouchedChange({ ...touchedFields, role_ids: true })

                        // If unchecking, just remove the role
                        if (checkedVal === false) {
                          const next = (data.role_ids ?? []).filter((id) => id !== r.id)
                          onDataChange('role_ids', next)
                          onLiveValidate('role_ids', next)
                          return
                        }

                        // If checking Faculty, remove Student
                        if (isFacultyRole && userHasStudentRole) {
                          const studentRoleId = roles.find((role) => role.name === 'Student')?.id
                          let next = (data.role_ids ?? []).filter((id) => id !== studentRoleId)
                          next = [...next, r.id]
                          onDataChange('role_ids', next)
                          onLiveValidate('role_ids', next)
                          return
                        }

                        // If checking Student, remove Faculty
                        if (isStudentRole && userHasFacultyRole) {
                          const facultyRoleId = roles.find((role) => role.name === 'Faculty')?.id
                          let next = (data.role_ids ?? []).filter((id) => id !== facultyRoleId)
                          next = [...next, r.id]
                          onDataChange('role_ids', next)
                          onLiveValidate('role_ids', next)
                          return
                        }

                        // Normal case: just add the role
                        const next = [...(data.role_ids ?? []), r.id]
                        onDataChange('role_ids', next)
                        onLiveValidate('role_ids', next)
                      }}
                      disabled={!canEditRole || isDisabledByMutualExclusivity}
                      className="h-5 w-5 mt-0.5"
                      aria-describedby={
                        touchedFields.role_ids && (errors.role_ids || clientErrors.role_ids) ? 'role_ids-error' : undefined
                      }
                    />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm md:text-base font-medium leading-tight">{r.name}</span>
                      {r.description && (
                        <span className="text-xs text-muted-foreground leading-tight">{r.description}</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
            <InputError
              id="role_ids-error"
              message={touchedFields.role_ids ? errors.role_ids || clientErrors.role_ids : undefined}
              className="text-xs md:text-sm"
            />
            {mode === 'edit' && (
              <p className="text-xs text-amber-600 font-medium pt-1">
                Changing roles will affect user permissions
              </p>
            )}
          </div>

          {/* Student ID Field - Conditional */}
          {isStudentRole && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="student_id" className="text-sm md:text-base font-medium">
                Student ID
                <abbr title="required" className="ml-1 text-red-600 no-underline cursor-help">
                  *
                </abbr>
              </Label>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <Input
                  id="student_id"
                  value={data.student_id}
                  onChange={(e) => {
                    onDataChange('student_id', e.target.value)
                    onLiveValidate('student_id', e.target.value)
                  }}
                  onBlur={(e) => {
                    // Only mark as touched if field has content
                    if (e.target.value.trim()) {
                      onTouchedChange({ ...touchedFields, student_id: true })
                    }
                    onBlurValidate('student_id', e.target.value)
                    onStudentIdBlur(e.target.value)
                  }}
                  aria-invalid={!!(errors.student_id || clientErrors.student_id) || studentIdStatus === 'taken'}
                  aria-describedby={
                    touchedFields.student_id && (errors.student_id || clientErrors.student_id)
                      ? 'student_id-error'
                      : undefined
                  }
                  placeholder="e.g., 2021-12345"
                  className="h-11 md:h-10 text-base md:text-sm flex-1"
                />
                {/* Student ID Status Badge - Only show when actively checking or validated */}
                {studentIdStatus !== 'idle' && (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted text-xs font-medium whitespace-nowrap">
                    {studentIdStatus === 'checking' && (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-muted-foreground">Checking…</span>
                      </>
                    )}
                    {studentIdStatus === 'available' && (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-green-600">Available</span>
                      </>
                    )}
                    {studentIdStatus === 'taken' && (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-red-600">Taken</span>
                      </>
                    )}
                    {studentIdStatus === 'error' && (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-amber-600">Check failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <InputError
                id="student_id-error"
                message={touchedFields.student_id ? errors.student_id || clientErrors.student_id : undefined}
                className="text-xs md:text-sm"
              />
            </div>
          )}

          {/* Faculty ID Field - Conditional */}
          {isFacultyRole && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="faculty_id" className="text-sm md:text-base font-medium">
                Faculty ID
                <span className="ml-1 text-xs text-muted-foreground font-normal">(Auto-filled)</span>
              </Label>
              {(() => {
                const hasFacultyError = !!(errors.faculty_id || clientErrors.faculty_id)
                const showHint =
                  !hasFacultyError &&
                  (facultyLookup.status === 'checking' ||
                    (facultyLookup.status === 'found' && !!facultyLookup.facultyId))
                return (
                  <>
                    <Input
                      id="faculty_id"
                      value={data.faculty_id || ''}
                      readOnly
                      disabled
                      placeholder="Auto-filled when faculty email matches"
                      className="h-11 md:h-10 text-base md:text-sm bg-muted/50"
                      aria-describedby={
                        hasFacultyError ? 'faculty_id-error' : showHint ? 'faculty_id-hint' : undefined
                      }
                    />
                    {showHint && (
                      <div id="faculty_id-hint" className="text-xs text-muted-foreground flex items-center gap-2">
                        {facultyLookup.status === 'checking' && 'Checking faculty records…'}
                        {facultyLookup.status === 'found' && facultyLookup.facultyId && (
                          <span className="text-green-600 font-medium">
                            Linked faculty ID: {facultyLookup.facultyId}
                          </span>
                        )}
                      </div>
                    )}
                    <InputError
                      id="faculty_id-error"
                      message={errors.faculty_id || clientErrors.faculty_id}
                      className="text-xs md:text-sm"
                    />
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {isLastAdminDemotion && (
          <Alert variant="destructive">
            <AlertTitle>Administrator safeguard</AlertTitle>
            <AlertDescription>Cannot demote the last Administrator</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
