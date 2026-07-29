'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';

/**
 * RoleGuard — Phase (Admin Foundation): lớp bảo vệ THỨ HAI ở client, bổ sung cho
 * `middleware.ts` (đã chặn `/admin/:path*` ở tầng request — không đăng nhập → `/dang-nhap`,
 * đăng nhập nhưng không phải admin → `/khong-co-quyen`). Middleware chạy trên MỌI request
 * (kể cả điều hướng client-side qua `<Link>`, Next.js App Router luôn gọi middleware cho RSC
 * request tương ứng) nên về lý thuyết đã đủ — `RoleGuard` này là phòng thủ theo chiều sâu cho
 * trường hợp phiên hết hạn/đổi role NGAY TRONG LÚC đang ở lại 1 trang admin đã mount sẵn (không
 * có điều hướng mới để middleware chạy lại), và làm rõ ràng hợp đồng "component gốc của khu vực
 * admin luôn tự xác minh role" thay vì chỉ dựa ngầm vào middleware.
 *
 * `status === 'loading'`: hiện skeleton (khớp khung `AdminShell` thật bên dưới, tránh CLS) thay vì
 * render nội dung admin sớm rồi giật lại nếu hoá ra không đủ quyền.
 */
export function RoleGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/dang-nhap');
      return;
    }
    if (status === 'authenticated' && session.user?.role !== 'admin') {
      router.replace('/khong-co-quyen');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-lg">
        {/* max-w-[28rem] (giá trị tường minh) thay vì `max-w-md` — TECH-DEBT-001: token
            `--spacing-md` tự định nghĩa trong globals.css đè lên scale `max-w-*` mặc định của
            Tailwind, khiến `max-w-md` chỉ ra 24px thay vì 28rem. */}
        <div className="flex w-full max-w-[28rem] flex-col gap-md" aria-hidden="true">
          <SkeletonBlock className="h-8 w-1/2 rounded" />
          <SkeletonBlock className="h-24 w-full rounded-xl" />
          <SkeletonBlock className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
