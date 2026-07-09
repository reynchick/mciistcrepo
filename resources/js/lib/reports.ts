export interface CompilationFilters {
  program?: string
  year?: string
  adviser?: string
}

export interface ReportFilters extends CompilationFilters {
  startDate?: string
  endDate?: string
}

export type ReportFormat = 'pdf' | 'xlsx'

export interface ReportColumn {
  key: string
  label: string
}

export interface CompilationItem {
  program: string
  title: string
  researchers: string[]
  adviser: string
  date: string
  abstract: string
  keywords: string[]
}

export interface ReportGeneratePayload {
  filters: ReportFilters
  format: ReportFormat
  columns: string[]
}