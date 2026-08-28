import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Pencil, Mail, Phone, Fingerprint, Eye
} from 'lucide-react';
import FacultyPhoto from './faculty-photo';
import FacultyTabs from './faculty-tabs';
import FacultyDetails from './faculty-details';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

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
    // default education
    const [activeTab, setActiveTab] = useState('education');

    const fullName = [faculty.last_name + ',', faculty.first_name, faculty.middle_name]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-300 bg-white dark:bg-transparent animate-in fade-in slide-in-from-left-2 duration-300">

            {/* bulk-select checkbox */}
            {isAdmin && onSelectChange && (
                <input
                    type="checkbox"
                    className="absolute left-3 top-3 z-10 h-4 w-4"
                    checked={!!selected}
                    onChange={(e) => onSelectChange(e.target.checked)}
                />
            )}

            {/* action buttons */}
            <div className="absolute right-3 top-3 flex gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-6 text-green-600 hover:bg-green-50 hover:text-green-600">
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
                            <Button asChild variant="ghost" size="icon" className="h-8 w-6 text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                <Link href={`/faculty/${faculty.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                )}
            </div>

            <div className="flex flex-col md:flex-row">

                {/* --- LEFT SECTION: Visual Identity --- */}
                <div className="flex w-full flex-col items-center justify-center p-6 md:w-72 md:border-r border-gray-100 bg-white dark:bg-transparent">

                    {/* Profile Photo */}
                    <div className="relative mb-4">
                        <div className="rounded-full border-[1px] border-gray-200 p-1">
                            <FacultyPhoto
                                imageUrl={faculty.profile_picture}
                                size="xl"
                                className="h-32 w-32"
                            />
                        </div>
                    </div>

                    {/* faculty id */}
                    <Badge variant="secondary" className="text-[10px]">
                        {faculty.faculty_id}
                    </Badge>
                </div>

                {/* RIGHT SECTION: header details and contexts--- */}
                <div className="flex flex-1 flex-col p-6 md:pl-8">

                    {/* header informations*/}
                    <div className="mb-8">
                        <div className="flex flex-col">
                            <h3 className="font-sans text-xl font-bold text-gray-900 dark:text-gray-200 tracking-tight">
                                {fullName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm">
                                <span className="font-medium text-gray-900 dark:text-gray-500">
                                    {faculty.designation || 'Faculty & Staff'}
                                </span>
                                {faculty.position && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-gray-500 font-medium">
                                            {faculty.position}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* contact details grid*/}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                {faculty.email && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900">
                                        <Mail className="h-4 w-4" />
                                        <span>{faculty.email}</span>
                                    </div>
                                )}
                                {faculty.contact_number && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Phone className="h-4 w-4" />
                                        <span>{faculty.contact_number}</span>
                                    </div>
                                )}
                                {faculty.orcid && (
                                    <div className="flex items-center gap-2 text-xs text-green-600 transition-colors">
                                        <Fingerprint className="h-4 w-4" />
                                        <span className="font-mono">{faculty.orcid}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* tabbed content area*/}
                    <div className="mt-auto">
                        <FacultyTabs activeTab={activeTab} onTabChange={setActiveTab} />
                        <div className="pt-4 min-h-[110px]">
                            <FacultyDetails faculty={faculty} activeTab={activeTab} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}