import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReportPreviewModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	previewUrl: string;
}

/**
 * Shared PDF preview modal for report generators.
 * Used by both MatrixReportCard and CompiledReportCard so each doesn't
 * need to duplicate the Dialog/iframe markup.
 */
export default function ReportPreviewModal({ open, onOpenChange, title, previewUrl }: ReportPreviewModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] max-w-6xl sm:max-w-6xl h-[85vh] flex flex-col [&>button]:hidden">
				<DialogHeader className="flex flex-row items-center justify-between space-y-0">
					<DialogTitle>{title}</DialogTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="mr-6"
					>
						<X className="h-4 w-4" />
					</Button>
				</DialogHeader>
				{previewUrl && (
					<iframe
						src={previewUrl}
						className="flex-1 w-full border rounded-md"
						title={title}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}