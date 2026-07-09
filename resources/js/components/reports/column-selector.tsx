import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface Column {
  key: string
  label: string
}

interface Props {
  columns: Column[]
  value: string[]
  onChange: (value: string[]) => void
}

export default function ColumnSelector({ columns, value, onChange }: Props) {
  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else onChange([...value, key])
  }
  const selectAll = () => onChange(columns.map((c) => c.key))
  const clear = () => onChange([])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {columns.map((c) => (
          <label key={c.key} className="flex items-center gap-2">
            <Checkbox checked={value.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
            <span className="text-sm">{c.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}