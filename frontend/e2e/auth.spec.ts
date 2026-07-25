import { expect, test } from '@playwright/test';

// Quyết định F (Phase 11.1): CHỈ test UI (render + validate client-side qua zod) — KHÔNG phụ
// thuộc backend thật, KHÔNG dùng tài khoản thật. Không có test "đăng nhập thành công" ở đây vì
// việc đó đòi hỏi tài khoản thật kết nối backend thật, ngoài phạm vi đã xác nhận.
test.describe('auth pages', () => {
  test('/dang-nhap hiển thị đúng form đăng nhập', async ({ page }) => {
    await page.goto('/dang-nhap');
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đăng ký' })).toBeVisible();
  });

  test('/dang-nhap báo lỗi validate khi submit form trống', async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Vui lòng nhập email')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('/dang-ky hiển thị đúng form đăng ký', async ({ page }) => {
    await page.goto('/dang-ky');
    await expect(page.getByRole('heading', { name: 'Đăng ký' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Xác nhận mật khẩu')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('/dang-ky báo lỗi khi mật khẩu xác nhận không khớp', async ({ page }) => {
    await page.goto('/dang-ky');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('password123');
    await page.getByLabel('Xác nhận mật khẩu').fill('password456');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Mật khẩu xác nhận không khớp')).toBeVisible();
  });

  test('/dang-ky báo lỗi khi mật khẩu ngắn hơn 8 ký tự', async ({ page }) => {
    await page.goto('/dang-ky');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('short');
    await page.getByLabel('Xác nhận mật khẩu').fill('short');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeVisible();
  });
});
