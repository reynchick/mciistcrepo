import type { PageProps } from '@inertiajs/core';
import type { ResearchStatus } from '@/types/models';

export type ResearchStatusConfig = {
  label: string;
  public?: boolean;
  badge?: string;
};

export type ResearchStatusFilterOption = {
  value: ResearchStatus | 'all';
  label: string;
};

export type ResearchStatusSharedProps = {
  researchStatuses?: Record<string, ResearchStatusConfig>;
  researchStatusTransitions?: Record<string, unknown>;
  researchStatusFilterOptions?: ResearchStatusFilterOption[];
};

const fallbackStatuses: Record<string, ResearchStatusConfig> = {
  draft: { label: 'Draft', badge: 'slate' },
  draft_invited: { label: 'Draft (Invited)', badge: 'blue' },
  submitted: { label: 'Submitted for Review', badge: 'amber' },
  returned: { label: 'Returned for Revision', badge: 'rose' },
  posted: { label: 'Posted', badge: 'green' },
  archived: { label: 'Archived', badge: 'slate' },
};

const fallbackFilterOptions: ResearchStatusFilterOption[] = Object.entries(fallbackStatuses).map(([value, config]) => ({
  value: value as ResearchStatus,
  label: config.label,
}));

function resolveStatusConfig(status: string | null | undefined, pageProps?: PageProps & ResearchStatusSharedProps): ResearchStatusConfig | undefined {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  return shared?.researchStatuses?.[status ?? ''] ?? fallbackStatuses[status ?? ''] ?? undefined;
}

export function getSharedResearchStatusProps(pageProps: PageProps & ResearchStatusSharedProps): ResearchStatusSharedProps {
  return {
    researchStatuses: pageProps.researchStatuses ?? fallbackStatuses,
    researchStatusTransitions: pageProps.researchStatusTransitions ?? {},
    researchStatusFilterOptions: pageProps.researchStatusFilterOptions ?? fallbackFilterOptions,
  };
}

export function getStatusLabel(status: string | null | undefined, context?: string, pageProps?: PageProps & ResearchStatusSharedProps): string {
  const config = resolveStatusConfig(status, pageProps);

  if (context === 'staff_metadata_request' && status === 'posted') {
    return 'Staff metadata request';
  }

  if (config?.label) {
    return config.label;
  }

  return status ? status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Unknown';
}

export function getStatusFilterOptions(pageProps?: PageProps & ResearchStatusSharedProps): ResearchStatusFilterOption[] {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  const sharedOptions = shared?.researchStatusFilterOptions;

  return sharedOptions && sharedOptions.length > 0 ? sharedOptions : fallbackFilterOptions;
}

export function getStatusBadgeColor(status: string | null | undefined, pageProps?: PageProps & ResearchStatusSharedProps): string {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  return shared?.researchStatuses?.[status ?? '']?.badge ?? fallbackStatuses[status ?? '']?.badge ?? 'gray';
}
