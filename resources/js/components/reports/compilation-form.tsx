import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Option { value: string; label: string }

interface Filters { program?: string; year?: string; adviser?: string }

interface Props {
  programs: Option[]
  years: Option[]
  advisers: Option[]
  onPreview: (filters: Filters) => void
  onSubmit: (filters: Filters) => void
}

export default function CompilationForm({ programs, years, advisers, onPreview, onSubmit }: Props) {
  const [program, setProgram] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [adviser, setAdviser] = useState<string>('')

  const filters: Filters = {
    program: program || undefined,
    year: year || undefined,
    adviser: adviser || undefined,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generate Compilation (DOCX)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={adviser} onValueChange={setAdviser}>
            <SelectTrigger>
              <SelectValue placeholder="Adviser" />
            </SelectTrigger>
            <SelectContent>
              {advisers.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onPreview(filters)}>Preview</Button>
          <Button onClick={() => onSubmit(filters)}>Generate</Button>
        </div>
      </CardContent>
    </Card>
  )
}