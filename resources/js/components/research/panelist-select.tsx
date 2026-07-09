import { useMemo } from 'react'
import Select, { MultiValue } from 'react-select'
import type { Faculty } from '@/types'

type Option = { value: number; label: string; subtitle?: string; faculty: Faculty }

type Props = {
  faculties: Faculty[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
}

export default function PanelistSelect({ faculties, selectedIds, onChange, disabled }: Props) {
  const options = useMemo<Option[]>(() => {
    return faculties.map((f) => ({
      value: f.id,
      label: [f.last_name, f.first_name].filter(Boolean).join(', '),
      subtitle: f.position ?? f.designation ?? f.field_of_specialization ?? undefined,
      faculty: f,
    }))
  }, [faculties])

  const value = useMemo(() => options.filter((o) => selectedIds.includes(o.value)), [options, selectedIds])

  const handleChange = (items: MultiValue<Option>) => onChange(items.map((x) => x.value))

  return (
    <Select<Option, true>
      isMulti
      options={options}
      value={value}
      onChange={handleChange}
      isDisabled={disabled}
      placeholder="Search and select faculty"
      classNamePrefix="rs"
      formatOptionLabel={(o) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
            {(o.faculty.first_name ?? 'F')[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm">{o.label}</span>
            {o.subtitle && <span className="text-xs text-muted-foreground">{o.subtitle}</span>}
          </div>
        </div>
      )}
    />
  )
}
