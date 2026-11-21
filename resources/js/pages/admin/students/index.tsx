import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ConfirmationModal from '@/components/modals/confirmation-modal';
import Pagination, { type LaravelPaginationMeta } from '@/components/shared/pagination';
import { Search, Plus, Download, Upload, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import StudentCreateDialog from '@/components/students/student-create-dialog';

type StudentRecord = {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    student_id: string;
    email: string;
    access_approved: boolean;
    access_status?: 'approved' | 'unapproved' | 'revoked';
    access_approved_at?: string | null;
    access_revoked_at?: string | null;
    created_at: string;
    last_login: string;
};

type StudentsPage = LaravelPaginationMeta & {
    data: StudentRecord[];
};

type StudentPageProps = {
    students: StudentsPage;
    filters: {
        search?: string | null;
        status?: string | null;
    };
    flash?: {
        csv_import_summary?: CsvImportSummary | null;
    };
};

type CsvImportSkippedStudent = {
    row: number;
    student_id: string;
    email: string;
    reason: string;
};

type CsvImportRowIssue = {
    row: number;
    reason: string;
};

type CsvImportSummary = {
    imported_count: number;
    skipped_count: number;
    invalid_count: number;
    skipped_students: CsvImportSkippedStudent[];
    invalid_rows: CsvImportRowIssue[];
};

type ConfirmationAction = {
    type: 'approve' | 'revoke' | 'delete';
    student: StudentRecord;
};

const confirmationActionLabel = (type: ConfirmationAction['type']): string => {
    return type === 'delete' ? 'Delete' : type === 'approve' ? 'Approve' : 'Revoke';
};

export default function StudentManagement({ students, filters, flash }: StudentPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [importConfirmationOpen, setImportConfirmationOpen] = useState(false);
    const [importSummaryOpen, setImportSummaryOpen] = useState(Boolean(flash?.csv_import_summary));
    const [showSkippedStudents, setShowSkippedStudents] = useState(false);
    const [createStudentOpen, setCreateStudentOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const importSummary = flash?.csv_import_summary;

    React.useEffect(() => {
        if (importSummary) {
            setImportSummaryOpen(true);
            setShowSkippedStudents(false);
        }
    }, [importSummary]);

    React.useEffect(() => {
        router.get(
            '/admin/students',
            { search: debouncedSearch, status: status === 'all' ? '' : status },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    }, [debouncedSearch, status]);

    const handleDownloadTemplate = () => {
        window.location.href = '/admin/students/import/template';
    };

    const confirmImport = () => {
        if (!pendingFile) return;

        const formData = new FormData();
        formData.append('csv_file', pendingFile);
        router.post('/admin/students/import/csv', formData);
        setPendingFile(null);
        setImportConfirmationOpen(false);
    };

    const getStatusBadge = (student: StudentRecord) => {
        if (!student.access_approved && !student.access_revoked_at) {
            return (
                <Badge variant="outline" className="border-0 bg-amber-100 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    Unapproved
                </Badge>
            );
        }
        if (student.access_revoked_at) {
            return (
                <Badge variant="outline" className="border-0 bg-red-100 text-[11px] font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                    Revoked
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="border-0 bg-emerald-100 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                Approved
            </Badge>
        );
    };

    const confirmAction = () => {
        if (!confirmationAction) return;

        const { type, student } = confirmationAction;
        if (type === 'approve') {
            router.post(`/admin/students/${student.id}/approve-access`);
        } else if (type === 'revoke') {
            router.post(`/admin/students/${student.id}/revoke-access`);
        } else {
            router.delete(`/admin/students/${student.id}`);
        }
    };

    const confirmationTitle = confirmationAction
        ? `${confirmationActionLabel(confirmationAction.type)} student access`
        : '';
    const confirmationDescription = confirmationAction
        ? confirmationAction.type === 'delete'
            ? `Delete ${confirmationAction.student.first_name} ${confirmationAction.student.last_name}'s record? This action cannot be undone.`
            : `${confirmationActionLabel(confirmationAction.type)} system access for ${confirmationAction.student.first_name} ${confirmationAction.student.last_name}?`
        : '';
    const displayedStudentStart = students.from ?? (students.current_page - 1) * students.per_page + 1;
    const displayedStudentEnd = students.to ?? Math.min(students.current_page * students.per_page, students.total);

    return (
        <AppLayout>
            <Head title="Student Management" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage student records, approvals, and access
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            CSV Template
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import CSV
                        </Button>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setPendingFile(e.target.files[0]);
                                    setImportConfirmationOpen(true);
                                }
                                e.target.value = '';
                            }}
                        />
                        <Button
                            size="sm"
                            className="gap-2"
                            type="button"
                            onClick={() => setCreateStudentOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Student
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card className="!mt-0.5 overflow-hidden rounded-lg bg-white shadow-xs">
                    <CardHeader className="gap-3 border-b bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-baseline gap-2">
                            <CardTitle className="text-base">All students</CardTitle>
                            <CardDescription className="text-xs">
                                {students.total === 0
                                    ? 'No students found'
                                    : `${displayedStudentStart}–${displayedStudentEnd} of ${students.total} shown`}
                            </CardDescription>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    aria-label="Search students"
                                    placeholder="Search by name, email, or student ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 bg-white pl-9"
                                />
                            </div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger
                                    aria-label="Filter students by access status"
                                    className="h-9 w-full rounded-lg border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 sm:w-40"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="revoked">Revoked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="table-scroll overflow-x-auto">
                            <Table className="w-max min-w-full bg-white font-sans whitespace-nowrap [&_td]:px-4 [&_th]:px-4">
                                <TableHeader>
                                    <TableRow className="bg-white text-[11px] uppercase tracking-wide hover:bg-white">
                                        <TableHead className="text-muted-foreground">Name</TableHead>
                                        <TableHead className="text-muted-foreground">Student ID</TableHead>
                                        <TableHead className="text-muted-foreground">Email</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-muted-foreground">Date Added</TableHead>
                                        <TableHead className="text-muted-foreground">Last Login</TableHead>
                                        <TableHead className="pr-4 text-right text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.data.length > 0 ? (
                                        students.data.map((student) => (
                                            <TableRow key={student.id} className="hover:bg-muted/40">
                                                <TableCell className="py-3 font-medium">
                                                    {student.last_name}, {student.first_name}{student.middle_name ? ` ${student.middle_name}` : ''}
                                                </TableCell>
                                                <TableCell className="py-3 font-mono text-sm">{student.student_id}</TableCell>
                                                <TableCell className="py-3 text-sm">{student.email}</TableCell>
                                                <TableCell className="py-3">{getStatusBadge(student)}</TableCell>
                                                <TableCell className="py-3 text-sm text-muted-foreground">{student.created_at}</TableCell>
                                                <TableCell className="py-3 text-sm text-muted-foreground">{student.last_login}</TableCell>
                                                <TableCell className="py-3 pr-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={`/admin/students/${student.id}/edit`}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        {student.access_approved && !student.access_revoked_at && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setConfirmationAction({ type: 'revoke', student })}
                                                                title="Revoke Access"
                                                            >
                                                                <Lock className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        )}
                                                        {(!student.access_approved || student.access_revoked_at) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setConfirmationAction({ type: 'approve', student })}
                                                                title="Approve Access"
                                                            >
                                                                <Unlock className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setConfirmationAction({ type: 'delete', student })}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                                No students found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {students.last_page > 1 && (
                    <Pagination meta={students} />
                )}
            </div>

                <StudentCreateDialog
                    open={createStudentOpen}
                    onOpenChange={setCreateStudentOpen}
                />

            <ConfirmationModal
                open={confirmationAction !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmationAction(null);
                }}
                title={confirmationTitle}
                description={confirmationDescription}
                confirmText={confirmationAction ? confirmationActionLabel(confirmationAction.type) : 'Confirm'}
                danger={confirmationAction?.type !== 'approve'}
                onConfirm={confirmAction}
            />

            <ConfirmationModal
                open={importConfirmationOpen}
                onOpenChange={(open) => {
                    setImportConfirmationOpen(open);
                    if (!open) setPendingFile(null);
                }}
                title="Import student CSV?"
                description="Existing students will be skipped. New students will be added. Invalid rows will be reported in the import summary."
                confirmText="Import CSV"
                onConfirm={confirmImport}
            >
                {pendingFile && (
                    <p className="text-sm text-muted-foreground">
                        Selected file: <span className="font-medium text-foreground">{pendingFile.name}</span>
                    </p>
                )}
            </ConfirmationModal>

            <ConfirmationModal
                open={importSummaryOpen}
                onOpenChange={setImportSummaryOpen}
                title="Student import summary"
                description="New students were added, existing students were skipped, and invalid rows were not imported."
                confirmText="Close"
                onConfirm={() => setImportSummaryOpen(false)}
            >
                {importSummary && (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="rounded-md border p-3">
                                <div className="text-lg font-semibold">{importSummary.imported_count}</div>
                                <div className="text-muted-foreground">Added</div>
                            </div>
                            <div className="rounded-md border p-3">
                                <div className="text-lg font-semibold">{importSummary.skipped_count}</div>
                                <div className="text-muted-foreground">Duplicates</div>
                            </div>
                        </div>

                        {importSummary.skipped_students.length > 0 && (
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSkippedStudents((visible) => !visible)}
                                >
                                    {showSkippedStudents ? 'Hide duplicates' : 'View duplicates'}
                                </Button>
                                {showSkippedStudents && (
                                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                                        {importSummary.skipped_students.map((student) => (
                                            <div key={`${student.row}-${student.student_id}-${student.email}`} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                <div className="font-medium">Row {student.row}: {student.student_id || 'No student ID'}</div>
                                                <div className="text-muted-foreground">{student.email || 'No email'} · {student.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {importSummary.invalid_rows.length > 0 && (
                            <div className="max-h-32 overflow-y-auto rounded-md border p-3 text-muted-foreground">
                                <div className="mb-2 font-medium text-foreground">Invalid rows</div>
                                {importSummary.invalid_rows.map((issue) => (
                                    <div key={`${issue.row}-${issue.reason}`}>Row {issue.row}: {issue.reason}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </ConfirmationModal>
        </AppLayout>
    );
}
