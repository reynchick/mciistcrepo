import AppLogoIcon from '@/components/app-logo-icon';
import AnimatedBackground from '@/components/animated-background';
import AuthBackgroundWash from '@/components/auth-background-wash';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Database, FolderOpen, Search, ShieldCheck } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

// Mirrors the landing page's "Repository Features" row — trimmed to the four
// highlights that matter most in a sign-in context, styled as dark-glass
// chips instead of the light cards used on the marketing site.
const panelHighlights = [
    { icon: Database, label: 'Centralized Repository' },
    { icon: FolderOpen, label: 'Complete Metadata' },
    { icon: Search, label: 'Easy Discovery' },
    { icon: ShieldCheck, label: 'Secure Access' },
];

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { quote } = usePage<SharedData>().props;

    return (
        // min-h-dvh lets the page grow + scroll on short/mobile viewports; the
        // fixed md:h-dvh only kicks in once the split appears, so the branded
        // panel's three-zone flex has a definite height to distribute.
        <div className="relative isolate grid min-h-dvh grid-cols-1 md:h-dvh md:grid-cols-2">
            <AuthBackgroundWash />

            {/* Branded panel — shown once there's room for the split (md and up).
                All sizing is fluid (clamp) so it scales from a ~384px tablet
                half-width up to large desktops without dead bands. */}
            <div className="relative hidden h-full flex-col overflow-hidden bg-muted p-[clamp(1.75rem,3.5vw,3.25rem)] text-white md:flex dark:border-r">
                <AnimatedBackground />

                {/* Top: live badge + logo lockup, anchored to the top edge */}
                <div className="relative z-20 flex flex-col gap-3">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Research Repository</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Link href="/" className="flex items-center gap-2 text-[clamp(1rem,1.4vw,1.25rem)] font-bold tracking-tight">
                            <AppLogoIcon className="size-[clamp(1.75rem,2.2vw,2rem)] fill-current text-white" />
                            MCIIS Repository
                        </Link>
                        <span className="text-[clamp(0.625rem,0.8vw,0.75rem)] font-medium uppercase tracking-widest text-slate-400">
                            Research, Innovation, and Knowledge Management
                        </span>
                    </div>
                </div>

                {/* Middle: value statement + highlight chips, centered in the space
                    left over between the top lockup and the bottom quote. min-h-0
                    lets this flex child shrink instead of forcing overflow when the
                    panel is short. */}
                <div className="relative z-20 flex min-h-0 flex-1 flex-col justify-center py-6">
                    <div className="flex flex-col gap-[clamp(1rem,2.2vh,1.5rem)]">
                        <p className="max-w-[26rem] text-[clamp(1.375rem,2.4vw,2.125rem)] leading-snug font-semibold tracking-tight text-white">
                            A single home to <span className="text-emerald-400">discover</span>,{' '}
                            <span className="text-emerald-400">preserve</span>, and access MCIIS research.
                        </p>

                        <div className="grid max-w-[26rem] grid-cols-2 gap-[clamp(0.5rem,0.9vw,0.75rem)]">
                            {panelHighlights.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-[clamp(0.5rem,1vh,0.75rem)] backdrop-blur-sm transition-colors duration-300 hover:border-emerald-400/30 hover:bg-white/10"
                                >
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                                        <Icon className="h-3.5 w-3.5 text-emerald-400" />
                                    </div>
                                    <span className="text-[clamp(0.72rem,0.85vw,0.85rem)] font-medium text-slate-200">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: accent line + quote, anchored to the bottom edge. A fluid
                    min-height keeps this zone's footprint stable across the randomly
                    picked quote (1 vs. 3 lines) so the middle zone doesn't jump. */}
                {quote && (
                    <div className="relative z-20 min-h-[clamp(5rem,11vh,8rem)]">
                        <div className="mb-4 h-px w-12 bg-gradient-to-r from-emerald-400/80 to-transparent" />
                        <blockquote className="space-y-2">
                            <p className="text-[clamp(1rem,1.3vw,1.125rem)] leading-snug">&ldquo;{quote.message}&rdquo;</p>
                            <footer className="text-sm text-neutral-300">{quote.author}</footer>
                        </blockquote>
                    </div>
                )}
            </div>

            {/* Sign-in panel. Centers its card and grows/scrolls if a short
                viewport can't fit it. */}
            <div className="relative flex w-full items-center justify-center px-6 py-10 sm:px-8">
                <div className="mx-auto flex w-full max-w-[350px] flex-col gap-6">
                    {/* Compact branding header — replaces the branded panel below md.
                        Badge + logo + subtitle only; chips/watermark/quote are
                        desktop-only so the form stays the priority on small screens. */}
                    <div className="relative z-20 flex flex-col items-center gap-2.5 text-center md:hidden">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm shadow-slate-950/5 dark:border-neutral-800 dark:bg-black/80">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                Research Repository
                            </span>
                        </div>
                        <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            <AppLogoIcon className="size-7 fill-current" />
                            MCIIS Repository
                        </Link>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Research, Innovation, and Knowledge Management
                        </span>
                    </div>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
