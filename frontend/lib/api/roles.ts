import type { Permission } from '@/lib/types/permission';
import type { CreateRoleInput, Role, RoleDetail, UpdateRoleInput } from '@/lib/types/role';
import type { PaginatedResponse } from '@/lib/types/common';
import type { UserProfile } from '@/lib/types/user';
import { request } from './client';
import { ROLES_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

export const rolesApi = {
  list(accessToken: string) {
    return request<Role[]>(ROLES_ENDPOINTS.list, { accessToken });
  },

  byId(id: string, accessToken: string) {
    return request<RoleDetail>(ROLES_ENDPOINTS.byId(id), { accessToken });
  },

  create(body: CreateRoleInput, accessToken: string) {
    return request<Role>(ROLES_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateRoleInput, accessToken: string) {
    return request<Role>(ROLES_ENDPOINTS.byId(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(ROLES_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },

  setPermissions(id: string, permissionIds: string[], accessToken: string) {
    return request<Permission[]>(ROLES_ENDPOINTS.permissions(id), {
      method: 'PUT',
      body: { permissionIds },
      accessToken,
    });
  },

  users(id: string, query: PaginationQueryParams | undefined, accessToken: string) {
    return request<PaginatedResponse<UserProfile>>(ROLES_ENDPOINTS.users(id), {
      query,
      accessToken,
    });
  },
};
