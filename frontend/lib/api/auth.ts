import { request } from './client';
import { AUTH_ENDPOINTS } from './endpoints';
import type { AuthTokens } from './types';

/**
 * authApi — module hoá 2 lệnh gọi Auth đã dùng thật ở Phase 9.1 (trước đây gọi trực tiếp
 * `authPost`/`AUTH_ENDPOINTS` ngay trong route NextAuth). Chỉ 2 hàm này đã được dùng thật
 * (bởi app/api/auth/[...nextauth]/route.ts) — các endpoint Auth còn lại (register, logout,
 * forgot/reset-password) chưa có UI nào gọi tới nên chưa thêm vào đây (đúng phạm vi Phase 9.2:
 * "Không gọi API ngoài Auth để lấy dữ liệu thật" — không mở rộng Auth vượt quá những gì đã
 * triển khai thật ở Phase 9.1).
 */
export const authApi = {
  login(email: string, password: string) {
    return request<AuthTokens>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      body: { email, password },
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      body: { refreshToken },
    });
  },
};
