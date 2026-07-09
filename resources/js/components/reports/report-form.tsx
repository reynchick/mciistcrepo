import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ColumnSelector from '@/components/reports/column-selector'

interface Option { value: string; label: string }

interface Filters {
  program?: string
  year?: string
  adviser?: string
  startDate?: string
  endDate?: string
}

interface Props {
  programs: Option[]
  years: Option[]
  advisers: Option[]
  columns: { key: string; label: string }[]
  onSubmit: (payload: { filters: Filters; format: 'pdf' | 'xlsx'; columns: string[] }) => void
}

export default function ReportForm({ programs, years, advisers, columns, onSubmit }: Props) {
  const [program, setProgram] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [adviser, setAdviser] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf')
  const [selectedCols, setSelectedCols] = useState<string[]>(columns.map((c) => c.key))

  const filters: Filters = {
    program: program || undefined,
    year: year || undefined,
    adviser: adviser || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generate Report (PDF/XLSX)</CardTitle>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Date Range</div>
            <div className="flex gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Format</div>
            <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'xlsx')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Columns</div>
          <ColumnSelector columns={columns} value={selectedCols} onChange={setSelectedCols} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSubmit({ filters, format, columns: selectedCols })}>Generate</Button>
        </div>
      </CardContent>
    </Card>
  )
}