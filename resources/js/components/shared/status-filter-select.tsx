import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusFilterOptions } from '@/lib/research-status';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';

interface StatusFilterSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function StatusFilterSelect({ value, onValueChange, placeholder = 'Filter by status', className }: StatusFilterSelectProps) {
  const pageProps = usePage<PageProps>().props as PageProps & Record<string, unknown>;
  const options = getStatusFilterOptions(pageProps as any);

  return (
    <Select value={value ?? 'all'} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
