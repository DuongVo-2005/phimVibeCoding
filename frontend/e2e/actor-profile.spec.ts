import { expect, test } from '@playwright/test';

// Xác nhận UI trang hồ sơ diễn viên (Phase 10.7) render đúng — chỉ UI tĩnh, không playback/API.
test.describe('actor profile page', () => {
  test('/dien-vien/[slug] hiển thị đúng tên diễn viên', async ({ page }) => {
    await page.goto('/dien-vien/timothy-chalamet');
    await expect(page.getByRole('heading', { name: 'Timothy Chalamet' })).toBeVisible();
  });

  test('hiển thị danh sách tác phẩm nổi bật', async ({ page }) => {
    await page.goto('/dien-vien/timothy-chalamet');
    await expect(page.getByText('Dune: Part Two').first()).toBeVisible();
  });

  test('mobile: Header hiện nút "Quay lại" trên trang hồ sơ diễn viên (tái sử dụng biến thể /phim/[slug])', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/dien-vien/timothy-chalamet');
    await expect(page.getByRole('link', { name: 'Quay lại' })).toBeVisible();
  });

  test('mobile: danh sách diễn viên KHÔNG có nút "Quay lại" (chỉ trang chi tiết mới có)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/dien-vien');
    await expect(page.getByRole('link', { name: 'Quay lại' })).toHaveCount(0);
  });
});
