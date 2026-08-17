import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Model = {
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  is_lead_author?: boolean
}

type Props = {
  value: Model
  onChange: (v: Model) => void
  onSave: () => void
  onCancel: () => void
}

export default function ResearcherInput({ value, onChange, onSave, onCancel }: Props) {
  const validEmail = useMemo(() => /^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/.test(value.email), [value.email])
  const disabled = !value.first_name?.trim() || !value.last_name?.trim() || !validEmail

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>First Name *</Label>
        <Input value={value.first_name} onChange={(e) => onChange({ ...value, first_name: e.currentTarget.value })} />
      </div>
      <div className="space-y-2">
        <Label>Middle Name</Label>
        <Input value={value.middle_name ?? ''} onChange={(e) => onChange({ ...value, middle_name: e.currentTarget.value })} />
      </div>
      <div className="space-y-2">
        <Label>Last Name *</Label>
        <Input value={value.last_name} onChange={(e) => onChange({ ...value, last_name: e.currentTarget.value })} />
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.currentTarget.value })} aria-invalid={value.email ? !validEmail : false} />
        <div className="text-xs text-muted-foreground">Must be @usep.edu.ph</div>
      </div>
      <div className="col-span-1 md:col-span-2 flex items-center gap-2">
        <input id="lead-author" type="checkbox" checked={Boolean(value.is_lead_author)} onChange={(e) => onChange({ ...value, is_lead_author: e.currentTarget.checked })} />
        <Label htmlFor="lead-author">Lead author</Label>
      </div>
      <div className="col-span-1 md:col-span-2 flex gap-2">
        <Button type="button" onClick={onSave} disabled={disabled}>Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
