import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Eye } from 'lucide-react';

export type ReportExportFormat = 'pdf' | 'docx' | 'excel';

interface Props<T extends ReportExportFormat = ReportExportFormat> {
    title: string;
    description: string;
    disabled?: boolean;
    isExporting?: boolean;
    formats?: readonly T[];
    onPreview: () => void;
    onExport: (format: T) => void;
}

export default function ReportResultsActions<T extends ReportExportFormat = ReportExportFormat>({ title, description, disabled = false, isExporting = false, formats = ['pdf', 'docx', 'excel'] as T[], onPreview, onExport }: Props<T>) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onPreview} disabled={disabled}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview PDF
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={disabled || isExporting}>
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? 'Generating...' : 'Export'}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {formats.map((format) => (
                            <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                                {format.toUpperCase()}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
