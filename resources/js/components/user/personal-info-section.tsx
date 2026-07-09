import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import InputError from '@/components/input-error'
import { Info } from 'lucide-react'
import { formatNameCap } from '@/lib/utils'

interface PersonalInfoSectionProps {
  mode: 'create' | 'edit'
  data: {
    first_name: string
    middle_name: string
    last_name: string
  }
  errors: Record<string, string | undefined>
  clientErrors: Record<string, string | undefined>
  touchedFields: Record<string, boolean>
  onDataChange: (field: string, value: any) => void
  onBlurValidate: (field: string, value: any) => void
  onLiveValidate: (field: string, value: any) => void
  onNameEdit: () => void
}

export default function PersonalInfoSection({
  mode,
  data,
  errors,
  clientErrors,
  touchedFields,
  onDataChange,
  onBlurValidate,
  onLiveValidate,
  onNameEdit,
}: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>Basic details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* Mobile-first: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* First Name - Full width on mobile */}
          <div className="grid gap-2">
            <Label htmlFor="first_name" className="text-sm md:text-base font-medium">
              First Name
              <abbr title="required" className="ml-1 text-red-600 no-underline cursor-help">
                *
              </abbr>
            </Label>
            <Input
              id="first_name"
              value={data.first_name}
              onBlur={(e) => {
                const formatted = formatNameCap(e.target.value)
                onDataChange('first_name', formatted)
                onBlurValidate('first_name', formatted)
              }}
              onChange={(e) => {
                onDataChange('first_name', e.target.value)
                onNameEdit()
                onLiveValidate('first_name', e.target.value)
              }}
              aria-invalid={!!(errors.first_name || clientErrors.first_name)}
              aria-describedby={
                touchedFields.first_name && (errors.first_name || clientErrors.first_name)
                  ? 'first_name-error'
                  : undefined
              }
              placeholder="First name"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <InputError
              id="first_name-error"
              message={touchedFields.first_name ? errors.first_name || clientErrors.first_name : undefined}
              className="text-xs md:text-sm"
            />
          </div>

          {/* Middle Name - Visible on all sizes */}
          <div className="grid gap-2">
            <Label htmlFor="middle_name" className="text-sm md:text-base font-medium">
              Middle Name
              <span className="ml-1 text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="middle_name"
              value={data.middle_name}
              onBlur={(e) => {
                onBlurValidate('middle_name', e.target.value)
              }}
              onChange={(e) => {
                onDataChange('middle_name', e.target.value)
                onNameEdit()
                onLiveValidate('middle_name', e.target.value)
              }}
              aria-invalid={!!errors.middle_name}
              aria-describedby={touchedFields.middle_name && errors.middle_name ? 'middle_name-error' : undefined}
              placeholder="Michael"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <InputError
              id="middle_name-error"
              message={touchedFields.middle_name ? errors.middle_name : undefined}
              className="text-xs md:text-sm"
            />
          </div>

          {/* Last Name - Full width on mobile */}
          <div className="grid gap-2">
            <Label htmlFor="last_name" className="text-sm md:text-base font-medium">
              Last Name
              <abbr title="required" className="ml-1 text-red-600 no-underline cursor-help">
                *
              </abbr>
            </Label>
            <Input
              id="last_name"
              value={data.last_name}
              onBlur={(e) => {
                const formatted = formatNameCap(e.target.value)
                onDataChange('last_name', formatted)
                onBlurValidate('last_name', formatted)
              }}
              onChange={(e) => {
                onDataChange('last_name', e.target.value)
                onNameEdit()
                onLiveValidate('last_name', e.target.value)
              }}
              aria-invalid={!!(errors.last_name || clientErrors.last_name)}
              aria-describedby={
                touchedFields.last_name && (errors.last_name || clientErrors.last_name) ? 'last_name-error' : undefined
              }
              placeholder="Last name"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <InputError
              id="last_name-error"
              message={touchedFields.last_name ? errors.last_name || clientErrors.last_name : undefined}
              className="text-xs md:text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
