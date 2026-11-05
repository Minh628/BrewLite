import { expect, test } from '@playwright/test';

test('menu to payment confirmation', async ({ page }) => {
  const email = `checkout-${Date.now()}@brewlite.test`;

  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Chọn món yêu thích' })).toBeVisible();
  await page.getByRole('link', { name: /Ca phe sua/ }).click();
  await expect(page.getByRole('heading', { name: 'Ca phe sua' })).toBeVisible();
  await page.getByLabel('Số lượng').fill('2');
  await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole('link', { name: 'Đặt hàng' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole('link', { name: 'Đăng ký ngay' }).click();
  await expect(page).toHaveURL(/\/register/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('BrewLite123!');
  await page.getByLabel('Xác nhận mật khẩu').fill('BrewLite123!');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel('Số thẻ').fill('4242 4242 4242 4242');
  await page.getByRole('button', { name: 'Tạo đơn và thanh toán' }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/, { timeout: 20_000 });
  await expect(page.getByTestId('status-badge')).toContainText('Đã thanh toán');
});
