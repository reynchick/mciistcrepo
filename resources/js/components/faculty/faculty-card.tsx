import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    selected?: boolean;
    onSelectChange?: (checked: boolean) => void;
}

export default function FacultyCard({ faculty, isAdmin, selected, onSelectChange }: Props) {
    const fullName = [faculty.last_name + ',', faculty.first_name, faculty.middle_name]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent shadow-xs transition-shadow hover:shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">

            {/* bulk-select checkbox */}
            {isAdmin && onSelectChange && (
                <input
                    type="checkbox"
                    className="absolute left-3.5 top-3.5 z-10 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={!!selected}
                    onChange={(e) => onSelectChange(e.target.checked)}
                />
            )}

            {/* action buttons */}
            <div className="absolute right-3.5 top-3.5 flex items-center gap-1 z-10">
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
                                <Link href={`/faculty/${faculty.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-stretch">

                {/* --- LEFT SECTION: Visual Identity & Profile Picture --- */}
                <div className={`flex w-full sm:w-44 md:w-48 shrink-0 flex-col items-center justify-center p-4 sm:p-5 sm:border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/20 ${isAdmin && onSelectChange ? 'pt-8 sm:pt-5' : ''}`}>
                    <div className="relative mb-2.5">
                        <div className="rounded-full border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-slate-800 shadow-xs">
                            <FacultyPhoto
                                imageUrl={faculty.profile_picture}
                                size="xl"
                                className="h-20 w-20 sm:h-24 sm:w-24 md:h-24 md:w-24"
                            />
                        </div>
                    </div>

                    <Badge variant="secondary" className="text-[11px] font-mono tracking-wider font-semibold px-2 py-0.5">
                        {faculty.faculty_id}
                    </Badge>
                </div>

                {/* --- RIGHT SECTION: Faculty Details --- */}
                <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 sm:pl-6 w-full text-center sm:text-left">
                    <div className="pr-0 sm:pr-20">
                        <h3 className="font-sans text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            {fullName}
                        </h3>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 mt-1.5 text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {faculty.designation || 'Faculty & Staff'}
                            </span>
                            {faculty.position && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                        {faculty.position}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Contact details grid */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs">
                            {faculty.email && (
                                <a
                                    href={`mailto:${faculty.email}`}
                                    className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{faculty.email}</span>
                                </a>
                            )}
                            {faculty.contact_number && (
                                <a
                                    href={`tel:${faculty.contact_number.replace(/\s|-/g, '')}`}
                                    className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{faculty.contact_number}</span>
                                </a>
                            )}
                            {faculty.orcid && (
                                <a
                                    href={`https://orcid.org/${faculty.orcid}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
                                >
                                    <Fingerprint className="h-3.5 w-3.5" />
                                    <span>{faculty.orcid}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}