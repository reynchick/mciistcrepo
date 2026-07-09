import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Filter } from 'lucide-react'

type FilterType = 'select' | 'multiselect' | 'date_range' | 'text' | 'checkbox_group'

export type FilterOption = { label: string; value: string | number }

export type FilterConfig = {
  key: string
  type: FilterType
  label: string
  placeholder?: string
  options?: FilterOption[]
}

type Props = {
  config: FilterConfig[]
  values: Record<string, unknown>
  onApply: (values: Record<string, unknown>) => void
  onReset: () => void
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export default function FilterPanel({ config, values, onApply, onReset, isOpen, onClose, className }: Props) {
  const isMobile = useIsMobile()
  const [local, setLocal] = useState<Record<string, unknown>>(values)
  useEffect(() => setLocal(values), [values])

  const activeCount = useMemo(() => Object.values(local).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== null && v !== ''
  }).length, [local])

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4" />
          <div className="text-sm font-medium">Filters</div>
          <Badge variant="secondary">{activeCount}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>Clear All</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {config.map((f) => (
          <div key={f.key} className="mb-3">
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{f.label}</div>
                  <span className="text-xs text-muted-foreground">{renderValuePreview(local[f.key])}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2">
                  {renderControl(f, local[f.key], (v) => setLocal((prev) => ({ ...prev, [f.key]: v })))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>
      <div className="border-t p-3">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setLocal(values)}>Reset</Button>
          <Button onClick={() => { onApply(local); onClose?.() }}>Apply</Button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={!!isOpen} onOpenChange={(o) => (!o ? onClose?.() : undefined)}>
        <SheetContent side="bottom" className={cn('p-0', className)}>
          <SheetHeader>
            <SheetTitle className="sr-only">Filters</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className={cn('w-full sm:w-80 shrink-0 rounded-lg border bg-background', className)}>{content}</div>
  )
}

function renderControl(f: FilterConfig, value: unknown, setValue: (v: unknown) => void) {
  if (f.type === 'text') {
    const v = typeof value === 'string' ? value : ''
    return <Input placeholder={f.placeholder} value={v} onChange={(e) => setValue(e.target.value)} />
  }
  if (f.type === 'select') {
    const v = value === undefined || value === null ? '' : String(value)
    return (
      <Select value={v} onValueChange={(val) => setValue(val)}>
        <SelectTrigger>
          <SelectValue placeholder={f.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {f.options?.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (f.type === 'multiselect') {
    const arr: Array<string | number> = Array.isArray(value) ? (value as Array<string | number>) : []
    return (
      <div className="grid grid-cols-1 gap-2">
        {f.options?.map((o) => {
          const checked = arr.some((v) => String(v) === String(o.value))
          const toggle = checked ? arr.filter((v) => String(v) !== String(o.value)) : [...arr, o.value]
          return (
            <label key={String(o.value)} className="flex items-center gap-2">
              <Checkbox checked={checked} onCheckedChange={() => setValue(toggle)} />
              <span className="text-sm">{o.label}</span>
            </label>
          )
        })}
      </div>
    )
  }
  if (f.type === 'checkbox_group') {
    const arr: Array<string | number> = Array.isArray(value) ? (value as Array<string | number>) : []
    return (
      <div className="grid grid-cols-1 gap-2">
        {f.options?.map((o) => {
          const checked = arr.some((v) => String(v) === String(o.value))
          const toggle = checked ? arr.filter((v) => String(v) !== String(o.value)) : [...arr, o.value]
          return (
            <label key={String(o.value)} className="flex items-center gap-2">
              <Checkbox checked={checked} onCheckedChange={() => setValue(toggle)} />
              <span className="text-sm">{o.label}</span>
            </label>
          )
        })}
      </div>
    )
  }
  if (f.type === 'date_range') {
    const obj = (value as Record<string, unknown>) || {}
    const from = (obj['from'] as string) ?? ''
    const to = (obj['to'] as string) ?? ''
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={from} onChange={(e) => setValue({ from: e.target.value, to })} />
        <Input type="date" value={to} onChange={(e) => setValue({ from, to: e.target.value })} />
      </div>
    )
  }
  return null
}

function renderValuePreview(v: unknown) {
  if (Array.isArray(v)) return v.length ? `${v.length} selected` : ''
  if (typeof v === 'object' && v) return ''
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}

export type FilterPanelProps = Props
