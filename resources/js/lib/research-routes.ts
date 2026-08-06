type NamedRouteParams = Record<string, unknown> | Array<unknown>;

function resolveResearchRoute(routeName: string, params: NamedRouteParams | undefined, fallbackPath: string): string {
  if (typeof route === 'function') {
    try {
      return route(routeName, params)
    } catch {
      return fallbackPath
    }
  }

  return fallbackPath
}

export const researchRoutes = {
  show: (id: number) => resolveResearchRoute('research.show', { research: id }, `/research/${id}`),
  edit: (id: number) => resolveResearchRoute('research.edit', { research: id }, `/research/${id}/edit`),
  update: (id: number) => resolveResearchRoute('research.update', { research: id }, `/research/${id}`),
  initialInvite: (id: number) => resolveResearchRoute('research.invitations.initial', { research: id }, `/research/${id}/invitations/initial`),
  submit: (id: number) => resolveResearchRoute('research.submit', { research: id }, `/research/${id}/submit`),
  return: (id: number) => resolveResearchRoute('research.return', { research: id }, `/research/${id}/return`),
  post: (id: number) => resolveResearchRoute('research.publish', { research: id }, `/research/${id}/publish`),
  archive: (id: number) => resolveResearchRoute('research.archive', { research: id }, `/research/${id}/archive`),
  restore: (id: number) => resolveResearchRoute('research.restore', { research: id }, `/research/${id}/restore`),
  hardDelete: (id: number) => resolveResearchRoute('research.force-delete', { research: id }, `/research/${id}/force`),
}
