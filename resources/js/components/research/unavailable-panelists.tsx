import PanelistSelect from '@/components/research/panelist-select';
import { Label } from '@/components/ui/label';
import type { Faculty as FacultyType } from '@/types';

type Props = {
    faculties: FacultyType[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    unavailable: boolean;
    onUnavailableChange: (unavailable: boolean) => void;
};

export default function UnavailablePanelists({ faculties, selectedIds, onChange, unavailable, onUnavailableChange }: Props) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Panelists</Label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={unavailable} onChange={(event) => onUnavailableChange(event.currentTarget.checked)} />
                    Mark as unavailable
                </label>
            </div>
            <fieldset disabled={unavailable} className={unavailable ? 'opacity-50' : undefined}>
                <PanelistSelect faculties={faculties} selectedIds={selectedIds} onChange={onChange} />
            </fieldset>
        </div>
    );
}
