import { expect, test } from '@playwright/test';

// Xác nhận UI trang xem phim (Phase 10.5) render đúng — chỉ UI tĩnh, không playback thật.
test.describe('watch movie page', () => {
  test('/xem-phim/[slug] hiển thị đúng tiêu đề phim', async ({ page }) => {
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByRole('heading', { name: 'Kẻ Truy Tìm Di Sản' })).toBeVisible();
  });

  test('hiển thị danh sách tập với tập đang xem', async ({ page }) => {
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByText('Tập 1: Bản đồ bí ẩn').first()).toBeVisible();
  });

  test('mobile: hiển thị danh sách phim liên quan', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByRole('heading', { name: 'Phim liên quan' })).toBeVisible();
  });
});
