import { expect, test } from '@playwright/test';

// Xác nhận UI trang chi tiết phim (Phase 10.4) render đúng, và Header biến thể "backHref" (D1)
// chỉ áp dụng cho route này — không ảnh hưởng route khác. Không phải test nghiệp vụ.
test.describe('film detail page', () => {
  test('/phim/[slug] hiển thị đúng tiêu đề phim', async ({ page }) => {
    await page.goto('/phim/bong-dem-do-thi');
    await expect(page.getByRole('heading', { name: 'Bóng Đêm Đô Thị' })).toBeVisible();
  });

  test('mobile: Header hiện nút "Quay lại" trên trang chi tiết phim', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/phim/bong-dem-do-thi');
    await expect(page.getByRole('link', { name: 'Quay lại' })).toBeVisible();
  });

  test('mobile: trang chủ KHÔNG có nút "Quay lại" (Header mặc định không đổi)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Quay lại' })).toHaveCount(0);
  });
});
