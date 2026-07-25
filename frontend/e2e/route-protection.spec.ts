import { expect, test } from '@playwright/test';

// Xác nhận middleware route protection nền tảng hoạt động — chưa test luồng đăng nhập thật
// (chưa có Login UI, ngoài phạm vi Phase 9.1).
test.describe('route protection', () => {
  test('truy cập /user/profile khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/user/profile');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  test('truy cập /admin/admin khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/admin');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });
});
