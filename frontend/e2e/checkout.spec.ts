import { expect, test } from '@playwright/test';

test('customer orders a drink from the menu and sees the paid confirmation', async ({ page }) => {
  const email = `checkout-${crypto.randomUUID()}@brewlite.test`;
  let orderId: number | undefined;

  await page.route('http://localhost:3001/payments/vnpay/create-url', async (route) => {
    const body = route.request().postDataJSON() as { orderId: number };
    orderId = body.orderId;

    const payment = await page.request.post('http://localhost:3001/payments/simulate', {
      data: { orderId, status: 'PAID' },
    });
    expect(payment.ok(), `${payment.status()}: ${await payment.text()}`).toBe(true);

    await route.fulfill({
      json: { paymentUrl: `http://localhost:3000/orders/${orderId}` },
    });
  });

  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Chọn món yêu thích' })).toBeVisible();
  await page.getByRole('link', { name: /Ca phe sua/ }).click();

  await expect(page.getByRole('heading', { name: 'Ca phe sua' })).toBeVisible();
  await page.getByRole('radio', { name: /Vừa \(M\)/ }).click();
  await page.getByRole('spinbutton', { name: 'Số lượng' }).fill('2');
  await page.getByRole('button', { name: /Thêm vào giỏ hàng/ }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Giỏ hàng (2)' })).toBeVisible();
  await expect(page.getByText('Size: M')).toBeVisible();
  await expect(page.getByRole('paragraph').filter({ hasText: '80.000đ' }).first()).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/login/),
    page.getByRole('link', { name: 'Đặt hàng' }).click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Chào mừng quay lại' })).toBeVisible();
  await page.getByRole('link', { name: 'Đăng ký ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Tạo tài khoản mới' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('BrewLite123!');
  await page.getByLabel('Xác nhận mật khẩu').fill('BrewLite123!');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Thanh toán' })).toBeVisible();
  await expect(page.getByText('80.000đ').first()).toBeVisible();
  await page.getByRole('button', { name: /Tiến hành thanh toán qua VNPay/ }).click();

  await expect.poll(() => orderId).toBeDefined();
  await expect(page).toHaveURL(/\/orders\/\d+$/, { timeout: 20_000 });
  await expect(page.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAID');
  await expect(page.getByTestId('status-badge')).toContainText('Đã thanh toán');
  await expect(page.getByRole('heading', { name: 'Danh sách món đã đặt' })).toBeVisible();
  await expect(page.getByText('Ca phe sua')).toBeVisible();
  await expect(page.getByText('Số lượng: 2')).toBeVisible();
  await expect(page.getByText('80.000đ').last()).toBeVisible();
});
