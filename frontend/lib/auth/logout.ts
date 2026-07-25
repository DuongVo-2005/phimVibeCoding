'use client';

import { signOut } from 'next-auth/react';
import { authApi } from '@/lib/api/auth';

/**
 * Logout đầy đủ (quyết định C, Phase 11.1): gọi `POST /auth/logout` backend TRƯỚC để thu hồi
 * `refreshTokenHash` phía server, sau đó LUÔN `signOut()` phía NextAuth — kể cả khi lệnh gọi
 * backend thất bại (mất mạng, token đã hết hạn...), không được để lỗi backend chặn việc đăng
 * xuất ở client.
 *
 * Chưa gắn vào UI nào trong phase này — nút "Thoát"/"Đăng xuất" ở `AccountSidebar`/
 * `UserDashboardView` vẫn giữ nguyên trạng thái trang trí theo đúng quyết định E, Phase 10.8
 * (nằm ngoài phạm vi "Login UI/Register UI/authApi/NextAuth integration" của Phase 11.1 — không
 * đụng tới Dashboard).
 */
export async function logoutUser(accessToken: string | undefined): Promise<void> {
  if (accessToken) {
    try {
      await authApi.logout(accessToken);
    } catch {
      // Cố ý bỏ qua — vẫn phải signOut() phía client dù backend lỗi (quyết định C).
    }
  }

  await signOut({ callbackUrl: '/' });
}
