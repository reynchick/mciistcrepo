import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
    approvalSheet: File | null;
    manuscript: File | null;
    approvalSheetRemoved?: boolean;
    manuscriptRemoved?: boolean;
    onChangeApproval: (file: File | null) => void;
    onChangeManuscript: (file: File | null) => void;
    onRemoveApproval?: () => void;
    onRemoveManuscript?: () => void;
    existingApprovalUrl?: string | null;
    existingManuscriptUrl?: string | null;
    errorApproval?: string;
    errorManuscript?: string;
    canEdit?: boolean;
    showUnavailableControls?: boolean;
    approvalSheetUnavailable?: boolean;
    manuscriptUnavailable?: boolean;
    onApprovalSheetUnavailableChange?: (unavailable: boolean) => void;
    onManuscriptUnavailableChange?: (unavailable: boolean) => void;
};

const PDF_TYPE = 'application/pdf';
const MAX_SIZE = 20_000_000;
const PDF_ONLY_ERROR = 'Only PDF files are allowed.';

export default function FilesSection({
    approvalSheet,
    manuscript,
    approvalSheetRemoved = false,
    manuscriptRemoved = false,
    onChangeApproval,
    onChangeManuscript,
    onRemoveApproval,
    onRemoveManuscript,
    existingApprovalUrl,
    existingManuscriptUrl,
    errorApproval,
    errorManuscript,
    canEdit = true,
    showUnavailableControls = false,
    approvalSheetUnavailable = false,
    manuscriptUnavailable = false,
    onApprovalSheetUnavailableChange,
    onManuscriptUnavailableChange,
}: Props) {
    const approvalInputRef = useRef<HTMLInputElement>(null);
    const manuscriptInputRef = useRef<HTMLInputElement>(null);
    const [dragA, setDragA] = useState(false);
    const [dragM, setDragM] = useState(false);
    const [progressA, setProgressA] = useState<number>(0);
    const [progressM, setProgressM] = useState<number>(0);
    const [typeErrorA, setTypeErrorA] = useState<string | null>(null);
    const [typeErrorM, setTypeErrorM] = useState<string | null>(null);

    useEffect(() => {
        if (!approvalSheet) {
            setProgressA(0);
            return;
        }
        let p = 0;
        const t = window.setInterval(() => {
            p = Math.min(100, p + 25);
            setProgressA(p);
            if (p === 100) window.clearInterval(t);
        }, 80);
        return () => window.clearInterval(t);
    }, [approvalSheet]);

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

    const handleFilesA = (files: FileList | null) => {
        if (approvalSheetUnavailable) return;
        if (!files || files.length === 0) return;
        const f = files[0];
        if (f.type !== PDF_TYPE) {
            setTypeErrorA(PDF_ONLY_ERROR);
            if (approvalInputRef.current) approvalInputRef.current.value = '';
            return;
        }
        if (f.size > MAX_SIZE) {
            setTypeErrorA('File is too large. Maximum size is 20MB.');
            if (approvalInputRef.current) approvalInputRef.current.value = '';
            return;
        }
        setTypeErrorA(null);
        onChangeApproval(f);
        onRemoveApproval?.();
    };

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
        onRemoveManuscript?.();
    };

    const aName = useMemo(() => approvalSheet?.name ?? null, [approvalSheet]);
    const mName = useMemo(() => manuscript?.name ?? null, [manuscript]);
    const approvalStatus = aName ?? (approvalSheetRemoved ? 'Marked for removal' : 'No file selected');
    const manuscriptStatus = mName ?? (manuscriptRemoved ? 'Marked for removal' : 'No file selected');
    const approvalHasExisting = !!existingApprovalUrl && !approvalSheetRemoved;
    const manuscriptHasExisting = !!existingManuscriptUrl && !manuscriptRemoved;

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <Label>Approval Sheet</Label>
                <div
                    className={`mt-2 rounded-md border border-dashed p-4 ${dragA ? 'bg-accent' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragA(true);
                    }}
                    onDragLeave={() => setDragA(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragA(false);
                        handleFilesA(e.dataTransfer.files);
                    }}
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                ref={approvalInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => handleFilesA(e.currentTarget.files)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => approvalInputRef.current?.click()}
                                disabled={!canEdit || approvalSheetUnavailable}
                            >
                                Choose file
                            </Button>
                            <span className={`text-sm ${aName ? 'text-foreground' : 'text-muted-foreground'}`}>{approvalStatus}</span>
                        </div>
                        {approvalHasExisting && (
                            <a className="text-sm text-blue-600" href={existingApprovalUrl!} target="_blank" rel="noreferrer">
                                View existing
                            </a>
                        )}
                    </div>
                    {(typeErrorA || errorApproval) && <div className="mt-2 text-xs text-red-600">{typeErrorA ?? errorApproval}</div>}
                    <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
                        <div className="h-full bg-blue-600" style={{ width: `${progressA}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                        {canEdit && !approvalSheetUnavailable ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    if (approvalInputRef.current) approvalInputRef.current.value = '';
                                    onChangeApproval(null);
                                    onRemoveApproval?.();
                                    setTypeErrorA(null);
                                }}
                            >
                                Remove
                            </Button>
                        ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">PDF only, max 20MB</div>
                    {showUnavailableControls && (
                        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={approvalSheetUnavailable}
                                onChange={(event) => onApprovalSheetUnavailableChange?.(event.currentTarget.checked)}
                            />
                            Mark as unavailable
                        </label>
                    )}
                </div>
            </div>

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
        </div>
    );
}
