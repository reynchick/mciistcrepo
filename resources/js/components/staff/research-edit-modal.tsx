import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, X } from 'lucide-react';

import ConfirmationModal from '@/components/modals/confirmation-modal';
import KeywordInput from '@/components/research/keyword-input';
import PanelistSelect from '@/components/research/panelist-select';
import FilesSection from '@/components/research/research-form/files';
import ThematicSection from '@/components/research/research-form/thematic';
import ResearcherInput from '@/components/research/researcher-input';
import UnavailablePanelists from '@/components/research/unavailable-panelists';
import type { Faculty as FacultyType } from '@/types';

interface Program {
    id: number;
    name: string;
    code?: string | null;
}

interface KeywordOption {
    id: number;
    keyword_name: string;
}

interface EditResearcher {
    id?: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    is_lead_author: boolean;
}

interface EditData {
    id: number;
    research_title: string;
    program_id: number | null;
    research_adviser: number | null;
    completed_month: number | null;
    completed_year: number | null;
    research_abstract: string;
    research_manuscript: string | null;
    hardbound_location?: string | null;
    physical_availability?: boolean;
    metadata_values?: MetadataValue[];
    researchers: EditResearcher[];
    keyword_names: string[];
    panelist_ids: number[];
    agenda_ids: number[];
    sdg_ids: number[];
    srig_ids: number[];
    status?: string | null;
    panelists_unavailable?: boolean;
    manuscript_unavailable?: boolean;
    posting_readiness?: {
        ready: boolean;
        missing: string[];
    };
}

interface MetadataValue {
    term: string;
    value: string;
    scheme?: string | null;
    sort_order?: number;
}

interface Props {
    researchId: number | null;
    programs: Program[];
    faculties: FacultyType[];
    keywordOptions: KeywordOption[];
    onClose: () => void;
    onSaved: (title: string) => void;
    disableAdviser?: boolean;
    staffMode?: boolean;
    librarianMode?: boolean;
    metadataTerms?: string[];
    agendas?: Array<{ id: number; name: string }>;
    sdgs?: Array<{ id: number; name: string }>;
    srigs?: Array<{ id: number; name: string }>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPTY_RESEARCHER: EditResearcher = { first_name: '', middle_name: '', last_name: '', email: '', is_lead_author: false };
const EMPTY_METADATA_TERMS: string[] = [];

type PostingFingerprint = {
    title: string;
    programId: string;
    abstract: string;
    month: string;
    year: string;
    researchers: Array<{ first_name: string; last_name: string }>;
    keywords: string[];
    panelists: number[];
    agendas: number[];
    sdgs: number[];
    srigs: number[];
    panelistsUnavailable: boolean;
    manuscriptAvailable: boolean;
    manuscriptUnavailable: boolean;
    manuscriptRemoved: boolean;
};

const postingFingerprint = (value: PostingFingerprint) => JSON.stringify(value);

export default function ResearchEditModal({
    researchId,
    programs,
    faculties,
    keywordOptions,
    onClose,
    onSaved,
    disableAdviser = false,
    staffMode = false,
    librarianMode = false,
    metadataTerms = EMPTY_METADATA_TERMS,
    agendas = [],
    sdgs = [],
    srigs = [],
}: Props) {
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [clientError, setClientError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('draft');
    const [staffConfirmation, setStaffConfirmation] = useState<'save' | 'post' | null>(null);

    const [title, setTitle] = useState('');
    const [programId, setProgramId] = useState<string>('');
    const [adviserId, setAdviserId] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [abstract, setAbstract] = useState('');
    const [researchers, setResearchers] = useState<EditResearcher[]>([]);
    const [keywordNames, setKeywordNames] = useState<string[]>([]);
    const [panelistIds, setPanelistIds] = useState<number[]>([]);
    const [agendaIds, setAgendaIds] = useState<number[]>([]);
    const [sdgIds, setSdgIds] = useState<number[]>([]);
    const [srigIds, setSrigIds] = useState<number[]>([]);
    const [metadata, setMetadata] = useState<MetadataValue[]>([]);
    const [hardboundLocation, setHardboundLocation] = useState('');
    const [physicalAvailability, setPhysicalAvailability] = useState(false);
    const [existingManuscriptUrl, setExistingManuscriptUrl] = useState<string | null>(null);
    const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
    const [manuscriptRemoved, setManuscriptRemoved] = useState(false);
    const [panelistsUnavailable, setPanelistsUnavailable] = useState(false);
    const [manuscriptUnavailable, setManuscriptUnavailable] = useState(false);
    const [persistedPostingReady, setPersistedPostingReady] = useState(false);
    const [initialPostingFingerprint, setInitialPostingFingerprint] = useState<string | null>(null);

    const handleManuscriptChange = (file: File | null) => {
        setManuscriptFile(file);
        if (file) setManuscriptRemoved(false);
    };

    const [researcherDraft, setResearcherDraft] = useState<EditResearcher>(EMPTY_RESEARCHER);
    const [editingResearcherIndex, setEditingResearcherIndex] = useState<number | null>(null);
    const [showResearcherForm, setShowResearcherForm] = useState(false);
    const [keywordDraft, setKeywordDraft] = useState('');

    const open = researchId !== null;

    const currentPostingFingerprint = useMemo(
        () =>
            postingFingerprint({
                title: title.trim(),
                programId,
                abstract: abstract.trim(),
                month,
                year: year.trim(),
                researchers: researchers.map((researcher) => ({
                    first_name: researcher.first_name.trim(),
                    last_name: researcher.last_name.trim(),
                })),
                keywords: keywordNames,
                panelists: panelistIds,
                agendas: agendaIds,
                sdgs: sdgIds,
                srigs: srigIds,
                panelistsUnavailable,
                manuscriptAvailable: Boolean(existingManuscriptUrl || manuscriptFile),
                manuscriptUnavailable,
                manuscriptRemoved,
            }),
        [
            title,
            programId,
            abstract,
            month,
            year,
            researchers,
            keywordNames,
            panelistIds,
            agendaIds,
            sdgIds,
            srigIds,
            panelistsUnavailable,
            existingManuscriptUrl,
            manuscriptFile,
            manuscriptUnavailable,
            manuscriptRemoved,
        ],
    );

    // Saving a staff-managed research needs only a title and program, while
    // posting requires a complete record.
    const canPostToRepository = useMemo(() => {
        const allResearchersPostable =
            researchers.length > 0 && researchers.every((researcher) => researcher.first_name.trim() && researcher.last_name.trim());

        const liveRequirementsMet = Boolean(
            title.trim() &&
                programId &&
                abstract.trim() &&
                month &&
                year.trim() &&
                allResearchersPostable &&
                keywordNames.length > 0 &&
                (panelistsUnavailable || panelistIds.length > 0) &&
                agendaIds.length > 0 &&
                sdgIds.length > 0 &&
                srigIds.length > 0 &&
                (manuscriptUnavailable || (!manuscriptRemoved && Boolean(existingManuscriptUrl || manuscriptFile))),
        );

        // Existing records are already persisted. While no value has changed,
        // use the same server-side readiness result that the post action uses.
        // Any edit immediately returns control to the live client predicate.
        return liveRequirementsMet || (persistedPostingReady && currentPostingFingerprint === initialPostingFingerprint);
    }, [
        title,
        programId,
        abstract,
        month,
        year,
        researchers,
        keywordNames.length,
        panelistIds.length,
        panelistsUnavailable,
        agendaIds.length,
        sdgIds.length,
        srigIds.length,
        manuscriptRemoved,
        existingManuscriptUrl,
        manuscriptFile,
        manuscriptUnavailable,
        persistedPostingReady,
        currentPostingFingerprint,
        initialPostingFingerprint,
    ]);

    useEffect(() => {
        if (!researchId) return;

        setLoading(true);
        setLoadError(null);
        setServerErrors({});
        setClientError(null);
        setSubmitError(null);
        setPersistedPostingReady(false);
        setInitialPostingFingerprint(null);

        fetch(`/research/${researchId}/edit-data`, { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load research data');
                return r.json();
            })
            .then((json) => {
                const data = json.data as EditData;
                setTitle(data.research_title ?? '');
                setStatus(data.status ?? 'draft');
                setProgramId(data.program_id ? String(data.program_id) : '');
                setAdviserId(data.research_adviser ? String(data.research_adviser) : '');
                setMonth(data.completed_month ? String(data.completed_month) : '');
                setYear(data.completed_year ? String(data.completed_year) : '');
                setAbstract(data.research_abstract ?? '');
                // Older posted entries can have nullable researcher values.
                // The posting-readiness calculation runs during render, so
                // normalize them before any field calls .trim().
                setResearchers(
                    Array.isArray(data.researchers)
                        ? data.researchers.map((researcher) => ({
                              ...researcher,
                              first_name: researcher.first_name ?? '',
                              middle_name: researcher.middle_name ?? '',
                              last_name: researcher.last_name ?? '',
                              email: researcher.email ?? '',
                              is_lead_author: Boolean(researcher.is_lead_author),
                          }))
                        : [],
                );
                setKeywordNames(Array.isArray(data.keyword_names) ? data.keyword_names : []);
                setPanelistIds(Array.isArray(data.panelist_ids) ? data.panelist_ids : []);
                setAgendaIds(Array.isArray(data.agenda_ids) ? data.agenda_ids : []);
                setSdgIds(Array.isArray(data.sdg_ids) ? data.sdg_ids : []);
                setSrigIds(Array.isArray(data.srig_ids) ? data.srig_ids : []);
                setMetadata(
                    Array.isArray(data.metadata_values)
                        ? data.metadata_values
                              .filter((item) => !['title', 'creator', 'date'].includes(item.term))
                              .sort(
                                  (a, b) =>
                                      metadataTerms.indexOf(a.term) - metadataTerms.indexOf(b.term) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
                              )
                              .map((item) => ({ ...item, scheme: item.scheme ?? '' }))
                        : [],
                );
                setHardboundLocation(data.hardbound_location ?? '');
                setPhysicalAvailability(Boolean(data.physical_availability));
                setExistingManuscriptUrl(data.research_manuscript ? `/research/${data.id}/manuscript` : null);
                setManuscriptFile(null);
                setManuscriptRemoved(false);
                setPanelistsUnavailable(Boolean(data.panelists_unavailable));
                setManuscriptUnavailable(Boolean(data.manuscript_unavailable));
                setPersistedPostingReady(Boolean(data.posting_readiness?.ready));
                setInitialPostingFingerprint(
                    postingFingerprint({
                        title: (data.research_title ?? '').trim(),
                        programId: data.program_id ? String(data.program_id) : '',
                        abstract: (data.research_abstract ?? '').trim(),
                        month: data.completed_month ? String(data.completed_month) : '',
                        year: data.completed_year ? String(data.completed_year) : '',
                        researchers: (Array.isArray(data.researchers) ? data.researchers : []).map((researcher) => ({
                            first_name: (researcher.first_name ?? '').trim(),
                            last_name: (researcher.last_name ?? '').trim(),
                        })),
                        keywords: Array.isArray(data.keyword_names) ? data.keyword_names : [],
                        panelists: Array.isArray(data.panelist_ids) ? data.panelist_ids : [],
                        agendas: Array.isArray(data.agenda_ids) ? data.agenda_ids : [],
                        sdgs: Array.isArray(data.sdg_ids) ? data.sdg_ids : [],
                        srigs: Array.isArray(data.srig_ids) ? data.srig_ids : [],
                        panelistsUnavailable: Boolean(data.panelists_unavailable),
                        manuscriptAvailable: Boolean(data.research_manuscript),
                        manuscriptUnavailable: Boolean(data.manuscript_unavailable),
                        manuscriptRemoved: false,
                    }),
                );
                setShowResearcherForm(false);
                setEditingResearcherIndex(null);
                setResearcherDraft(EMPTY_RESEARCHER);
                setKeywordDraft('');
            })
            .catch((e) => setLoadError(e.message || 'Unable to load research data'))
            .finally(() => setLoading(false));
    }, [researchId, metadataTerms]);

    const panelistOptions = useMemo(() => faculties.filter((faculty) => String(faculty.id) !== adviserId), [faculties, adviserId]);

    const adviserName = useMemo(() => (adviserId ? faculties.find((faculty) => String(faculty.id) === adviserId) : null), [adviserId, faculties]);

    const researcherRowErrors = useMemo(() => {
        const map: Record<number, string[]> = {};
        Object.entries(serverErrors).forEach(([key, message]) => {
            const match = key.match(/^researchers\.(\d+)\./);
            if (match) {
                const idx = Number(match[1]);
                if (!map[idx]) map[idx] = [];
                map[idx].push(message);
            }
        });
        return map;
    }, [serverErrors]);

    const keywordItemErrors = useMemo(
        () =>
            Object.entries(serverErrors)
                .filter(([key]) => /^keywords\.\d+$/.test(key))
                .map(([, message]) => message),
        [serverErrors],
    );

    const panelistErrors = useMemo(
        () =>
            Object.entries(serverErrors)
                .filter(([key]) => /^panelists(\.\d+)?$/.test(key))
                .map(([, message]) => message),
        [serverErrors],
    );

    const unmappedErrors = useMemo(() => {
        const fieldKeys = new Set([
            'research_title',
            'program_id',
            'research_adviser',
            'completed_month',
            'completed_year',
            'research_abstract',
            'researchers',
            'keywords',
            'research_manuscript',
        ]);

        return Object.entries(serverErrors)
            .filter(([key]) => !fieldKeys.has(key) && !/^researchers\./.test(key) && !/^keywords\.\d+$/.test(key) && !/^panelists(\.\d+)?$/.test(key))
            .map(([, message]) => message);
    }, [serverErrors]);

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

        setKeywordNames((prev) => (prev.some((keyword) => keyword.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]));
        setKeywordDraft('');
    };

    const removeKeyword = (value: string) => {
        setKeywordNames((prev) => prev.filter((keyword) => keyword !== value));
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

    const managerMode = staffMode || librarianMode;
    const creatorNames = researchers.map((researcher) =>
        [researcher.first_name, researcher.middle_name, researcher.last_name].filter(Boolean).join(' '),
    );
    const derivedDate = year ? (month ? `${year}-${month.padStart(2, '0')}` : year) : '';

    const validate = (action: 'draft' | 'staff_save' | 'post'): string | null => {
        if (!title.trim()) return 'Research title is required.';
        if (!programId) return 'Program is required.';
        if ((staffMode && action === 'staff_save') || (librarianMode && action === 'draft')) return null;
        if (!year.trim()) return 'Completed Year is required.';
        if (!month) return 'Completed Month is required.';
        if (!abstract.trim()) return 'Abstract is required.';
        if (researchers.length < 1) return 'At least one researcher is required.';
        if (researchers.some((researcher) => !researcher.first_name.trim() || !researcher.last_name.trim()))
            return 'Each researcher needs a first name and last name.';
        if (keywordNames.length < 1) return 'At least one keyword is required.';
        if (!panelistsUnavailable && panelistIds.length < 1) return 'At least one panelist is required or mark panelists unavailable.';
        if (agendaIds.length < 1) return 'At least one agenda is required.';
        if (sdgIds.length < 1) return 'At least one SDG is required.';
        if (srigIds.length < 1) return 'At least one SRIG is required.';
        if (!manuscriptUnavailable && !existingManuscriptUrl && !manuscriptFile) return 'The research manuscript is required or mark it unavailable.';
        return null;
    };

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent | undefined, action: 'draft' | 'staff_save' | 'post' = 'draft') => {
        e?.preventDefault();

        const error = validate(action);
        setClientError(error);
        if (error || !researchId) return;

        const payload: Record<string, FormDataConvertible> = {
            research_title: title.trim(),
            program_id: programId ? Number(programId) : null,
            research_adviser: adviserId ? Number(adviserId) : null,
            completed_month: month ? Number(month) : null,
            completed_year: year ? Number(year) : null,
            research_abstract: abstract.trim(),
            keywords: keywordNames,
            panelists: panelistIds,
            agendas: agendaIds,
            sdgs: sdgIds,
            srigs: srigIds,
            ...(staffMode
                ? {
                      panelists_unavailable: panelistsUnavailable,
                  }
                : {}),
            ...(staffMode || librarianMode ? { manuscript_unavailable: manuscriptUnavailable } : {}),
            ...(librarianMode
                ? {
                      metadata: metadata.map((item) => ({
                          term: item.term,
                          value: item.value,
                          scheme: item.scheme?.trim() || null,
                          sort_order: metadata.filter((row) => row.term === item.term).indexOf(item),
                      })),
                      hardbound_location: hardboundLocation,
                      physical_availability: physicalAvailability,
                  }
                : {}),
        };

        if (staffMode && (action === 'staff_save' || action === 'post')) payload.workflow_action = action;
        if (librarianMode && action === 'post') payload.workflow_action = action;

        payload.researchers = researchers.map((researcher) => ({
            id: researcher.id,
            first_name: researcher.first_name,
            middle_name: researcher.middle_name ?? '',
            last_name: researcher.last_name,
            email: researcher.email,
            is_lead_author: researcher.is_lead_author,
        }));

        if (manuscriptFile) payload.research_manuscript = manuscriptFile;
        if (manuscriptRemoved) payload.clear_research_manuscript = true;
        payload._method = 'put';

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
        if (csrfToken) payload._token = csrfToken;

        setSubmitting(true);
        setServerErrors({});
        setSubmitError(null);
        let settled = false;

        router.post(`/research/${researchId}`, payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: async () => {
                settled = true;

                onSaved(title.trim());
            },
            onError: (errors) => {
                settled = true;
                const errs = (errors ?? {}) as Record<string, string>;
                if (Object.keys(errs).length === 0) {
                    setSubmitError('Saving failed because of an unexpected server error. Your changes were not saved — please try again.');
                } else {
                    setServerErrors(errs);
                }
            },
            onFinish: () => {
                setSubmitting(false);
                if (!settled) {
                    setSubmitError(
                        'Saving failed — this was not a form validation problem. Your session may have expired or the server hit an error. Refresh the page and try again.',
                    );
                }
            },
        });
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(v) => {
                    if (!v) handleClose();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>{librarianMode ? 'Edit Research Entry' : 'Edit Research'}</DialogTitle>
                        <DialogDescription>
                            {librarianMode
                                ? 'Update the core research record, catalog metadata, and library information.'
                                : 'Update the details of this research entry.'}
                        </DialogDescription>
                    </DialogHeader>

                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" /> Loading research details...
                        </div>
                    )}

                    {loadError && <p className="py-4 text-sm text-red-600">{loadError}</p>}

                    {!loading && !loadError && (
                        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
                            {(clientError || submitError || Object.keys(serverErrors).length > 0) && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                    {clientError ?? submitError ?? (
                                        <>
                                            <p>Please fix the highlighted errors below and try again.</p>
                                            {unmappedErrors.length > 0 && (
                                                <ul className="mt-1 list-disc pl-5">
                                                    {unmappedErrors.map((message, index) => (
                                                        <li key={index}>{message}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Research Title *</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.currentTarget.value)}
                                        aria-invalid={!!serverErrors.research_title}
                                    />
                                    {serverErrors.research_title && <p className="text-xs text-red-600">{serverErrors.research_title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Program *</Label>
                                    <Select value={programId} onValueChange={setProgramId}>
                                        <SelectTrigger aria-invalid={!!serverErrors.program_id}>
                                            <SelectValue placeholder="Select program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {programs.map((program) => (
                                                <SelectItem key={program.id} value={String(program.id)}>
                                                    {program.code ? `${program.code} – ${program.name}` : program.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {serverErrors.program_id && <p className="text-xs text-red-600">{serverErrors.program_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Adviser</Label>
                                    {disableAdviser ? (
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={adviserName ? [adviserName.last_name, adviserName.first_name].filter(Boolean).join(', ') : ''}
                                                disabled
                                                className="cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                                            />
                                        </div>
                                    ) : (
                                        <Select
                                            value={adviserId || '__none'}
                                            onValueChange={(value) => setAdviserId(value === '__none' ? '' : value)}
                                        >
                                            <SelectTrigger aria-invalid={!!serverErrors.research_adviser}>
                                                <SelectValue placeholder="Select adviser" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none">None</SelectItem>
                                                {faculties.map((faculty) => (
                                                    <SelectItem key={faculty.id} value={String(faculty.id)}>
                                                        {[faculty.last_name, faculty.first_name].filter(Boolean).join(', ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {serverErrors.research_adviser && <p className="text-xs text-red-600">{serverErrors.research_adviser}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Completed Month</Label>
                                    <Select value={month || '__none'} onValueChange={(value) => setMonth(value === '__none' ? '' : value)}>
                                        <SelectTrigger aria-invalid={!!serverErrors.completed_month}>
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none">None</SelectItem>
                                            {MONTHS.map((monthName, index) => (
                                                <SelectItem key={monthName} value={String(index + 1)}>
                                                    {monthName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {serverErrors.completed_month && <p className="text-xs text-red-600">{serverErrors.completed_month}</p>}
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
                                    <Label>Researcher/s *</Label>
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
                                        {researchers.map((researcher, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div
                                                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${researcherRowErrors[idx] ? 'border-red-500 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20' : ''}`}
                                                >
                                                    <div>
                                                        <span className="font-medium">
                                                            {[researcher.last_name, researcher.first_name].filter(Boolean).join(', ')}
                                                        </span>
                                                        {researcher.middle_name ? (
                                                            <span className="text-muted-foreground"> {researcher.middle_name}</span>
                                                        ) : null}
                                                        {researcher.email && <div className="text-xs text-muted-foreground">{researcher.email}</div>}
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
                                                {researcherRowErrors[idx]?.map((message, index) => (
                                                    <p key={index} className="text-xs text-red-600">
                                                        {message}
                                                    </p>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showResearcherForm && (
                                    <div className="rounded-md border p-3">
                                        <ResearcherInput
                                            value={researcherDraft}
                                            onChange={(value) =>
                                                setResearcherDraft((current) => ({
                                                    ...current,
                                                    ...value,
                                                    is_lead_author: Boolean(value.is_lead_author),
                                                }))
                                            }
                                            onSave={addOrUpdateResearcher}
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

                            <div className="space-y-2">
                                {staffMode ? (
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
                                ) : (
                                    <>
                                        <Label>Panelists</Label>
                                        <PanelistSelect faculties={panelistOptions} selectedIds={panelistIds} onChange={setPanelistIds} />
                                    </>
                                )}
                                {panelistErrors.map((message, index) => (
                                    <p key={index} className="text-xs text-red-600">
                                        {message}
                                    </p>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>Keywords *</Label>
                                <KeywordInput suggestions={keywordOptions} value={keywordDraft} onChange={setKeywordDraft} onAdd={addKeyword} />
                                {keywordNames.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {keywordNames.map((keyword) => (
                                            <span
                                                key={keyword}
                                                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                            >
                                                {keyword}
                                                <button type="button" onClick={() => removeKeyword(keyword)} aria-label={`Remove ${keyword}`}>
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {serverErrors.keywords && <p className="text-xs text-red-600">{serverErrors.keywords}</p>}
                                {keywordItemErrors.map((message, index) => (
                                    <p key={index} className="text-xs text-red-600">
                                        {message}
                                    </p>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>Documents (leave blank to keep current file)</Label>
                                <FilesSection
                                    manuscript={manuscriptFile}
                                    manuscriptRemoved={manuscriptRemoved}
                                    onChangeManuscript={handleManuscriptChange}
                                    onRemoveManuscript={() => setManuscriptRemoved(true)}
                                    existingManuscriptUrl={existingManuscriptUrl}
                                    errorManuscript={serverErrors.research_manuscript}
                                    showUnavailableControls={staffMode || librarianMode}
                                    manuscriptUnavailable={manuscriptUnavailable}
                                    onManuscriptUnavailableChange={(unavailable) => {
                                        setManuscriptUnavailable(unavailable);
                                        if (unavailable) {
                                            setManuscriptFile(null);
                                            setManuscriptRemoved(false);
                                        }
                                    }}
                                />
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
                                    canEdit
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
                                                        Keywords are recorded above. Add additional subject terms or controlled vocabulary values;
                                                        avoid repeating a keyword.
                                                    </p>
                                                )}
                                                {term === 'description' && (
                                                    <p className="text-xs text-muted-foreground">
                                                        The abstract is recorded above. Add only additional catalog description; do not copy the
                                                        abstract here.
                                                    </p>
                                                )}
                                                {termValues.map((item) => (
                                                    <div
                                                        key={`${term}-${item.index}`}
                                                        className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
                                                    >
                                                        {term === 'subject' || term === 'description' ? (
                                                            <Textarea
                                                                value={item.value}
                                                                rows={term === 'description' ? 3 : 2}
                                                                onChange={(event) =>
                                                                    updateMetadataValue(item.index, 'value', event.currentTarget.value)
                                                                }
                                                                placeholder="Catalog value"
                                                                aria-invalid={Boolean(serverErrors[`metadata.${item.index}.value`])}
                                                            />
                                                        ) : (
                                                            <Input
                                                                value={item.value}
                                                                onChange={(event) =>
                                                                    updateMetadataValue(item.index, 'value', event.currentTarget.value)
                                                                }
                                                                placeholder="Catalog value"
                                                                aria-invalid={Boolean(serverErrors[`metadata.${item.index}.value`])}
                                                            />
                                                        )}
                                                        <Input
                                                            value={item.scheme ?? ''}
                                                            onChange={(event) => updateMetadataValue(item.index, 'scheme', event.currentTarget.value)}
                                                            placeholder="Scheme (optional)"
                                                            aria-invalid={Boolean(serverErrors[`metadata.${item.index}.scheme`])}
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

                            <DialogFooter>
                                {!managerMode && (
                                    <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                                        Cancel
                                    </Button>
                                )}
                                {!managerMode && (
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                        Save Changes
                                    </Button>
                                )}
                                {librarianMode && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={submitting}
                                            onClick={() => void handleSubmit(undefined, 'draft')}
                                        >
                                            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                            Save
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={submitting || !canPostToRepository}
                                            onClick={() => void handleSubmit(undefined, 'post')}
                                        >
                                            Post to Repository
                                        </Button>
                                    </>
                                )}
                                {staffMode && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={submitting}
                                            onClick={() =>
                                                status === 'posted' ? setStaffConfirmation('save') : void handleSubmit(undefined, 'staff_save')
                                            }
                                        >
                                            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                            Save
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={submitting || !canPostToRepository}
                                            onClick={() =>
                                                status === 'posted' ? setStaffConfirmation('post') : void handleSubmit(undefined, 'post')
                                            }
                                        >
                                            Post to Repository
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
            <ConfirmationModal
                open={staffConfirmation !== null}
                onOpenChange={(open) => {
                    if (!open) setStaffConfirmation(null);
                }}
                title={staffConfirmation === 'save' ? 'Save and unpost research?' : 'Keep research posted?'}
                description={
                    staffConfirmation === 'save'
                        ? "Saving will change this research's status to Draft. It will no longer appear on the Browse Research page. Do you want to continue?"
                        : 'This will save your changes and keep this research posted in the repository. Do you want to continue?'
                }
                confirmText="Confirm"
                onConfirm={() => void handleSubmit(undefined, staffConfirmation === 'save' ? 'staff_save' : 'post')}
            />
        </>
    );
}
