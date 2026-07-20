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
  researchEntryModes?: Record<string, { label: string; who_can_set?: string[] }>;
};

export function getSharedResearchStatusProps(pageProps: PageProps & ResearchStatusSharedProps): ResearchStatusSharedProps {
  return {
    researchStatuses: pageProps.researchStatuses ?? {},
    researchStatusTransitions: pageProps.researchStatusTransitions ?? {},
    researchStatusFilterOptions: pageProps.researchStatusFilterOptions ?? [],
    researchEntryModes: pageProps.researchEntryModes ?? {},
  };
}

export function getStatusLabel(status: string | null | undefined, context?: string, pageProps?: PageProps & ResearchStatusSharedProps): string {
  const shared = pageProps ? getSharedResearchStatusProps(pageProps) : undefined;
  const config = shared?.researchStatuses?.[status ?? ''] ?? undefined;

  if (context === 'staff_metadata_request' && status === 'published') {
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
  return shared?.researchStatuses?.[status ?? '']?.badge ?? 'gray';
}
