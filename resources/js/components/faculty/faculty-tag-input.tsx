import { KeyboardEvent, useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Props {
  id: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export default function FacultyTagInput({ id, value, onChange, placeholder, disabled }: Props) {
  const [draft, setDraft] = useState('')

  const addDraft = () => {
    const tags = draft.split(',').map((tag) => tag.trim()).filter(Boolean)
    if (tags.length > 0) {
      onChange([...value, ...tags.filter((tag) => !value.includes(tag))])
      setDraft('')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addDraft()
    }
    if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/30">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 font-normal">
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((item) => item !== tag))} disabled={disabled}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          id={id}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={addDraft}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : 'Add another'}
          className="h-7 min-w-32 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
