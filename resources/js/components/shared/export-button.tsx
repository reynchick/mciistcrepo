import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { FileDown, Loader2 } from 'lucide-react'

type Format = 'pdf' | 'excel' | 'csv' | 'word'

type Props = {
  formats: Format[]
  onExport: (format: Format, params?: Record<string, unknown>) => Promise<Blob | string | URL>
  params?: Record<string, unknown>
  fileName?: string
  className?: string
}

export default function ExportButton({ formats, onExport, params, fileName = 'export', className }: Props) {
  const [loading, setLoading] = useState(false)
  const multiple = formats.length > 1

  const startDownload = async (format: Format) => {
    if (loading) return
    setLoading(true)
    const res = await onExport(format, params)
    setLoading(false)
    if (typeof res === 'string') {
      const a = document.createElement('a')
      a.href = res
      a.download = `${fileName}.${extensionFor(format)}`
      a.click()
      return
    }
    const url = res instanceof Blob ? URL.createObjectURL(res) : String(res)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.${extensionFor(format)}`
    a.click()
    if (res instanceof Blob) URL.revokeObjectURL(url)
  }

  if (multiple) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={cn('gap-2', className)} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {formats.map((f) => (
            <DropdownMenuItem key={f} onClick={() => startDownload(f)}>
              {labelFor(f)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button className={cn('gap-2', className)} onClick={() => startDownload(formats[0])} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      Export {labelFor(formats[0])}
    </Button>
  )
}

function extensionFor(f: Format) {
  if (f === 'excel') return 'xlsx'
  if (f === 'word') return 'docx'
  if (f === 'pdf') return 'pdf'
  return 'csv'
}

function labelFor(f: Format) {
  if (f === 'excel') return 'Excel'
  if (f === 'word') return 'Word'
  if (f === 'pdf') return 'PDF'
  return 'CSV'
}

export type { Props as ExportButtonProps, Format as ExportFormat }
