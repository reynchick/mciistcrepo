function updateMetaToken(token: string): void {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta) meta.content = token;
}

/**
 * Refresh the token from the current authenticated session before a mutating
 * request. A periodic call while a long form is open also keeps Laravel's
 * sliding session alive.
 */
export async function refreshCsrfToken(): Promise<string | null> {
    try {
        const response = await fetch('/csrf-token', {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null;

        const payload = (await response.json()) as { token?: unknown };
        if (typeof payload.token !== 'string' || payload.token === '') return null;

        updateMetaToken(payload.token);
        return payload.token;
    } catch {
        return null;
    }
}
