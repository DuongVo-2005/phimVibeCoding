import type { UpdatePasswordInput, UpdateProfileInput, UserProfile } from '@/lib/types/user';
import { request } from './client';
import { USERS_ENDPOINTS } from './endpoints';

/**
 * Khớp phần self-service của `users.controller.ts` (`/users/me`, `/users/me/password`) — Phase
 * 11.0/11.2 audit. CHƯA bao gồm nhóm route quản trị (`POST /users`, `GET /users`,
 * `PATCH /users/:id/role|status`, `DELETE /users/:id`, `/users/:id/roles`...) — ngoài phạm vi 7
 * màn hình public, không thêm để tránh vượt phạm vi Phase 11.2.
 */
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
};
