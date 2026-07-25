import { expect, test } from '@playwright/test';

// Smoke test xác nhận hạ tầng (build + server + routing) hoạt động — không phải test nghiệp vụ.
// Cập nhật Phase 10.7: route "/dien-vien/[slug]" không còn là placeholder (đã có UI thật, xem
// actor-profile.spec.ts). "/dang-nhap" không có file design nguồn trong design/ (chỉ 7 trang
// project.md §5 mới thuộc chuỗi Phase 10.x) nên vẫn còn placeholder — dùng làm route thay thế,
// giữ đúng mục đích ban đầu của test này (xác nhận pipeline route/build hoạt động, không liên
// quan nội dung trang cụ thể).
test('trang placeholder (public) tải được', async ({ page }) => {
  await page.goto('/dang-nhap');
  await expect(page.getByText(/Placeholder/i)).toBeVisible();
});
