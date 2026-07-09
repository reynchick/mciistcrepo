import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import ThematicSelect from '@/components/research/thematic-select'

type Option = { id: number; name: string }

type Props = {
  agendas: Option[]
  sdgs: Option[]
  srigs: Option[]
  selectedAgendas: number[]
  selectedSdgs: number[]
  selectedSrigs: number[]
  onChangeAgendas: (ids: number[]) => void
  onChangeSdgs: (ids: number[]) => void
  onChangeSrigs: (ids: number[]) => void
}

type RSOption = { value: number; label: string }

export default function ThematicSection({ agendas, sdgs, srigs, selectedAgendas, selectedSdgs, selectedSrigs, onChangeAgendas, onChangeSdgs, onChangeSrigs }: Props) {
  const aOpts = useMemo(() => agendas.map((x) => ({ id: x.id, name: x.name })), [agendas])
  const sOpts = useMemo(() => sdgs.map((x) => ({ id: x.id, name: x.name })), [sdgs])
  const rOpts = useMemo(() => srigs.map((x) => ({ id: x.id, name: x.name })), [srigs])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <Label>Agenda</Label>
        <ThematicSelect options={aOpts} selectedIds={selectedAgendas} onChange={onChangeAgendas} color="blue" />
      </div>
      <div className="space-y-2">
        <Label>SDG</Label>
        <ThematicSelect options={sOpts} selectedIds={selectedSdgs} onChange={onChangeSdgs} color="green" />
      </div>
      <div className="space-y-2">
        <Label>SRIG</Label>
        <ThematicSelect options={rOpts} selectedIds={selectedSrigs} onChange={onChangeSrigs} color="purple" />
      </div>
    </div>
  )
}
