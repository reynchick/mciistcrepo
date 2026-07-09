import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import KeywordInput from '@/components/research/keyword-input'

type Keyword = { id: number; keyword_name: string }

type Props = {
  existingKeywords: Keyword[]
  keywords: string[]
  setKeywords: (k: string[]) => void
  error?: string
}

export default function KeywordsSection({ existingKeywords, keywords, setKeywords, error }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Keyword[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const q = input.trim().toLowerCase()
    if (!q) { setSuggestions([]); return }
    const s = existingKeywords
      .filter((k) => k.keyword_name.toLowerCase().includes(q))
      .filter((k) => !keywords.some((x) => x.toLowerCase() === k.keyword_name.toLowerCase()))
      .slice(0, 8)
    setSuggestions(s)
  }, [input, existingKeywords, keywords])

  useEffect(() => {
    const h = () => {}
    window.addEventListener('click', h)
    return () => window.removeEventListener('click', h)
  }, [])

  const add = (val?: string) => {
    const v = (val ?? input).trim()
    if (!v) return
    const low = v.toLowerCase()
    const exists = keywords.some((x) => x.toLowerCase() === low)
    if (exists) return
    if (v.length > 60) return
    if (keywords.length >= 10) return
    const next = [...keywords, v]
    setKeywords(next)
    setInput('')
  }

  const remove = (idx: number) => {
    const next = keywords.filter((_, i) => i !== idx)
    setKeywords(next)
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="space-y-2">
        <Label>Keywords</Label>
        <KeywordInput suggestions={suggestions} value={input} onChange={setInput} onAdd={(v) => add(v)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="text-xs text-muted-foreground">3–10 keywords</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k, idx) => (
          <Badge key={`${k}-${idx}`} variant="secondary" className="gap-2">
            <span>{k}</span>
            <button type="button" className="h-6 px-2 text-xs rounded-md border" onClick={() => remove(idx)}>×</button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
