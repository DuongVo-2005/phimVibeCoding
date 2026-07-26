'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * SessionErrorWatcher — Phase 17A: xử lý `session.error === 'RefreshTokenError'` (NextAuth `jwt`
 * callback, `app/api/auth/[...nextauth]/route.ts`, set khi refresh token thất bại) TOÀN CỤC —
 * trước đây field này được set nhưng KHÔNG nơi nào đọc, kể cả `middleware.ts` (chỉ check token có
 * tồn tại, không check `error`), khiến session hỏng vẫn được coi là hợp lệ.
 *
 * Đặt ở App Root (trong `Providers`, cần cả `SessionProvider` lẫn context của `next-auth/react`)
 * để bắt lỗi bất kể đang ở route nào, không chỉ `/user/**`. `signOut({redirect:false})` rồi tự
 * `router.push` (thay vì dùng `callbackUrl` của `signOut`) để gắn thêm query `?reason=` — trang
 * `/dang-nhap` đọc query này để hiện thông báo (xem `LoginForm.tsx`), tránh hiện thông báo 2 lần
 * (ở đây và ở trang đích).
 *
 * `handledRef` chặn gọi lặp nếu effect chạy lại nhiều lần trong lúc `signOut()` (async) chưa xong.
 */
export function SessionErrorWatcher() {
  const { data: session } = useSession();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (session?.error === 'RefreshTokenError' && !handledRef.current) {
      handledRef.current = true;
      void signOut({ redirect: false }).then(() => {
        router.push('/dang-nhap?reason=session-expired');
      });
    }
  }, [session?.error, router]);

  return null;
}
