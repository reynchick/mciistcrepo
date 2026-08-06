export const researchRoutes = {
  show: (id: number) => `/research/${id}`,
  edit: (id: number) => `/research/${id}/edit`,
  update: (id: number) => `/research/${id}`,
  initialInvite: (id: number) => `/research/${id}/invitations/initial`,
  submit: (id: number) => `/research/${id}/submit`,
  return: (id: number) => `/research/${id}/return`,
  post: (id: number) => `/research/${id}/post`,
  archive: (id: number) => `/research/${id}/archive`,
  restore: (id: number) => `/research/${id}/restore`,
  hardDelete: (id: number) => `/research/${id}/hard-delete`,
}
