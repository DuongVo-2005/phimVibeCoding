import type { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Không có quyền truy cập',
};

/**
 * Trang "Không có quyền" — đích redirect của `middleware.ts` khi tài khoản ĐÃ đăng nhập nhưng
 * không phải `admin` cố truy cập `/admin/**` (trước đây redirect thẳng về `/`, không có thông
 * báo gì — người dùng không hiểu vì sao bị đá ra). Đặt trong route group `(public)` (không phải
 * `(admin)`) — người bị từ chối không có quyền admin nên không nên thấy khung admin, dùng Header/
 * Footer công khai bình thường để họ có thể điều hướng tiếp.
 */
export default function UnauthorizedPage() {
  return (
    <Container
      maxWidth="max-w-[32rem]"
      className="py-xl flex flex-col items-center text-center gap-md"
    >
      <span className="material-symbols-outlined text-primary text-[64px]" aria-hidden="true">
        lock
      </span>
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Không có quyền truy cập</h1>
      <p className="text-body-md text-on-surface-variant">
        Tài khoản của bạn không có quyền truy cập khu vực quản trị.
      </p>
      <Button href="/" variant="primary" className="mt-md">
        Về trang chủ
      </Button>
    </Container>
  );
}
