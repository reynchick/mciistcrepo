import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Loader2, Search, X } from 'lucide-react'

type Suggestion = {
  id?: number | string
  label: string
}

type Props = {
  initialValue?: string
  placeholder?: string
  className?: string
  /** Called when user submits (Enter or clicking a suggestion). */
  onSubmit?: (query: string, suggestion?: Suggestion) => void
  /** Endpoint returning { suggestions: Array<{ id?: number|string, name: string }> }. Set to null to disable suggestions. */
  suggestionsEndpoint?: string | null
  /** Endpoint to log the search; omit to skip logging. */
  logEndpoint?: string | null
  /** Minimum characters before fetching suggestions. */
  minChars?: number
  /** Debounce ms for suggestion fetch. */
  debounceMs?: number
}

export default function SearchBar({
  initialValue = '',
  placeholder = 'Search…',
  className,
  onSubmit,
  suggestionsEndpoint = null,
  logEndpoint = null,
  minChars = 2,
  debounceMs = 300,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const suggestionsRef = useRef<HTMLDivElement | null>(null)
  const debounceTimerRef = useRef<number | null>(null)

  useEffect(() => setValue(initialValue ?? ''), [initialValue])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!suggestionsEndpoint) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (query.length < minChars) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.get(suggestionsEndpoint, { params: { q: query } })
      const items = (response.data?.suggestions ?? []).map((s: any) => ({
        id: s.id ?? s.value ?? undefined,
        label: s.name ?? s.label ?? '',
      })) as Suggestion[]
      setSuggestions(items)
      setShowSuggestions(items.length > 0)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const submit = (searchTerm: string, suggestion?: Suggestion) => {
    setShowSuggestions(false)

    // Strip type labels like "(Keyword)", "(Research Adviser)", etc. from search term
    const cleanSearchTerm = searchTerm.replace(/\s*\([^)]+\)\s*$/, '').trim()

    if (logEndpoint) {
      axios
        .post(logEndpoint, {
          search_term: cleanSearchTerm,
          keyword_id: suggestion?.id ?? undefined,
        })
        .catch((error) => console.error('Failed to log search:', error))
    }

    if (onSubmit) {
      onSubmit(cleanSearchTerm, suggestion)
    } else {
      const params = new URLSearchParams(window.location.search)
      if (cleanSearchTerm) params.set('search', cleanSearchTerm)
      else params.delete('search')
      params.delete('page')
      router.get(`${window.location.pathname}?${params.toString()}`, {}, { preserveScroll: false })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setValue(query)
    setSelectedIndex(-1)

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = window.setTimeout(() => fetchSuggestions(query), debounceMs)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        submit(value)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const selected = suggestions[selectedIndex]
          setValue(selected.label)
          submit(selected.label, selected)
        } else {
          submit(value)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setValue(suggestion.label)
    submit(suggestion.label, suggestion)
  }

  const clear = () => {
    setValue('')
    setSuggestions([])
    setShowSuggestions(false)
    submit('')
  }

  return (
    <div className={cn('relative flex w-full items-center gap-2', className)}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted z-10"
          >
            <X className="size-4" />
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id ?? suggestion.label}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  index === selectedIndex && 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <Search className="size-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{suggestion.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center">
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}

export type { Props as SearchBarProps }
