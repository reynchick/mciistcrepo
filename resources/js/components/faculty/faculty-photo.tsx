import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Props {
    imageUrl?: string | null;
    size?: 'sm' | 'lg' | 'xl';
    className?: string;
}

export default function FacultyPhoto({ imageUrl, size = 'lg', className }: Props) {
    const sizeClasses = {
        sm: 'h-10 w-10',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24'
    };

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