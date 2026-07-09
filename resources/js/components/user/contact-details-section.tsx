import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import InputError from '@/components/input-error'
import { Mail, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

interface ContactDetailsSectionProps {
  data: {
    email: string
    contact_number: string
  }
  errors: Record<string, string | undefined>
  clientErrors: Record<string, string | undefined>
  touchedFields: Record<string, boolean>
  emailStatus: 'idle' | 'checking' | 'available' | 'taken'
  onDataChange: (field: string, value: any) => void
  onBlurValidate: (field: string, value: any) => void
  onLiveValidate: (field: string, value: any) => void
  onEmailBlur: (email: string) => void
}

export default function ContactDetailsSection({
  data,
  errors,
  clientErrors,
  touchedFields,
  emailStatus,
  onDataChange,
  onBlurValidate,
  onLiveValidate,
  onEmailBlur,
}: ContactDetailsSectionProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Contact Details
        </CardTitle>
        <CardDescription>Email and phone</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* Mobile-first: 1 column on mobile, 2 on tablet+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm md:text-base font-medium">
              Email
              <abbr title="required" className="ml-1 text-red-600 no-underline cursor-help">
                *
              </abbr>
            </Label>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => {
                  onDataChange('email', e.target.value)
                  onLiveValidate('email', e.target.value)
                }}
                onBlur={(e) => {
                  onBlurValidate('email', e.target.value)
                  onEmailBlur(e.target.value)
                }}
                aria-invalid={!!(errors.email || clientErrors.email) || emailStatus === 'taken'}
                aria-describedby={
                  touchedFields.email && (errors.email || clientErrors.email) ? 'email-error' : 'email-hint'
                }
                placeholder="email@usep.edu.ph"
                className="h-11 md:h-10 text-base md:text-sm flex-1"
              />
              {/* Status Badge - Compact pill style */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted text-xs font-medium whitespace-nowrap">
                {emailStatus === 'checking' && (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-muted-foreground">Checking…</span>
                  </>
                )}
                {emailStatus === 'available' && (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Available</span>
                  </>
                )}
                {emailStatus === 'taken' && (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-red-600">Taken</span>
                  </>
                )}
                {emailStatus === 'idle' && (
                  <span className="text-muted-foreground">Ready</span>
                )}
              </div>
            </div>
            <InputError
              id="email-error"
              message={touchedFields.email ? errors.email || clientErrors.email : undefined}
              className="text-xs md:text-sm"
            />
            {!(errors.email || clientErrors.email) && (
              <p id="email-hint" className="text-xs text-muted-foreground">
                Must use USeP institutional email
              </p>
            )}
          </div>

          {/* Contact Number Field */}
          <div className="grid gap-2">
            <Label htmlFor="contact_number" className="text-sm md:text-base font-medium">
              Contact Number
              <span className="ml-1 text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="contact_number"
              value={data.contact_number}
              onChange={(e) => {
                onDataChange('contact_number', formatPhone(e.target.value))
                onLiveValidate('contact_number', e.target.value)
              }}
              onBlur={(e) => {
                onBlurValidate('contact_number', e.target.value)
              }}
              aria-invalid={!!(errors.contact_number || clientErrors.contact_number)}
              aria-describedby={
                touchedFields.contact_number && (errors.contact_number || clientErrors.contact_number)
                  ? 'contact_number-error'
                  : undefined
              }
              placeholder="09XX-XXX-XXXX or +63 9XXXXXXXXX"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <InputError
              id="contact_number-error"
              message={touchedFields.contact_number ? errors.contact_number || clientErrors.contact_number : undefined}
              className="text-xs md:text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
