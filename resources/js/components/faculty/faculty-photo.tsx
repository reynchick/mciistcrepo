import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Props {
    imageUrl?: string | null;
    size?: 'sm' | 'lg' | 'xl';
    /**
     * 'circle' (default): small round avatar, as before.
     * 'fill': the photo covers the entire rectangle it is placed in
     *         (use this on the faculty details page).
     */
    shape?: 'circle' | 'fill';
    className?: string;
}

export default function FacultyPhoto({ imageUrl, size = 'lg', shape = 'circle', className }: Props) {
    const sizeClasses = {
        sm: 'h-10 w-10',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24'
    };

    if (shape === 'fill') {
        return (
            <div
                className={cn(
                    "relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-900",
                    className
                )}
            >
                {imageUrl ? (
                    <img
                        src={`/storage/${imageUrl}`}
                        alt="Faculty Profile"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <User className="h-16 w-16" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "overflow-hidden rounded-full border border-gray-200 bg-gray-50 flex-shrink-0",
                sizeClasses[size],
                className
            )}
        >
            {imageUrl ? (
                <img
                    src={`/storage/${imageUrl}`}
                    alt="Faculty Profile"
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                    <User className={size === 'sm' ? "h-5 w-5" : "h-8 w-8"} />
                </div>
            )}
        </div>
    );
}