import { expect, test } from '@playwright/test';

// Xác nhận UI trang danh sách phim (Phase 10.3) render đúng trên cả 3 route dùng chung
// MovieListing — không phải test nghiệp vụ (không kiểm tra filter/search hoạt động, vì đây chỉ
// là UI tĩnh theo đúng phạm vi đã xác nhận).
test.describe('movie listing pages', () => {
  test('/phim-le hiển thị đúng tiêu đề', async ({ page }) => {
    await page.goto('/phim-le');
    await expect(page.getByRole('heading', { name: 'Phim Lẻ' })).toBeVisible();
  });

  test('/phim-bo hiển thị đúng tiêu đề', async ({ page }) => {
    await page.goto('/phim-bo');
    await expect(page.getByRole('heading', { name: 'Phim Bộ' })).toBeVisible();
  });

  test('/the-loai/[slug] hiển thị tiêu đề theo slug', async ({ page }) => {
    await page.goto('/the-loai/hanh-dong');
    await expect(page.getByRole('heading', { name: 'Thể Loại: Hanh Dong' })).toBeVisible();
  });
});
