import AppLayout from '@/layouts/app/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router} from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

interface Program { id: number; name: string }
interface Adviser { id: number; first_name?: string; last_name?: string; middle_name?: string }
interface Researcher { id: number; first_name?: string; middle_name?: string; last_name?: string }
interface Keyword { id: number; keyword_name: string }
interface Research {
    id: number;
    research_title: string;
    research_abstract: string;
    published_year?: number;
    published_month?: number;
    program?: Program;
    adviser?: Adviser;
    researchers?: Researcher[];
    keywords?: Keyword[];
    archived_at?: string | null;
    created_at?: string;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    researches: Paginator<Research>;
    programs: Program[];
    advisers: Adviser[];
    filters: {
        search?: string;
        program?: string | number;
        adviser?: string | number;
        year?: string | number;
        archived?: boolean;
        page?: number;
    };
}

export default function ResearchIndex({ researches, programs, advisers, filters }: Props) {
    const [search, setSearch] = useState(String(filters.search ?? ''));
    const [program, setProgram] = useState(String(filters.program ?? ''));
    const [adviser, setAdviser] = useState(String(filters.adviser ?? ''));
    const [year, setYear] = useState(String(filters.year ?? ''));

    const submit = (overrides: Record<string, unknown> = {}) => {
        const params: Record<string, unknown> = {
            search: search || undefined,
            program: program || undefined,
            adviser: adviser || undefined,
            year: year || undefined,
            ...overrides,
        };
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, String(value));
            }
        });
        router.get('/researches', formData, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Research" />
            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Research Repository</h1>
                        <p className="text-muted-foreground">Search and filter researches by program, year, and adviser</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filters</CardTitle>
                        <CardDescription>Find specific research entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-4">
                            <div className="md:col-span-2 flex items-center gap-2">
                                <Input
                                    placeholder="Search title, abstract, or keyword"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                                />
                                <Button onClick={() => submit()}>Search</Button>
                            </div>
                            <div>
                                <Select value={program} onValueChange={(v) => { setProgram(v); submit({ program: v || undefined }); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Programs</SelectItem>
                                        {programs.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select value={adviser} onValueChange={(v) => { setAdviser(v); submit({ adviser: v || undefined }); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Research Adviser" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Advisers</SelectItem>
                                        {advisers.map((a) => (
                                            <SelectItem key={a.id} value={String(a.id)}>
                                                {(a.last_name || '') + (a.first_name ? `, ${a.first_name}` : '')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-1">
                                <Input
                                    type="number"
                                    placeholder="Year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    onBlur={() => submit()}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Researches</CardTitle>
                        <CardDescription>{researches.total} result(s) found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow> 
                                    <TableHead>Title</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Adviser</TableHead>
                                    <TableHead>Completion Year</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {researches.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.research_title}</TableCell>
                                        <TableCell>{r.program?.name || '-'}</TableCell>
                                        <TableCell>{r.adviser ? `${r.adviser.last_name ?? ''}${r.adviser.first_name ? `, ${r.adviser.first_name}` : ''}` : '-'}</TableCell>
                                        <TableCell>{r.published_year ?? '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {researches.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((researches.current_page - 1) * researches.per_page) + 1} to {Math.min(researches.current_page * researches.per_page, researches.total)} of {researches.total}
                                </div>
                                <div className="flex items-center gap-2">
                                    {researches.current_page > 1 && (
                                        <Button variant="outline" size="sm" onClick={() => submit({ page: researches.current_page - 1 })}>Previous</Button>
                                    )}
                                    {researches.current_page < researches.last_page && (
                                        <Button variant="outline" size="sm" onClick={() => submit({ page: researches.current_page + 1 })}>Next</Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
