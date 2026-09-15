import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
    manuscript: File | null;
    manuscriptRemoved?: boolean;
    onChangeManuscript: (file: File | null) => void;
    onRemoveManuscript?: () => void;
    existingManuscriptUrl?: string | null;
    errorManuscript?: string;
    canEdit?: boolean;
    showUnavailableControls?: boolean;
    manuscriptUnavailable?: boolean;
    onManuscriptUnavailableChange?: (unavailable: boolean) => void;
};

const PDF_TYPE = 'application/pdf';
const MAX_SIZE = 20_000_000;
const PDF_ONLY_ERROR = 'Only PDF files are allowed.';

export default function FilesSection({
    manuscript,
    manuscriptRemoved = false,
    onChangeManuscript,
    onRemoveManuscript,
    existingManuscriptUrl,
    errorManuscript,
    canEdit = true,
    showUnavailableControls = false,
    manuscriptUnavailable = false,
    onManuscriptUnavailableChange,
}: Props) {
    const manuscriptInputRef = useRef<HTMLInputElement>(null);
    const [dragM, setDragM] = useState(false);
    const [progressM, setProgressM] = useState<number>(0);
    const [typeErrorM, setTypeErrorM] = useState<string | null>(null);

    useEffect(() => {
        if (!manuscript) {
            setProgressM(0);
            return;
        }
        let p = 0;
        const t = window.setInterval(() => {
            p = Math.min(100, p + 25);
            setProgressM(p);
            if (p === 100) window.clearInterval(t);
        }, 80);
        return () => window.clearInterval(t);
    }, [manuscript]);

    const handleFilesM = (files: FileList | null) => {
        if (manuscriptUnavailable) return;
        if (!files || files.length === 0) return;
        const f = files[0];
        if (f.type !== PDF_TYPE) {
            setTypeErrorM(PDF_ONLY_ERROR);
            if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
            return;
        }
        if (f.size > MAX_SIZE) {
            setTypeErrorM('File is too large. Maximum size is 20MB.');
            if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
            return;
        }
        setTypeErrorM(null);
        onChangeManuscript(f);
    };

    const mName = useMemo(() => manuscript?.name ?? null, [manuscript]);
    const manuscriptStatus = mName ?? (manuscriptRemoved ? 'Marked for removal' : 'No file selected');
    const manuscriptHasExisting = !!existingManuscriptUrl && !manuscriptRemoved;

    return (
        <div>
            <Label>Manuscript</Label>
            <div
                className={`mt-2 rounded-md border border-dashed p-4 ${dragM ? 'bg-accent' : ''}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragM(true);
                }}
                onDragLeave={() => setDragM(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragM(false);
                    handleFilesM(e.dataTransfer.files);
                }}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            ref={manuscriptInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => handleFilesM(e.currentTarget.files)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => manuscriptInputRef.current?.click()}
                            disabled={!canEdit || manuscriptUnavailable}
                        >
                            Choose file
                        </Button>
                        <span className={`text-sm ${mName ? 'text-foreground' : 'text-muted-foreground'}`}>{manuscriptStatus}</span>
                    </div>
                    {manuscriptHasExisting && (
                        <a className="text-sm text-blue-600" href={existingManuscriptUrl!} target="_blank" rel="noreferrer">
                            View existing
                        </a>
                    )}
                </div>
                {(typeErrorM || errorManuscript) && <div className="mt-2 text-xs text-red-600">{typeErrorM ?? errorManuscript}</div>}
                <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
                    <div className="h-full bg-blue-600" style={{ width: `${progressM}%` }} />
                </div>
                <div className="mt-3 flex gap-2">
                    {canEdit && !manuscriptUnavailable ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
                                onChangeManuscript(null);
                                onRemoveManuscript?.();
                                setTypeErrorM(null);
                            }}
                        >
                            Remove
                        </Button>
                    ) : null}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">PDF ≤ 20MB</div>
                {showUnavailableControls && (
                    <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={manuscriptUnavailable}
                            onChange={(event) => onManuscriptUnavailableChange?.(event.currentTarget.checked)}
                        />
                        Mark as unavailable
                    </label>
                )}
            </div>
        </div>
    );
}
