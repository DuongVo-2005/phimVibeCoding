import { expect, test } from '@playwright/test';

// Xác nhận UI trang xem phim (Phase 10.5) render đúng — chỉ UI tĩnh, không playback thật.
test.describe('watch movie page', () => {
  test('/xem-phim/[slug] hiển thị đúng tiêu đề phim', async ({ page }) => {
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByRole('heading', { name: 'Kẻ Truy Tìm Di Sản' })).toBeVisible();
  });

  // Phase 13A: EpisodeList(layout="list") đã bỏ hẳn mock, dùng film.episodes thật. Môi trường
  // Playwright không có backend nên danh sách tập luôn rỗng ("Chưa có tập nào cho server này.") —
  // không còn assert được tiêu đề tập mock cứng. Đổi sang xác nhận heading "Danh sách tập" (luôn
  // render, kể cả khi rỗng — đúng yêu cầu "không throw, không crash" của Phase 13A).
  test('hiển thị section "Danh sách tập"', async ({ page }) => {
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByRole('heading', { name: 'Danh sách tập' }).first()).toBeVisible();
  });

  test('mobile: hiển thị danh sách phim liên quan', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByRole('heading', { name: 'Phim liên quan' })).toBeVisible();
  });
});
