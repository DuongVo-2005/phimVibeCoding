import { expect, test } from '@playwright/test';

// Xác nhận UI trang xem phim (Phase 10.5) render đúng — chỉ UI tĩnh, không playback thật.
test.describe('watch movie page', () => {
  // Phase 18 (Critical #1): trước đây `WatchMovieView` luôn hiện CỨNG tiêu đề mock
  // "Kẻ Truy Tìm Di Sản" bất kể slug nào (bug thật, xác nhận qua QA Phase 17B.2) — test này VỐN
  // dựa vào chính bug đó để pass. Đã sửa dùng `film.title` thật; môi trường Playwright không có
  // backend (xem ghi chú Phase 13A dưới) nên KHÔNG thể assert tiêu đề ĐÚNG ở đây — chỉ còn assert
  // được tiêu đề SAI (mock cũ) không còn xuất hiện, đúng phạm vi test có thể xác minh offline.
  test('/xem-phim/[slug] không còn hiện tiêu đề mock cứng', async ({ page }) => {
    await page.goto('/xem-phim/ke-truy-tim-di-san');
    await expect(page.getByText('Kẻ Truy Tìm Di Sản')).toHaveCount(0);
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
