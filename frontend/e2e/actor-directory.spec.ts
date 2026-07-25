import { expect, test } from '@playwright/test';

// Xác nhận UI trang danh sách diễn viên (Phase 10.6) render đúng — chỉ UI tĩnh, không filter thật.
test.describe('actor directory page', () => {
  test('/dien-vien hiển thị đúng tiêu đề', async ({ page }) => {
    await page.goto('/dien-vien');
    await expect(page.getByRole('heading', { name: 'Diễn Viên' })).toBeVisible();
  });

  test('hiển thị danh sách diễn viên', async ({ page }) => {
    await page.goto('/dien-vien');
    await expect(page.getByText('Lee Min-ho').first()).toBeVisible();
  });

  test('hiển thị bộ lọc chữ cái A-Z', async ({ page }) => {
    await page.goto('/dien-vien');
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  });
});
