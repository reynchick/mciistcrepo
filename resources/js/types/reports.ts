export interface Program {
    id: number;
    name: string;
}

export interface Faculty {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
}

export interface Researcher {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
}

export interface SDG {
    id: number;
    name: string;
}

export interface SRIG {
    id: number;
    name: string;
}

export interface Agenda {
    id: number;
    name: string;
}

export type AlignmentCategory = 'all' | 'any' | 'sdg' | 'srig' | 'agenda';

export interface Research {
    id: number;
    research_title: string;
    research_abstract?: string;
    completed_month?: number;
    completed_year?: number;
    status?: string;
    program?: Program;
    adviser?: Faculty;
    researchers?: Researcher[];
    panelists?: Faculty[];
    keywords?: Array<{ id: number; keyword_name: string }>;
    sdgs?: SDG[];
    srigs?: SRIG[];
    agendas?: Agenda[];
}

export interface ReportFilters {
    search?: string;
    program?: string | number;
    year?: string | number;
    adviser?: string | number;
    status?: string;
}

/**
 * Shared props every report card needs from the page-level Inertia response.
 * Each card manages its own filter *state* internally — this is just the
 * source data + dropdown options + initial filter values.
 */
export interface ReportCardProps {
    records: Research[];
    programs: Program[];
    years: number[];
    advisers: Faculty[];
    panelists?: Faculty[];
    statuses: string[];
    filters: ReportFilters;
}
