import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

export default function InputError({ message, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
          <p {...props} className={cn('text-xs text-destructive dark:text-red-400 mt-1.5 font-medium', className)} role="alert" aria-live="polite">
            {message}
        </p>
    ) : null;
}
