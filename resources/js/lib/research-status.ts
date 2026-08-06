import type { PageProps } from '@inertiajs/core';

export type ResearchStatusConfig = {
  label: string;
  public?: boolean;
  badge?: string;
};

export type ResearchStatusFilterOption = {
  value: string;
  label: string;
};

export type ResearchStatusSharedProps = {
  researchStatuses?: Record<string, ResearchStatusConfig>;
  researchStatusTransitions?: Record<string, any>;
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

export function getSharedResearchStatusProps(pageProps: PageProps & ResearchStatusSharedProps): ResearchStatusSharedProps {
  return {
    researchStatuses: pageProps.researchStatuses ?? fallbackStatuses,
    researchStatusTransitions: pageProps.researchStatusTransitions ?? {},
    researchStatusFilterOptions: pageProps.researchStatusFilterOptions ?? [],
  };
}

export function getStatusLabel(status: string | null | undefined, context?: string, pageProps?: PageProps & ResearchStatusSharedProps): string {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  const config = shared?.researchStatuses?.[status ?? ''] ?? fallbackStatuses[status ?? ''] ?? undefined;

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
  return shared?.researchStatusFilterOptions ?? [];
}

export function getStatusBadgeColor(status: string | null | undefined, pageProps?: PageProps & ResearchStatusSharedProps): string {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  return shared?.researchStatuses?.[status ?? '']?.badge ?? fallbackStatuses[status ?? '']?.badge ?? 'gray';
}
