import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => {
            const pages = import.meta.glob('./pages/**/*.tsx')
            const exact = `./pages/${name}.tsx`
            if (pages[exact]) return pages[exact]
            const lower = exact.toLowerCase()
            const match = Object.keys(pages).find((k) => k.toLowerCase() === lower)
            if (match) return pages[match]
            return resolvePageComponent(exact, pages)
        },
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);
