import KeywordInput from '@/components/research/keyword-input';
import PanelistSelect from '@/components/research/panelist-select';
import FilesSection from '@/components/research/research-form/files';
import ThematicSection from '@/components/research/research-form/thematic';
import ResearcherInput from '@/components/research/researcher-input';
import UnavailablePanelists from '@/components/research/unavailable-panelists';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Faculty as FacultyType } from '@/types';
import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { Loader2, Pencil, X } from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface DraftResearcher {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
}

interface MetadataValue {
    term: string;
    value: string;
    scheme: string;
    sort_order: number;
}

interface Props {
    open: boolean;
    programs: Program[];
    faculties: FacultyType[];
    keywordOptions: KeywordOption[];
    agendas: ThematicOption[];
    sdgs: ThematicOption[];
    srigs: ThematicOption[];
    librarianMode?: boolean;
    metadataTerms?: string[];
    onClose: () => void;
    onCreated: (title: string) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPTY_RESEARCHER: DraftResearcher = { first_name: '', middle_name: '', last_name: '', email: '' };

export default function ResearchUploadModal({
    open,
    programs,
    faculties,
    keywordOptions,
    agendas,
    sdgs,
    srigs,
    librarianMode = false,
    metadataTerms = [],
    onClose,
    onCreated,
}: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [clientError, setClientError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [programId, setProgramId] = useState<string>('');
    const [adviserId, setAdviserId] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [abstract, setAbstract] = useState('');
    const [researchers, setResearchers] = useState<DraftResearcher[]>([]);
    const [keywordNames, setKeywordNames] = useState<string[]>([]);
    const [panelistIds, setPanelistIds] = useState<number[]>([]);
    const [agendaIds, setAgendaIds] = useState<number[]>([]);
    const [sdgIds, setSdgIds] = useState<number[]>([]);
    const [srigIds, setSrigIds] = useState<number[]>([]);
    const [metadata, setMetadata] = useState<MetadataValue[]>([]);
    const [hardboundLocation, setHardboundLocation] = useState('');
    const [physicalAvailability, setPhysicalAvailability] = useState(false);
    const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
    const [panelistsUnavailable, setPanelistsUnavailable] = useState(false);
    const [manuscriptUnavailable, setManuscriptUnavailable] = useState(false);

    const [researcherDraft, setResearcherDraft] = useState<DraftResearcher>(EMPTY_RESEARCHER);
    const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null);
    const [showResearcherForm, setShowResearcherForm] = useState(false);
    const [keywordDraft, setKeywordDraft] = useState('');

    const resetForm = () => {
        setTitle('');
        setProgramId('');
        setAdviserId('');
        setMonth('');
        setYear(String(new Date().getFullYear()));
        setAbstract('');
        setResearchers([]);
        setKeywordNames([]);
        setPanelistIds([]);
        setAgendaIds([]);
        setSdgIds([]);
        setSrigIds([]);
        setMetadata([]);
        setHardboundLocation('');
        setPhysicalAvailability(false);
        setManuscriptFile(null);
        setPanelistsUnavailable(false);
        setManuscriptUnavailable(false);
        setResearcherDraft(EMPTY_RESEARCHER);
        setEditingResearcherIndex(null);
        setShowResearcherForm(false);
        setKeywordDraft('');
        setServerErrors({});
        setClientError(null);
    };

    const panelistOptions = faculties.filter((f) => String(f.id) !== adviserId);

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

    const addMetadataValue = (term: string) => {
        setMetadata((current) => [...current, { term, value: '', scheme: '', sort_order: current.filter((item) => item.term === term).length }]);
    };

    const updateMetadataValue = (index: number, field: 'value' | 'scheme', value: string) => {
        setMetadata((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
    };

    const removeMetadataValue = (index: number) => {
        setMetadata((current) => {
            const next = current.filter((_, currentIndex) => currentIndex !== index);
            return next.map((item) => ({
                ...item,
                sort_order: next.filter((row) => row.term === item.term).indexOf(item),
            }));
        });
    };

    const creatorNames = researchers.map((researcher) =>
        [researcher.first_name, researcher.middle_name, researcher.last_name].filter(Boolean).join(' '),
    );
    const derivedDate = year ? (month ? `${year}-${month.padStart(2, '0')}` : year) : '';

    const canPostToRepository = useMemo(() => {
        const postableResearchers =
            researchers.length > 0 && researchers.every((researcher) => researcher.first_name.trim() && researcher.last_name.trim());

        return Boolean(
            title.trim() &&
                programId &&
                adviserId &&
                month &&
                year.trim() &&
                abstract.trim() &&
                postableResearchers &&
                keywordNames.length &&
                agendaIds.length &&
                sdgIds.length &&
                srigIds.length &&
                (panelistsUnavailable || panelistIds.length) &&
                (manuscriptUnavailable || manuscriptFile),
        );
    }, [
        title,
        programId,
        adviserId,
        month,
        year,
        abstract,
        researchers,
        keywordNames.length,
        agendaIds.length,
        sdgIds.length,
        srigIds.length,
        panelistsUnavailable,
        panelistIds.length,
        manuscriptUnavailable,
        manuscriptFile,
    ]);

    const validate = (action: 'draft' | 'post'): string | null => {
        if (!title.trim()) return 'Research title is required.';
        if (!programId) return 'Program is required.';
        if (action === 'draft') return null;
        if (!year.trim()) return 'Completed Year is required.';
        if (!month) return 'Completed Month is required.';
        if (!abstract.trim()) return 'Abstract is required.';
        if (researchers.length < 1) return 'At least one researcher is required.';
        if (keywordNames.length < 1) return 'At least one keyword is required.';
        if (!panelistsUnavailable && !panelistIds.length) return 'At least one panelist is required or mark panelists unavailable.';
        if (!manuscriptUnavailable && !manuscriptFile) return 'The research manuscript is required or mark it unavailable.';
        if (!agendaIds.length || !sdgIds.length || !srigIds.length) return 'Agenda, SDG, and SRIG are required to post.';
        return null;
    };

    const handleClose = () => {
        if (submitting) return;
        resetForm();
        onClose();
    };

    const handleSubmit = (e: { preventDefault: () => void }, action: 'draft' | 'post' = 'draft') => {
        e.preventDefault();
        const error = validate(action);
        setClientError(error);
        if (error) return;

        const payload: Record<string, FormDataConvertible> = {
            research_title: title.trim(),
            program_id: programId ? Number(programId) : null,
            research_adviser: adviserId ? Number(adviserId) : null,
            completed_month: month ? Number(month) : null,
            completed_year: year ? Number(year) : null,
            research_abstract: abstract.trim(),
            researchers: researchers.map((researcher) => ({
                first_name: researcher.first_name,
                middle_name: researcher.middle_name ?? '',
                last_name: researcher.last_name,
                email: researcher.email,
            })),
            keywords: keywordNames,
            panelists: panelistIds,
            agendas: agendaIds,
            sdgs: sdgIds,
            srigs: srigIds,
            ...(librarianMode
                ? {
                      metadata: metadata.map((item) => ({
                          ...item,
                          scheme: item.scheme || null,
                      })),
                      hardbound_location: hardboundLocation,
                      physical_availability: physicalAvailability,
                  }
                : {}),
            research_manuscript: manuscriptFile,
            ...(librarianMode ? {} : { panelists_unavailable: panelistsUnavailable }),
            manuscript_unavailable: manuscriptUnavailable,
            workflow_action: action,
        };

        setSubmitting(true);
        setServerErrors({});
        router.post('/research', payload, {
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
        });
    };

    const serverError = (key: string): string | undefined => {
        const value = serverErrors[key];
        return Array.isArray(value) ? value[0] : value;
    };

    const firstServerError = Object.values(serverErrors)
        .map((value) => (Array.isArray(value) ? value[0] : value))
        .find(Boolean);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>{librarianMode ? 'Create Research Entry' : 'Upload Research'}</DialogTitle>
                    <DialogDescription>
                        {librarianMode
                            ? 'Enter the core research record and, if available, additional catalog metadata.'
                            : 'Add a new research entry to the repository.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            <Label>Adviser</Label>
                            <Select value={adviserId || '__none'} onValueChange={(v) => setAdviserId(v === '__none' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select adviser" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">None</SelectItem>
                                    {faculties.map((f) => (
                                        <SelectItem key={f.id} value={String(f.id)}>
                                            {[f.last_name, f.first_name].filter(Boolean).join(', ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    emailError={
                                        editingResearcherIndex !== null ? serverError(`researchers.${editingResearcherIndex}.email`) : undefined
                                    }
                                    onCancel={() => {
                                        setShowResearcherForm(false);
                                        setEditingResearcherIndex(null);
                                        setResearcherDraft(EMPTY_RESEARCHER);
                                    }}
                                />
                            </div>
                        )}
                        {serverErrors.researchers && <p className="text-xs text-red-600">{serverErrors.researchers}</p>}
                    </div>

                    {librarianMode ? (
                        <div className="space-y-2">
                            <Label>Panelists</Label>
                            <PanelistSelect faculties={panelistOptions} selectedIds={panelistIds} onChange={setPanelistIds} />
                        </div>
                    ) : (
                        <UnavailablePanelists
                            faculties={panelistOptions}
                            selectedIds={panelistIds}
                            onChange={setPanelistIds}
                            unavailable={panelistsUnavailable}
                            onUnavailableChange={(unavailable) => {
                                setPanelistsUnavailable(unavailable);
                                if (unavailable) setPanelistIds([]);
                            }}
                        />
                    )}

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
                    </div>

                    {librarianMode && (
                        <section className="space-y-4 rounded-md border border-amber-300 bg-amber-50/50 p-4 dark:bg-amber-950/10">
                            <h3 className="text-lg font-semibold">Librarian catalog metadata</h3>
                            <div className="divide-y divide-amber-200/80">
                                {[
                                    { label: 'Title', value: title || '—', source: 'Research title' },
                                    { label: 'Creator', value: creatorNames.join('; ') || '—', source: 'Researchers' },
                                    { label: 'Date', value: derivedDate || '—', source: 'Completion date' },
                                ].map(({ label, value, source }) => (
                                    <div key={label} className="grid gap-2 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start">
                                        <span className="text-sm font-semibold">{label}</span>
                                        <p className="text-sm text-foreground">{value}</p>
                                        <span className="w-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            {source}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <Label>Additional catalog values</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Repeated terms are grouped and each value may have an optional scheme.
                                    </p>
                                </div>
                                <Select value="" onValueChange={addMetadataValue}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Add a term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {metadataTerms.map((term) => (
                                            <SelectItem key={term} value={term}>
                                                {term.charAt(0).toUpperCase() + term.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {metadataTerms.map((term) => {
                                const termValues = metadata.map((item, index) => ({ ...item, index })).filter((item) => item.term === term);

                                if (termValues.length === 0) return null;

                                return (
                                    <div key={term} className="space-y-2 rounded-md border bg-background p-3">
                                        <Label>{term.charAt(0).toUpperCase() + term.slice(1)}</Label>
                                        {term === 'subject' && (
                                            <p className="text-xs text-muted-foreground">
                                                Keywords are recorded above. Add other subject terms or controlled vocabulary values here; avoid
                                                repeating a keyword.
                                            </p>
                                        )}
                                        {term === 'description' && (
                                            <p className="text-xs text-muted-foreground">
                                                The abstract is recorded above. Add only additional catalog description; do not copy the abstract
                                                here.
                                            </p>
                                        )}
                                        {termValues.map((item) => (
                                            <div key={`${term}-${item.index}`} className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                                                {term === 'subject' || term === 'description' ? (
                                                    <Textarea
                                                        value={item.value}
                                                        rows={term === 'description' ? 3 : 2}
                                                        onChange={(event) => updateMetadataValue(item.index, 'value', event.currentTarget.value)}
                                                        placeholder="Catalog value"
                                                        aria-invalid={Boolean(serverError(`metadata.${item.index}.value`))}
                                                    />
                                                ) : (
                                                    <Input
                                                        value={item.value}
                                                        onChange={(event) => updateMetadataValue(item.index, 'value', event.currentTarget.value)}
                                                        placeholder="Catalog value"
                                                        aria-invalid={Boolean(serverError(`metadata.${item.index}.value`))}
                                                    />
                                                )}
                                                <Input
                                                    value={item.scheme}
                                                    onChange={(event) => updateMetadataValue(item.index, 'scheme', event.currentTarget.value)}
                                                    placeholder="Scheme (optional)"
                                                    aria-invalid={Boolean(serverError(`metadata.${item.index}.scheme`))}
                                                />
                                                <Button type="button" variant="outline" onClick={() => removeMetadataValue(item.index)}>
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        {term === 'subject' && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto justify-start px-0 py-1"
                                                onClick={() => addMetadataValue(term)}
                                            >
                                                + Add another Subject value
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="space-y-2 border-t pt-4">
                                <Label>Library information</Label>
                                <Input
                                    value={hardboundLocation}
                                    onChange={(event) => setHardboundLocation(event.currentTarget.value)}
                                    placeholder="Hardbound location (optional)"
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={physicalAvailability}
                                        onChange={(event) => setPhysicalAvailability(event.currentTarget.checked)}
                                    />
                                    Available in the library
                                </label>
                            </div>
                        </section>
                    )}

                    <div className="space-y-2">
                        <Label>Documents</Label>
                        <FilesSection
                            manuscript={manuscriptFile}
                            onChangeManuscript={(file) => {
                                setManuscriptFile(file);
                                if (file) setManuscriptUnavailable(false);
                            }}
                            showUnavailableControls
                            manuscriptUnavailable={manuscriptUnavailable}
                            onManuscriptUnavailableChange={(unavailable) => {
                                setManuscriptUnavailable(unavailable);
                                if (unavailable) setManuscriptFile(null);
                            }}
                            errorManuscript={serverErrors.research_manuscript}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Save Draft
                        </Button>
                        <Button type="button" disabled={submitting || !canPostToRepository} onClick={(event) => handleSubmit(event, 'post')}>
                            Post to Repository
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
