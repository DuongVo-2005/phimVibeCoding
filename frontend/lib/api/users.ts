import type {
  CreateUserByAdminInput,
  UpdatePasswordInput,
  UpdateProfileInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  UserProfile,
} from '@/lib/types/user';
import type { PaginatedResponse } from '@/lib/types/common';
import { request } from './client';
import { USERS_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

/** Phase 19B.8: nhóm route quản trị của `users.controller.ts` — trước đây bỏ ngoài phạm vi Phase
 * 11.2 (chỉ 7 màn hình public), nay bổ sung cho Admin User Management. */
export type UsersQueryParams = PaginationQueryParams & {
  search?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
};

export const usersApi = {
  me(accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.me, { accessToken });
  },

  updateProfile(body: UpdateProfileInput, accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.updateProfile, {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  updatePassword(body: UpdatePasswordInput, accessToken: string) {
    return request<{ message: string }>(USERS_ENDPOINTS.updatePassword, {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  list(query: UsersQueryParams | undefined, accessToken: string) {
    return request<PaginatedResponse<UserProfile>>(USERS_ENDPOINTS.list, { query, accessToken });
  },

  byId(id: string, accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.byId(id), { accessToken });
  },

  create(body: CreateUserByAdminInput, accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  updateRole(id: string, body: UpdateUserRoleInput, accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.updateRole(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  updateStatus(id: string, body: UpdateUserStatusInput, accessToken: string) {
    return request<UserProfile>(USERS_ENDPOINTS.updateStatus(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(USERS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
