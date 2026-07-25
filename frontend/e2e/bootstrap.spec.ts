import { expect, test } from '@playwright/test';

// Smoke test xác nhận hạ tầng (build + server + routing) hoạt động — không phải test nghiệp vụ.
// Cập nhật Phase 11.1: route "/dang-nhap" không còn là placeholder (đã có UI thật, xem
// auth.spec.ts). Toàn bộ route public còn lại đều đã có UI thật — route placeholder duy nhất còn
// lại ("/admin") có middleware auth guard nên không dùng được cho test này (redirect trước khi
// tới nội dung). Đổi sang kiểm tra route public còn lại đơn giản nhất ("/dang-ky") tải được, giữ
// đúng mục đích ban đầu (xác nhận pipeline route/build hoạt động).
test('trang public tải được', async ({ page }) => {
  await page.goto('/dang-ky');
  await expect(page.getByRole('heading', { name: 'Đăng ký' })).toBeVisible();
});
