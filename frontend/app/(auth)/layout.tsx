import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Layout cho route group (auth) — quyết định A (Phase 11.1): tối giản, KHÔNG dùng `MainLayout`
 * (không Header/Navigation/Footer đầy đủ của site) — chỉ logo RoPhim + link về trang chủ + form
 * (`children`). Không có `design/*.html` tham chiếu cho 2 trang này (ngoài phạm vi 7 trang đã xác
 * nhận từ `project.md` §5) nên bố cục ở đây là tối giản có chủ đích, không suy đoán thêm.
 *
 * Server Component thuần (không `async`, không gọi `getServerSession`) — quyết định E (chặn user
 * đã đăng nhập truy cập lại `/dang-nhap`/`/dang-ky`) được xử lý phía client trong `LoginForm`/
 * `RegisterForm` bằng `useSession()` (xem 2 file đó) thay vì ở đây, để layout không phải
 * Server Component `async` đầu tiên của dự án — tránh rủi ro không đáng có với luồng render/
 * hydration hiện có (mọi layout khác trong dự án đều đồng bộ).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background px-gutter py-xl">
      {/* max-w-[28rem] (giá trị tường minh) thay vì `max-w-md` — phát hiện Phase 11.1: token
          `--spacing-md: 24px` tự định nghĩa trong globals.css (Phase 10.1) đang đè lên scale
          `max-width` mặc định của Tailwind, khiến `max-w-md` chỉ còn 24px thay vì 28rem. Bug này
          có sẵn từ trước (ảnh hưởng cả `max-w-sm/md/lg/xl` ở `ActorHero.tsx`/`HeroBanner.tsx`),
          không thuộc phạm vi Phase 11.1 nên không tự sửa ở đó — chỉ né trong file mới này. */}
      <div className="mx-auto flex w-full max-w-[28rem] flex-col items-center gap-xl">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-headline-lg"
            aria-hidden="true"
          >
            movie
          </span>
          <span className="text-headline-lg font-headline-xl font-bold tracking-tighter text-primary">
            RoPhim
          </span>
        </Link>

        <div className="w-full">{children}</div>

        <Link
          href="/"
          className="text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
