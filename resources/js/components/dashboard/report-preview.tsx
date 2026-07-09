import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Item {
  program: string
  title: string
  researchers: string[]
  adviser: string
  date: string
  abstract: string
  keywords: string[]
}

interface Props {
  items: Item[]
  onConfirm: () => void
  onCancel: () => void
}

export default function ReportPreview({ items, onConfirm, onCancel }: Props) {
  return (
    <div className="space-y-4">
      {items.map((i, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-base font-medium">{i.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <div className="mb-2">{i.program} • {i.date} • Adviser: {i.adviser}</div>
              <div className="mb-2">Researchers: {i.researchers.join(', ')}</div>
              <div className="mb-2">Keywords: {i.keywords.join(', ')}</div>
              <div className="mt-2 line-clamp-4">{i.abstract}</div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </div>
    </div>
  )
}