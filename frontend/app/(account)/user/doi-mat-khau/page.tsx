import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { Container } from '@/components/layout/Container';

/**
 * Route Đổi mật khẩu — Phase 17A. Nằm dưới `/user/**`, đã được `middleware.ts` bảo vệ sẵn
 * (matcher `/user/:path*`), không cần sửa middleware. Layout Header/Footer thừa hưởng từ
 * `app/(account)/layout.tsx` (`MainLayout`), giống `/user/profile`.
 *
 * TECH-DEBT-001: `--spacing-lg: 48px` (custom token trong `globals.css`'s `@theme`) đè lên scale
 * `max-w-lg` mặc định của Tailwind (đáng lẽ 32rem/512px) — dùng `max-w-lg` khiến khối bị bóp còn
 * `max-width: 48px` (thực tế đo được: nội dung co về 0px do padding vượt quá 48px). Dùng
 * `max-w-[32rem]` (giá trị arbitrary, giữ đúng ý định ban đầu) thay vì tên scale bị đè — cùng cách
 * `NotificationProvider` đã né token `--spacing-sm` đè `max-w-sm` trước đó.
 */
export default function ChangePasswordPage() {
  return (
    <Container className="py-lg max-w-[32rem] mx-auto">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-lg">Đổi mật khẩu</h1>
      <ChangePasswordForm />
    </Container>
  );
}
