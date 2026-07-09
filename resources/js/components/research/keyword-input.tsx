import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Keyword = { id: number; keyword_name: string }

type Props = {
  suggestions: Keyword[]
  value: string
  onChange: (v: string) => void
  onAdd: (v: string) => void
  maxLength?: number
}

export default function KeywordInput({ suggestions, value, onChange, onAdd, maxLength = 60 }: Props) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<Keyword[]>([])
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const q = value.trim().toLowerCase()
    if (!q) { setFiltered([]); setOpen(false); return }
    const s = suggestions.filter((k) => k.keyword_name.toLowerCase().includes(q)).slice(0, 8)
    setFiltered(s)
    setOpen(s.length > 0)
  }, [value, suggestions])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current) return; if (!ref.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('click', h)
    return () => window.removeEventListener('click', h)
  }, [])

  const add = (v?: string) => {
    const val = (v ?? value).trim()
    if (!val) return
    if (val.length > maxLength) return
    onAdd(val)
  }

  const chars = value.length

  return (
    <div className="relative" ref={ref}>
      <Input value={value} onChange={(e) => onChange(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }} placeholder="Enter a keyword" />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-md">
          {filtered.map((s) => (
            <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => add(s.keyword_name)}>
              {s.keyword_name}
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{chars}/{maxLength}</span>
        <Button type="button" variant="outline" className="h-6 px-2 text-xs" onClick={() => add()}>Add</Button>
      </div>
    </div>
  )
}
