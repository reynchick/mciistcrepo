type NamedRouteParams = Record<string, unknown> | Array<unknown>;

function resolveResearchRoute(routeName: string, params: NamedRouteParams | undefined, fallbackPath: string): string {
    if (typeof route === 'function') {
        try {
            return route(routeName, params);
        } catch {
            return fallbackPath;
        }
    }

    return fallbackPath;
}

export const researchRoutes = {
    show: (id: number) => resolveResearchRoute('research.show', { research: id }, `/research/${id}`),
    edit: (id: number) => resolveResearchRoute('research.edit', { research: id }, `/research/${id}/edit`),
    update: (id: number) => resolveResearchRoute('research.update', { research: id }, `/research/${id}`),
    post: (id: number) => resolveResearchRoute('research.post', { research: id }, `/research/${id}/post`),
    requestAdviserMetadata: (id: number) =>
        resolveResearchRoute('research.request-adviser-metadata', { research: id }, `/research/${id}/request-adviser-metadata`),
    archive: (id: number) => resolveResearchRoute('research.archive', { research: id }, `/research/${id}/archive`),
    restore: (id: number) => resolveResearchRoute('research.restore', { research: id }, `/research/${id}/restore`),
    hardDelete: (id: number) => resolveResearchRoute('research.force-delete', { research: id }, `/research/${id}/force`),
};
