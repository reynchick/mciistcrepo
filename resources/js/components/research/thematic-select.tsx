import { useMemo, useState } from 'react'
import Select, { MultiValue, StylesConfig } from 'react-select'
import { Button } from '@/components/ui/button'

type Option = { id: number; name: string; description?: string }

type RSOption = { value: number; label: string; description?: string }

type Props = {
  options: Option[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  color?: 'blue' | 'green' | 'purple'
}

export default function ThematicSelect({ options, selectedIds, onChange, color = 'blue' }: Props) {
  const rsOptions = useMemo<RSOption[]>(() => options.map((o) => ({ value: o.id, label: o.name, description: o.description })), [options])
  const value = useMemo(() => rsOptions.filter((o) => selectedIds.includes(o.value)), [rsOptions, selectedIds])

  const handleChange = (items: MultiValue<RSOption>) => onChange(items.map((x) => x.value))

  const styles: StylesConfig<RSOption, true> = {
    control: (p) => ({ ...p, minHeight: '42px', borderRadius: '0.5rem' }),
    multiValue: (p) => ({ ...p, backgroundColor: color === 'blue' ? '#dbeafe' : color === 'green' ? '#dcfce7' : '#ede9fe' }),
    multiValueLabel: (p) => ({ ...p, color: color === 'blue' ? '#1e40af' : color === 'green' ? '#166534' : '#6b21a8', fontSize: '0.875rem', padding: '2px 6px' }),
  }

  const selectAll = () => onChange(rsOptions.map((x) => x.value))
  const clearAll = () => onChange([])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={selectAll}>Select all</Button>
        <Button type="button" variant="outline" onClick={clearAll}>Clear all</Button>
      </div>
      <Select<RSOption, true>
        isMulti
        options={rsOptions}
        value={value}
        onChange={handleChange}
        styles={styles}
        classNamePrefix="rs"
        placeholder="Search and select"
        formatOptionLabel={(o) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{o.label}</span>
            {o.description && <span className="text-xs text-muted-foreground" title={o.description}>ⓘ</span>}
          </div>
        )}
      />
    </div>
  )
}

