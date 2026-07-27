import { Button } from '@/components/ui/button';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    error?: string;
}

export default function Login({ status, error }: LoginProps) {
    return (
        <>
            <Head title="Log in" />

            <BackgroundGradientAnimation interactive={false}>
                <style>{`
                    @keyframes authMarkFloat {
                        0%, 100% { transform: translateY(0px); }
                        50%      { transform: translateY(-14px); }
                    }
                    .auth-mark-float { animation: authMarkFloat 6s ease-in-out infinite; }
                    @media (prefers-reduced-motion: reduce) {
                        .auth-mark-float { animation: none; }
                    }
                `}</style>

                <div className="absolute z-50 inset-0 flex items-center justify-center p-4 sm:p-8">
                    <div className="pointer-events-auto grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] lg:grid-cols-[1.05fr_1fr] transition-colors duration-500">
                        {/* Left — form panel */}
                        <div className="relative flex flex-col justify-between bg-white/70 dark:bg-black/60 px-8 py-10 backdrop-blur-2xl sm:px-11 sm:py-12 transition-colors duration-500">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="mciislogo.jpg"
                                    alt=""
                                    className="h-7 w-7 rounded-md object-cover ring-1 ring-slate-900/10 dark:ring-white/20"
                                />
                                <span className="text-sm font-medium tracking-wide text-slate-700 dark:text-white/85">
                                    USeP MCIIS
                                </span>
                            </div>

                            <div className="mt-10 flex-1">
                                <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    Sign in
                                </h1>
                                <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/55">
                                    Use your USeP Google account to access the MCIIS Repository.
                                </p>

                                {status && (
                                    <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                                        {status}
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col gap-6">
                                    <a href="/auth/google" className="w-full">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            type="button"
                                            className="h-12 w-full border-slate-200 bg-white text-[15px] font-medium text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 dark:border-transparent"
                                        >
                                            <svg className="mr-2.5 h-[18px] w-[18px]" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            Sign in with Google
                                        </Button>
                                    </a>

                                    <div className="space-y-2 text-sm text-slate-500 dark:text-white/55">
                                        <p><strong className="font-medium text-slate-800 dark:text-white/85">Students:</strong> Use your student email</p>
                                        <p><strong className="font-medium text-slate-800 dark:text-white/85">Faculty:</strong> Your account must be registered by an administrator first</p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-900/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs leading-relaxed text-slate-500 dark:text-white/55">
                                            <strong className="font-medium text-slate-800 dark:text-white/85">Lost access to your Google account?</strong>
                                            <br />
                                            Contact{' '}
                                            <a href="mailto:sdmd@usep.edu.ph" className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-950 dark:text-white/85 dark:hover:text-white">
                                                sdmd@usep.edu.ph
                                            </a>{' '}
                                            for account recovery
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-10 text-xs text-slate-400 dark:text-white/35">
                                University of Southeastern Philippines
                            </p>
                        </div>

                        {/* Right — gradient bleeds through, brand mark floats above it */}
                        <div className="relative hidden items-center justify-center lg:flex">
                            <div className="auth-mark-float flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-900/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] backdrop-blur-md dark:border-white/25 dark:bg-white/10 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] transition-colors duration-500">
                                <img
                                    src="mciislogo.jpg"
                                    alt="MCIIS logo"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </BackgroundGradientAnimation>
        </>
    );
}