import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Pencil, Mail, Phone, Fingerprint, Eye
} from 'lucide-react';
import FacultyPhoto from './faculty-photo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Faculty {
    id: number;
    faculty_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    position?: string;
    designation?: string;
    email?: string;
    orcid?: string;
    contact_number?: string;
    educational_attainment?: string;
    field_of_specialization?: string;
    research_interest?: string;
    profile_picture?: string | null;
}

interface Props {
    faculty: Faculty;
    isAdmin?: boolean;
    onEdit?: (faculty: Faculty) => void;
}

export default function FacultyCard({ faculty, isAdmin, onEdit }: Props) {
    const fullName = [faculty.last_name + ',', faculty.first_name, faculty.middle_name]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-colors duration-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900">
            <div className="absolute left-4 top-4 z-10 text-[11px] font-semibold tracking-[0.12em] text-slate-700" style={{ fontFamily: 'Arial, sans-serif' }}>
                {faculty.faculty_id}
            </div>

            <div className="absolute right-3.5 top-3.5 z-10 flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30">
                            <Link href={`/faculty/${faculty.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                </Tooltip>

                {isAdmin && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                                <button type="button" onClick={() => onEdit?.(faculty)} aria-label={`Edit ${fullName}`}>
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-stretch">
                <div className="flex w-full shrink-0 items-center justify-center bg-[#edf1f4] p-4 sm:w-44 md:w-48">
                    <FacultyPhoto
                        imageUrl={faculty.profile_picture}
                        size="xl"
                        className="h-20 w-20 sm:h-24 sm:w-24 md:h-24 md:w-24"
                    />
                </div>

                <div className="flex flex-1 flex-col justify-center p-4 text-center sm:pl-6 sm:text-left">
                    <div className="pr-0 sm:pr-20">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
                            {fullName}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm sm:justify-start">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {faculty.designation || 'Faculty & Staff'}
                            </span>
                            {faculty.position && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">
                                        {faculty.position}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:justify-start">
                            {faculty.email && (
                                <a
                                    href={`mailto:${faculty.email}`}
                                    className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{faculty.email}</span>
                                </a>
                            )}
                            {faculty.contact_number && (
                                <a
                                    href={`tel:${faculty.contact_number.replace(/\s|-/g, '')}`}
                                    className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{faculty.contact_number}</span>
                                </a>
                            )}
                            {faculty.orcid && (
                                <span className="inline-flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                                    <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{faculty.orcid}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}