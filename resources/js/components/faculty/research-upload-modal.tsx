import ConfirmationModal from '@/components/modals/confirmation-modal';
import KeywordInput from '@/components/research/keyword-input';
import PanelistSelect from '@/components/research/panelist-select';
import FilesSection from '@/components/research/research-form/files';
import ThematicSection from '@/components/research/research-form/thematic';
import ResearcherInput from '@/components/research/researcher-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Faculty as FacultyType } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2, Pencil, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Program {
    id: number;
    name: string;
    code?: string | null;
}

interface KeywordOption {
    id: number;
    keyword_name: string;
}

interface ThematicOption {
    id: number;
    name: string;
}

interface CurrentFaculty {
    id: number;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
}

interface DraftResearcher {
    id?: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
}

interface Props {
    open: boolean;
    researchId?: number | null;
    hideInviteResearchers?: boolean;
    programs: Program[];
    faculties: FacultyType[];
    keywordOptions: KeywordOption[];
    agendas: ThematicOption[];
    sdgs: ThematicOption[];
    srigs: ThematicOption[];
    currentFaculty: CurrentFaculty;
    onClose: () => void;
    onCreated: (title: string) => void;
}

interface EditData {
    id: number;
    updated_at?: string | null;
    research_title: string;
    program_id: number | null;
    completed_month: number | null;
    completed_year: number | null;
    research_abstract: string | null;
    research_manuscript: string | null;
    researchers: DraftResearcher[];
    keyword_names: string[];
    panelist_ids: number[];
    agenda_ids: number[];
    sdg_ids: number[];
    srig_ids: number[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPTY_RESEARCHER: DraftResearcher = { first_name: '', middle_name: '', last_name: '', email: '' };

export default function ResearchUploadModal({
    open,
    researchId = null,
    hideInviteResearchers = false,
    programs,
    faculties,
    keywordOptions,
    agendas,
    sdgs,
    srigs,
    currentFaculty,
    onClose,
    onCreated,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [clientError, setClientError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [programId, setProgramId] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [abstract, setAbstract] = useState('');
    const [researchers, setResearchers] = useState<DraftResearcher[]>([]);
    const [keywordNames, setKeywordNames] = useState<string[]>([]);
    const [panelistIds, setPanelistIds] = useState<number[]>([]);
    const [agendaIds, setAgendaIds] = useState<number[]>([]);
    const [sdgIds, setSdgIds] = useState<number[]>([]);
    const [srigIds, setSrigIds] = useState<number[]>([]);
    const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
    const [existingManuscriptUrl, setExistingManuscriptUrl] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    const [researcherDraft, setResearcherDraft] = useState<DraftResearcher>(EMPTY_RESEARCHER);
    const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null);
    const [showResearcherForm, setShowResearcherForm] = useState(false);
    const [keywordDraft, setKeywordDraft] = useState('');
    const [inviteConfirmOpen, setInviteConfirmOpen] = useState(false);

    const resetForm = () => {
        setTitle('');
        setProgramId('');
        setMonth('');
        setYear(String(new Date().getFullYear()));
        setAbstract('');
        setResearchers([]);
        setKeywordNames([]);
        setPanelistIds([]);
        setAgendaIds([]);
        setSdgIds([]);
        setSrigIds([]);
        setManuscriptFile(null);
        setExistingManuscriptUrl(null);
        setUpdatedAt(null);
        setResearcherDraft(EMPTY_RESEARCHER);
        setEditingResearcherIndex(null);
        setShowResearcherForm(false);
        setKeywordDraft('');
        setServerErrors({});
        setClientError(null);
        setInviteConfirmOpen(false);
    };

    useEffect(() => {
        if (!open || !researchId) return;

        setLoading(true);
        setServerErrors({});
        setClientError(null);
        fetch(`/research/${researchId}/edit-data`, { headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('Unable to load this draft.');
                return response.json();
            })
            .then(({ data }: { data: EditData }) => {
                setTitle(data.research_title ?? '');
                setProgramId(data.program_id ? String(data.program_id) : '');
                setMonth(data.completed_month ? String(data.completed_month) : '');
                setYear(data.completed_year ? String(data.completed_year) : '');
                setAbstract(data.research_abstract ?? '');
                setResearchers(Array.isArray(data.researchers) ? data.researchers : []);
                setKeywordNames(Array.isArray(data.keyword_names) ? data.keyword_names : []);
                setPanelistIds(Array.isArray(data.panelist_ids) ? data.panelist_ids : []);
                setAgendaIds(Array.isArray(data.agenda_ids) ? data.agenda_ids : []);
                setSdgIds(Array.isArray(data.sdg_ids) ? data.sdg_ids : []);
                setSrigIds(Array.isArray(data.srig_ids) ? data.srig_ids : []);
                setExistingManuscriptUrl(data.research_manuscript ? `/research/${data.id}/manuscript` : null);
                setUpdatedAt(data.updated_at ?? null);
                setManuscriptFile(null);
            })
            .catch((error: Error) => setClientError(error.message))
            .finally(() => setLoading(false));
    }, [open, researchId]);

    const panelistOptions = faculties.filter((f) => f.id !== currentFaculty.id);

    const currentFacultyName = [currentFaculty.last_name, currentFaculty.first_name].filter(Boolean).join(', ');

    const addOrUpdateResearcher = () => {
        setResearchers((prev) => {
            if (editingResearcherIndex !== null) {
                const next = [...prev];
                next[editingResearcherIndex] = researcherDraft;
                return next;
            }
            return [...prev, researcherDraft];
        });
        setResearcherDraft(EMPTY_RESEARCHER);
        setEditingResearcherIndex(null);
        setShowResearcherForm(false);
    };

    const editResearcherAt = (idx: number) => {
        setResearcherDraft(researchers[idx]);
        setEditingResearcherIndex(idx);
        setShowResearcherForm(true);
    };

    const removeResearcherAt = (idx: number) => {
        setResearchers((prev) => prev.filter((_, i) => i !== idx));
        if (editingResearcherIndex === idx) {
            setShowResearcherForm(false);
            setEditingResearcherIndex(null);
            setResearcherDraft(EMPTY_RESEARCHER);
        }
    };

    const addKeyword = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        setKeywordNames((prev) => (prev.some((k) => k.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]));
        setKeywordDraft('');
    };

    const removeKeyword = (value: string) => {
        setKeywordNames((prev) => prev.filter((k) => k !== value));
    };

    const validate = (workflowAction: 'draft' | 'invite' | 'post'): string | null => {
        if (!title.trim()) return 'Research title is required.';
        if (!programId) return 'Program is required.';

        if (workflowAction === 'draft') return null;

        if (workflowAction === 'invite') {
            if (!hasInvitableResearcher) return 'At least one researcher needs a first name, last name, and email address.';
            return null;
        }

        if (!year.trim()) return 'Completed Year is required.';
        if (!month) return 'Completed Month is required.';
        if (!abstract.trim()) return 'Abstract is required.';
        if (researchers.length < 1) return 'At least one researcher is required.';
        if (!allResearchersPostable) return 'Each researcher needs a first name and last name.';
        if (keywordNames.length < 1) return 'At least one keyword is required.';
        if (panelistIds.length < 1) return 'At least one panelist is required.';
        if (agendaIds.length < 1) return 'At least one agenda is required.';
        if (sdgIds.length < 1) return 'At least one SDG is required.';
        if (srigIds.length < 1) return 'At least one SRIG is required.';
        if (!existingManuscriptUrl && !manuscriptFile) return 'The research manuscript is required.';
        return null;
    };

    const hasTitleAndProgram = Boolean(title.trim()) && Boolean(programId);

    const hasInvitableResearcher = useMemo(
        () => researchers.some((r) => Boolean(r.first_name.trim()) && Boolean(r.last_name.trim()) && Boolean(r.email.trim())),
        [researchers],
    );

    const allResearchersComplete = useMemo(
        () =>
            researchers.length > 0 &&
            researchers.every((r) => Boolean(r.first_name.trim()) && Boolean(r.last_name.trim()) && Boolean(r.email.trim())),
        [researchers],
    );

    const allResearchersPostable = useMemo(
        () => researchers.length > 0 && researchers.every((r) => Boolean(r.first_name.trim()) && Boolean(r.last_name.trim())),
        [researchers],
    );

    const canSaveDraft = hasTitleAndProgram;
    const canInviteResearchers = hasTitleAndProgram && hasInvitableResearcher;

    const canPostToRepository = useMemo(() => {
        return (
            Boolean(title.trim()) &&
            Boolean(programId) &&
            Boolean(abstract.trim()) &&
            Boolean(month) &&
            Boolean(year.trim()) &&
            allResearchersPostable &&
            keywordNames.length > 0 &&
            panelistIds.length > 0 &&
            agendaIds.length > 0 &&
            sdgIds.length > 0 &&
            srigIds.length > 0 &&
            Boolean(existingManuscriptUrl || manuscriptFile)
        );
    }, [
        title,
        programId,
        abstract,
        month,
        year,
        allResearchersPostable,
        keywordNames.length,
        panelistIds.length,
        agendaIds.length,
        sdgIds.length,
        srigIds.length,
        manuscriptFile,
        existingManuscriptUrl,
    ]);

    const handleClose = () => {
        if (submitting) return;
        resetForm();
        onClose();
    };

    const submitWithAction = (workflowAction: 'draft' | 'invite' | 'post') => {
        const error = validate(workflowAction);
        setClientError(error);
        if (error) return;

        const payload: Record<string, unknown> = {
            workflow_action: workflowAction,
            research_title: title.trim(),
            program_id: programId ? Number(programId) : null,
            research_adviser: currentFaculty.id,
            completed_month: month ? Number(month) : null,
            completed_year: year ? Number(year) : null,
            research_abstract: abstract.trim(),
            researchers,
            keywords: keywordNames,
            panelists: panelistIds,
            agendas: agendaIds,
            sdgs: sdgIds,
            srigs: srigIds,
            research_manuscript: manuscriptFile,
        };

        if (researchId) payload._method = 'put';

        setSubmitting(true);
        setServerErrors({});
        router.post(
            researchId ? `/research/${researchId}` : '/research',
            payload as never,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    const createdTitle = title.trim();
                    resetForm();
                    onCreated(createdTitle);
                },
                onError: (errors) => {
                    setServerErrors(errors as Record<string, string>);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const serverError = (key: string): string | undefined => {
        const value = serverErrors[key];
        return Array.isArray(value) ? value[0] : value;
    };

    const firstServerError = Object.entries(serverErrors)
        .map(([, value]) => (Array.isArray(value) ? value[0] : value))
        .find(Boolean);

    const handleSaveDraft = () => {
        if (!canSaveDraft || submitting || loading) return;
        submitWithAction('draft');
    };

    const handleConfirmInvite = async () => {
        if (!canInviteResearchers || submitting || loading) return;
        submitWithAction('invite');
    };

    const handlePostToRepository = () => {
        if (!canPostToRepository || submitting || loading) return;
        submitWithAction('post');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>{researchId ? 'Edit Draft' : 'Upload Research'}</DialogTitle>
                    <DialogDescription>
                        {researchId
                            ? 'Complete this draft or post it to the repository.'
                            : 'Add a new research entry to the repository.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveDraft();
                    }}
                    className="space-y-6"
                >
                    {(clientError || Object.keys(serverErrors).length > 0) && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            {clientError ?? firstServerError ?? 'Please fix the highlighted errors and try again.'}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Research Title *</Label>
                                <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} aria-invalid={!!serverErrors.research_title} />
                                {serverErrors.research_title && <p className="text-xs text-red-600">{serverErrors.research_title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Program *</Label>
                                <Select value={programId} onValueChange={setProgramId}>
                                    <SelectTrigger aria-invalid={!!serverErrors.program_id}>
                                        <SelectValue placeholder="Select program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.code ? `${p.code} – ${p.name}` : p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {serverErrors.program_id && <p className="text-xs text-red-600">{serverErrors.program_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Uploaded By</Label>
                                <Input type="text" value={currentFacultyName} disabled className="cursor-not-allowed bg-gray-100 dark:bg-gray-700" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically set to your faculty account.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Adviser *</Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={currentFacultyName}
                                        disabled
                                        className="cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                                    />
                                    <input type="hidden" name="research_adviser" value={currentFaculty.id} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    You are automatically set as the adviser for research you upload.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Completed Month</Label>
                                <Select value={month || '__none'} onValueChange={(v) => setMonth(v === '__none' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">None</SelectItem>
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={m} value={String(i + 1)}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {serverError('completed_month') && <p className="text-xs text-red-600">{serverError('completed_month')}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Completed Year *</Label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.currentTarget.value)}
                                    aria-invalid={!!serverErrors.completed_year}
                                />
                                {serverErrors.completed_year && <p className="text-xs text-red-600">{serverErrors.completed_year}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Abstract *</Label>
                                <Textarea
                                    rows={5}
                                    value={abstract}
                                    onChange={(e) => setAbstract(e.currentTarget.value)}
                                    aria-invalid={!!serverErrors.research_abstract}
                                />
                                {serverErrors.research_abstract && <p className="text-xs text-red-600">{serverErrors.research_abstract}</p>}
                            </div>
                        </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Researchers *</Label>
                            {!showResearcherForm && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setResearcherDraft(EMPTY_RESEARCHER);
                                        setEditingResearcherIndex(null);
                                        setShowResearcherForm(true);
                                    }}
                                >
                                    Add Researcher
                                </Button>
                            )}
                        </div>

                        {researchers.length > 0 && (
                            <div className="space-y-2">
                                {researchers.map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                        <div>
                                            <span className="font-medium">{[r.last_name, r.first_name].filter(Boolean).join(', ')}</span>
                                            {r.middle_name ? <span className="text-muted-foreground"> {r.middle_name}</span> : null}
                                            {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                                            {serverError(`researchers.${idx}.email`) && (
                                                <div className="text-xs text-red-600">{serverError(`researchers.${idx}.email`)}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => editResearcherAt(idx)}
                                                aria-label="Edit researcher"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeResearcherAt(idx)}
                                                aria-label="Remove researcher"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showResearcherForm && (
                            <div className="rounded-md border p-3">
                                <ResearcherInput
                                    value={researcherDraft}
                                    onChange={setResearcherDraft}
                                    onSave={addOrUpdateResearcher}
                                    emailError={editingResearcherIndex !== null ? serverError(`researchers.${editingResearcherIndex}.email`) : undefined}
                                    onCancel={() => {
                                        setShowResearcherForm(false);
                                        setEditingResearcherIndex(null);
                                        setResearcherDraft(EMPTY_RESEARCHER);
                                    }}
                                />
                            </div>
                        )}
                        {serverError('researchers') && <p className="text-xs text-red-600">{serverError('researchers')}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Panelists</Label>
                        <PanelistSelect faculties={panelistOptions} selectedIds={panelistIds} onChange={setPanelistIds} />
                        {serverError('panelists') && <p className="text-xs text-red-600">{serverError('panelists')}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Keywords *</Label>
                        <KeywordInput suggestions={keywordOptions} value={keywordDraft} onChange={setKeywordDraft} onAdd={addKeyword} />
                        {keywordNames.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {keywordNames.map((k) => (
                                    <span
                                        key={k}
                                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                    >
                                        {k}
                                        <button type="button" onClick={() => removeKeyword(k)} aria-label={`Remove ${k}`}>
                                            <X className="size-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {serverErrors.keywords && <p className="text-xs text-red-600">{serverErrors.keywords}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Thematic Tagging</Label>
                        <ThematicSection
                            agendas={agendas}
                            sdgs={sdgs}
                            srigs={srigs}
                            selectedAgendas={agendaIds}
                            selectedSdgs={sdgIds}
                            selectedSrigs={srigIds}
                            onChangeAgendas={setAgendaIds}
                            onChangeSdgs={setSdgIds}
                            onChangeSrigs={setSrigIds}
                        />
                        {serverError('agendas') && <p className="text-xs text-red-600">{serverError('agendas')}</p>}
                        {serverError('sdgs') && <p className="text-xs text-red-600">{serverError('sdgs')}</p>}
                        {serverError('srigs') && <p className="text-xs text-red-600">{serverError('srigs')}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Documents *</Label>
                        <FilesSection
                            manuscript={manuscriptFile}
                            onChangeManuscript={setManuscriptFile}
                            existingManuscriptUrl={existingManuscriptUrl}
                            errorManuscript={serverErrors.research_manuscript}
                        />
                    </div>

                    <DialogFooter>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!canSaveDraft || submitting || loading}
                                        onClick={handleSaveDraft}
                                    >
                                        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                        Save Draft
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Title and Program are required to save draft</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex">
                                    <Button type="button" disabled={!canPostToRepository || submitting || loading} onClick={handlePostToRepository}>
                                        Post to Repository
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">All posting requirements must be met</TooltipContent>
                        </Tooltip>
                    </DialogFooter>
                </form>
            </DialogContent>

            <ConfirmationModal
                open={inviteConfirmOpen}
                onOpenChange={setInviteConfirmOpen}
                title="Confirm researcher information"
                description="Please confirm the researcher names and email addresses are correct before invitations are sent."
                cancelText="Edit Changes"
                confirmText="Invite Researchers"
                onConfirm={handleConfirmInvite}
                isLoading={submitting}
            >
                <div className="space-y-2 text-sm">
                    {researchers.filter((r) => r.email.trim()).length === 0 ? (
                        <p className="text-muted-foreground">No researcher email addresses are available yet.</p>
                    ) : (
                        researchers
                            .filter((r) => r.email.trim())
                            .map((researcher, index) => (
                                <div key={`${researcher.email}-${index}`} className="rounded-md border px-3 py-2">
                                    <div className="font-medium">{[researcher.last_name, researcher.first_name].filter(Boolean).join(', ')}</div>
                                    <div className="text-xs text-muted-foreground">{researcher.email}</div>
                                </div>
                            ))
                    )}
                </div>
            </ConfirmationModal>
        </Dialog>
    );
}
