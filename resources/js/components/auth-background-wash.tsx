import { JSX } from 'react';

// Full-page ambient wash for auth pages: the same soft blue/violet/emerald
// blur-orb recipe as the landing page's hero, on a slate-50/black canvas.
// Sits behind the whole layout, so it's what mobile visitors see (the
// branded dark panel is desktop-only) and it bleeds gently behind the form
// on desktop. Purely decorative and non-interactive.
export default function AuthBackgroundWash(): JSX.Element {
    return <div className="auth-bg-wash" aria-hidden="true" />;
}
