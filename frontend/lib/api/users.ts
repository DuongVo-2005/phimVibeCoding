import { request } from './client';
import { USERS_ENDPOINTS } from './endpoints';

/**
 * Khớp phần self-service của `users.controller.ts` (`/users/me`, `/users/me/password`) —
 * Phase 9.2 audit. CHƯA bao gồm nhóm route quản trị (`POST /users`, `GET /users`,
 * `PATCH /users/:id/role|status`, `DELETE /users/:id`, `/users/:id/roles`...) — nhóm này thuộc
 * phạm vi quản trị/RBAC rộng hơn "usersApi" tự thân, không được liệt kê module riêng ở Phase 9.2
 * (chỉ có authApi/filmsApi/actorsApi/categoriesApi/commentsApi/favoritesApi/playlistsApi/usersApi
 * — không có rolesApi/adminUsersApi) nên chưa thêm để tránh vượt phạm vi được giao. Chưa gọi thật
 * ở đâu.
 */
export const usersApi = {
  me(accessToken: string) {
    return request<unknown>(USERS_ENDPOINTS.me, { accessToken });
  },

  updateProfile(body: unknown, accessToken: string) {
    return request<unknown>(USERS_ENDPOINTS.updateProfile, {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  updatePassword(body: unknown, accessToken: string) {
    return request<{ message: string }>(USERS_ENDPOINTS.updatePassword, {
      method: 'PATCH',
      body,
      accessToken,
    });
  },
};
