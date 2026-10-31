import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    researchId: number;
    title: string;
};

export default function ManuscriptPreviewDialog({ open, onOpenChange, researchId, title }: Props) {
    const [pageCount, setPageCount] = useState(0);
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setPage(1);
        setZoom(100);
        setPageCount(0);

        fetch(`/research/${researchId}/preview`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => null);
                if (!response.ok) throw new Error(payload?.message || 'Preview is unavailable.');
                return payload as { page_count: number };
            })
            .then((payload) => setPageCount(payload.page_count))
            .catch((cause) => {
                if (!controller.signal.aborted) {
                    setError(cause instanceof Error ? cause.message : 'Preview is unavailable.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [open, researchId]);

    const pageUrl = `/research/${researchId}/preview/pages/${page}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92dvh] w-[96vw] max-w-6xl flex-col gap-3 p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="pr-8">{title}</DialogTitle>
                    <DialogDescription>Watermarked preview. Manuscript downloads are disabled.</DialogDescription>
                </DialogHeader>

                <div
                    className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md bg-neutral-900 p-3 sm:p-5"
                    onContextMenu={(event) => event.preventDefault()}
                    onCopy={(event) => event.preventDefault()}
                    onDragStart={(event) => event.preventDefault()}
                >
                    {loading && <p className="text-sm text-white">Preparing preview…</p>}
                    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
                    {!loading && !error && pageCount > 0 && (
                        <img
                            key={pageUrl}
                            src={pageUrl}
                            alt={`Watermarked manuscript page ${page} of ${pageCount}`}
                            draggable={false}
                            onContextMenu={(event) => event.preventDefault()}
                            onError={() => setError('This page could not be loaded. Please try again.')}
                            className="h-auto max-w-none select-none"
                            style={{ width: `${zoom}%` }}
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Zoom out"
                            title="Zoom out"
                            disabled={zoom <= 70}
                            onClick={() => setZoom((current) => Math.max(70, current - 15))}
                        >
                            <ZoomOut />
                        </Button>
                        <span className="min-w-12 text-center text-sm tabular-nums">{zoom}%</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Zoom in"
                            title="Zoom in"
                            disabled={zoom >= 160}
                            onClick={() => setZoom((current) => Math.min(160, current + 15))}
                        >
                            <ZoomIn />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Previous page"
                            title="Previous page"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            <ChevronLeft />
                        </Button>
                        <span className="min-w-24 text-center text-sm tabular-nums" aria-live="polite">
                            {pageCount ? `Page ${page} of ${pageCount}` : 'Page —'}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Next page"
                            title="Next page"
                            disabled={loading || page >= pageCount}
                            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}