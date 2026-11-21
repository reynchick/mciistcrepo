import { Link, router } from '@inertiajs/react';
import { Mail, Phone, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState, type AriaRole, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

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
    layout?: 'list' | 'grid';
}

function DragScrollableText({
    children,
    title,
    className,
    role,
    ariaLevel,
    onClick,
}: {
    children: ReactNode;
    title?: string;
    className?: string;
    role?: AriaRole;
    ariaLevel?: number;
    onClick?: () => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
    const suppressClickRef = useRef(false);

    const finishDrag = () => {
        const moved = dragRef.current?.moved ?? false;
        dragRef.current = null;
        if (moved) {
            suppressClickRef.current = true;
            window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 0);
        }
    };

    return (
        <div
            ref={scrollRef}
            role={role}
            aria-level={ariaLevel}
            title={title}
            className={cn(
                'scrollbar-hidden relative z-10 block w-full select-none overflow-x-auto whitespace-nowrap',
                'cursor-grab active:cursor-grabbing',
                className
            )}
            onMouseDown={(event) => {
                if (event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
                dragRef.current = {
                    startX: event.clientX,
                    startScrollLeft: event.currentTarget.scrollLeft,
                    moved: false,
                };
            }}
            onMouseMove={(event) => {
                const drag = dragRef.current;
                if (!drag) return;

                const delta = event.clientX - drag.startX;
                if (Math.abs(delta) > 3) drag.moved = true;
                if (drag.moved) {
                    event.preventDefault();
                    event.currentTarget.scrollLeft = drag.startScrollLeft - delta;
                }
            }}
            onMouseUp={finishDrag}
            onMouseLeave={finishDrag}
            onClickCapture={(event) => {
                if (!suppressClickRef.current) return;
                event.preventDefault();
                event.stopPropagation();
                suppressClickRef.current = false;
            }}
            onClick={onClick}
        >
            <span className="inline-flex w-max min-w-full items-center">{children}</span>
        </div>
    );
}

function FacultyInfoLine({
    icon: Icon,
    value,
    href,
    onClick,
}: {
    icon: LucideIcon;
    value?: string;
    href?: string;
    onClick?: () => void;
}) {
    return (
        <DragScrollableText
            className="h-5 text-xs text-slate-600 dark:text-slate-400"
            title={value || 'Not provided'}
            onClick={onClick}
        >
            {value && href ? (
                <a href={href} className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{value}</span>
                </a>
            ) : (
                <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className={!value ? 'text-slate-400' : ''}>{value || '—'}</span>
                </span>
            )}
        </DragScrollableText>
    );
}

/**
 * Turns a stored path (e.g. "faculty/abc.jpg") into a usable URL.
 * Absolute URLs, root-relative paths, data and blob URIs are used as-is.
 */
function resolvePhotoUrl(value?: string | null): string | null {
    if (!value) return null;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('/') || /^(data|blob):/i.test(value)) {
        return value;
    }
    return `/storage/${value.replace(/^storage\//, '')}`;
}

export default function FacultyCard({ faculty, layout = 'list' }: Props) {
    const isGrid = layout === 'grid';
    const fullName = [faculty.last_name + ',', faculty.first_name, faculty.middle_name]
        .filter(Boolean)
        .join(' ');
    const designation = faculty.designation || 'Faculty & Staff';
    const initials =
        `${faculty.first_name?.[0] ?? ''}${faculty.last_name?.[0] ?? ''}`.toUpperCase() || 'F';

    const [imageFailed, setImageFailed] = useState(false);
    const photoSrc = resolvePhotoUrl(faculty.profile_picture);

    const profileHref = `/faculty/${faculty.id}`;
    const openProfile = () => router.visit(profileHref);

    return (
        <div
            className={cn(
                'group relative flex flex-col rounded-[28px] bg-white p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-shadow duration-200 hover:shadow-[0_12px_36px_rgba(15,23,42,0.12)]',
                'focus-within:ring-2 focus-within:ring-blue-500',
                'dark:bg-slate-950 dark:ring-slate-800',
                isGrid && 'h-full'
            )}
        >
            {/* Large photo */}
            <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-3xl bg-[#edf1f4] dark:bg-slate-900">
                {photoSrc && !imageFailed ? (
                    <img
                        src={photoSrc}
                        alt={fullName}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div
                            aria-label={`${fullName} initials`}
                            className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-3xl font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            {initials}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col px-3 pb-1 pt-4">
                {/* Invisible link covering the whole card (keyboard / right-click support) */}
                <Link
                    href={profileHref}
                    aria-label={`View faculty ${fullName}`}
                    className="absolute inset-0 rounded-[28px] focus-visible:outline-none"
                />

                {/* Name: one line; long names scroll sideways by dragging (no scrollbar) */}
                <DragScrollableText
                    role="heading"
                    ariaLevel={3}
                    title={fullName}
                    onClick={openProfile}
                    className="h-7 text-left text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
                >
                    {fullName}
                </DragScrollableText>

                {/* Designation • position: one line, drag to scroll */}
                <DragScrollableText
                    title={`${designation}${faculty.position ? ` • ${faculty.position}` : ''}`}
                    onClick={openProfile}
                    className="mt-1.5 h-5 text-left text-sm"
                >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{designation}</span>
                    {faculty.position && (
                        <span className="ml-2.5 font-medium text-slate-500 dark:text-slate-400">
                            • {faculty.position}
                        </span>
                    )}
                </DragScrollableText>

                {/* User info: each line is one row, drag to scroll */}
                <div className="mt-3.5 grid gap-y-2">
                    <FacultyInfoLine icon={Mail} value={faculty.email} onClick={openProfile} />
                    <FacultyInfoLine icon={Phone} value={faculty.contact_number} onClick={openProfile} />
                    <FacultyInfoLine icon={Fingerprint} value={faculty.orcid} onClick={openProfile} />
                </div>

            </div>
        </div>
    );
}