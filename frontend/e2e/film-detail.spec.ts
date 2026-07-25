import { expect, test } from '@playwright/test';

// Xác nhận UI trang chi tiết phim (Phase 10.4) render đúng, và Header biến thể "backHref" (D1)
// chỉ áp dụng cho route này — không ảnh hưởng route khác. Không phải test nghiệp vụ.
//
// Phase 11.6A: FilmDetailView đã nối API thật (filmsQueryOptions.detail/related,
// ratingsQueryOptions.summary), ẩn toàn bộ nội dung cho tới khi có dữ liệu (đúng pattern Homepage
// Phase 11.4). Môi trường Playwright không có backend thật nên không còn assert được tiêu đề mock
// cứng "Bóng Đêm Đô Thị" — đổi sang xác nhận route tải được (200) và Header (layout, không phụ
// thuộc dữ liệu phim) vẫn render đúng.
test.describe('film detail page', () => {
  test('/phim/[slug] tải được, Header vẫn render đúng', async ({ page }) => {
    const response = await page.goto('/phim/bong-dem-do-thi');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('link', { name: 'RoPhim' })).toBeVisible();
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
