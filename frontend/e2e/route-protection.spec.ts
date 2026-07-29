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

  // Phase 19B.1 — /admin/phim (Admin Movie List) nằm dưới cùng matcher `/admin/:path*` của
  // middleware, khớp pattern test đã có ở trên.
  test('truy cập /admin/phim khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({ page }) => {
    await page.goto('/admin/phim');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.2 — /admin/phim/moi (Create Movie) cùng matcher, không phụ thuộc backend thật.
  test('truy cập /admin/phim/moi khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/phim/moi');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.3 — /admin/the-loai (Category Management) cùng matcher.
  test('truy cập /admin/the-loai khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/the-loai');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.4 — /admin/quoc-gia (Country Management) cùng matcher.
  test('truy cập /admin/quoc-gia khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/quoc-gia');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.5 — /admin/dien-vien (Actor Management) cùng matcher.
  test('truy cập /admin/dien-vien khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/dien-vien');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.6 — /admin/dao-dien (Director Management) cùng matcher.
  test('truy cập /admin/dao-dien khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/dao-dien');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.7 — /admin/binh-luan (Comment Moderation) cùng matcher.
  test('truy cập /admin/binh-luan khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/binh-luan');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.8 — /admin/nguoi-dung (User Management) cùng matcher.
  test('truy cập /admin/nguoi-dung khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/nguoi-dung');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.9 — /admin/vai-tro (Role/Permission Management) cùng matcher.
  test('truy cập /admin/vai-tro khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/vai-tro');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });

  // Phase 19B.10 — /admin/avatar (Avatar Management) cùng matcher.
  test('truy cập /admin/avatar khi chưa đăng nhập sẽ bị redirect về /dang-nhap', async ({
    page,
  }) => {
    await page.goto('/admin/avatar');
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=/);
  });
});
