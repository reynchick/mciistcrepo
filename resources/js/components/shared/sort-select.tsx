import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface SortOption {
  value: string
  label: string
}

interface SortSelectProps {
  options: SortOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  triggerClassName?: string
}

/**
 * Reusable sort dropdown component
 * Renders a labeled select for sorting options with consistent styling
 */
export function SortSelect({
  options,
  value,
  onChange,
  label = 'Sort by:',
  className = '',
  triggerClassName = 'h-8 w-44 text-sm',
}: SortSelectProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 border border-input rounded-md bg-background ${className}`}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
