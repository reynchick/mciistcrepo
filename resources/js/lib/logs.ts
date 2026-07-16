type PersonLike = {
  id?: number | null;
  full_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
};

type KeywordLike = {
  id?: number | null;
  keyword_name?: string | null;
};

export function getPersonDisplayName(person?: PersonLike | null): string {
  const directName = person?.full_name?.trim() || person?.name?.trim();
  if (directName) {
    return directName;
  }

  const parts = [person?.first_name, person?.middle_name, person?.last_name]
    .filter((part): part is string => Boolean(part && String(part).trim()))
    .map((part) => String(part).trim());

  return parts.join(' ');
}

export function formatIdentityLabel(person?: PersonLike | null, fallback = 'Unknown'): string {
  const displayName = getPersonDisplayName(person);
  const id = person?.id;

  if (!displayName && (id === undefined || id === null)) {
    return fallback;
  }

  if (!displayName) {
    return `Unknown (ID: ${id})`;
  }

  if (id === undefined || id === null) {
    return displayName;
  }

  return `${displayName} (ID: ${id})`;
}

export function formatKeywordLabel(keyword?: KeywordLike | null, fallback = 'N/A'): string {
  const displayName = keyword?.keyword_name?.trim();
  const id = keyword?.id;

  if (!displayName && (id === undefined || id === null)) {
    return fallback;
  }

  if (!displayName) {
    return `Unknown (ID: ${id})`;
  }

  if (id === undefined || id === null) {
    return displayName;
  }

  return `${displayName} (ID: ${id})`;
}

export function formatResearcherNames(researchers?: Array<PersonLike> | null): string {
  if (!researchers || researchers.length === 0) {
    return 'No researchers listed';
  }

  const names = researchers.map(getPersonDisplayName).filter(Boolean);

  if (names.length === 0) {
    return 'No researchers listed';
  }

  return names.join(', ');
}
