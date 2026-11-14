import { expect, Page, test } from '@playwright/test';

// Helper hiển thị banner chú thích bước hiện tại trên video demo để giảng viên dễ theo dõi
async function showStepBanner(page: Page, stepText: string) {
  await page.evaluate((text) => {
    const id = 'brewlite-demo-step-banner';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        backgroundColor: 'rgba(30, 20, 15, 0.9)',
        color: '#FFFDF9',
        padding: '8px 16px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(217, 119, 6, 0.6)',
        maxWidth: '92vw',
        textAlign: 'center',
        pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    el.textContent = text;
  }, stepText);
}

async function pause(page: Page, ms = 900) {
  await page.waitForTimeout(ms);
}

// Kịch bản demo dùng chung cho cả Desktop (1280x720) và Mobile (375x667)
async function runFullDemoFlow(page: Page, modeLabel: string) {
  let createdOrderId: number | undefined;

  // Lắng nghe response POST /orders để lấy orderId vừa tạo phục vụ assert ở các bước sau
  page.on('response', async (res) => {
    if (
      res.url().includes('/orders') &&
      res.request().method() === 'POST' &&
      res.status() === 201
    ) {
      try {
        const data = (await res.json()) as { orderId?: number };
        if (data.orderId) createdOrderId = data.orderId;
      } catch {}
    }
  });

  // 1. Kiểm tra GET /health và mở trang Menu
  const healthRes = await page.request.get('http://localhost:3001/health');
  expect(healthRes.status()).toBe(200);

  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Chọn món yêu thích' })).toBeVisible();
  await showStepBanner(page, `[${modeLabel}] 1/6 · Mở Menu & Kiểm tra tìm kiếm Empty State`);
  await pause(page, 1200);

  // Tìm từ khóa không tồn tại để hiển thị Empty State
  const searchInput = page.locator('#menu-search');
  await searchInput.fill('xyz999');
  await expect(page.getByText('Không tìm thấy món phù hợp')).toBeVisible({ timeout: 8000 });
  await pause(page, 1000);

  await page.getByRole('button', { name: 'Xóa bộ lọc' }).last().click();
  await pause(page, 700);

  // Tìm không dấu 'ca phe'
  await searchInput.fill('ca phe');
  await expect(page.getByRole('link', { name: /Ca phe sua/ })).toBeVisible({ timeout: 8000 });
  await pause(page, 900);
  await page
    .getByRole('button', { name: 'Xóa bộ lọc' })
    .first()
    .click()
    .catch(() => {});
  await searchInput.fill('');
  await pause(page, 700);

  // 2. Kiểm tra món Hết hàng (Bạc xỉu)
  await showStepBanner(page, `[${modeLabel}] 2/6 · Kiểm tra sản phẩm Hết hàng (Bạc xỉu)`);
  await page.getByRole('link', { name: /Bạc xỉu/ }).click();
  await expect(page.getByRole('heading', { name: 'Bạc xỉu' })).toBeVisible();
  await expect(page.getByText('Hết hàng').first()).toBeVisible();
  await pause(page, 1300);

  // Quay lại chọn Cappuccino -> đổi Size S -> M -> L + Topping -> thêm vào giỏ
  await page.goto('/menu');
  await showStepBanner(
    page,
    `[${modeLabel}] 3/6 · Chọn Size, Topping & tính giá động (Cappuccino)`,
  );
  await page.getByRole('link', { name: /Cappuccino/ }).click();
  await expect(page.getByRole('heading', { name: 'Cappuccino' })).toBeVisible();
  await pause(page, 700);

  await page.getByRole('radio', { name: /Vừa \(M\)/ }).click();
  await pause(page, 500);
  await page.getByRole('radio', { name: /Lớn \(L\)/ }).click();
  await pause(page, 500);

  const blackPearl = page.getByRole('checkbox', { name: /Trân châu đen/ });
  if (await blackPearl.count()) await blackPearl.check();
  await pause(page, 400);
  const creamCheese = page.getByRole('checkbox', { name: /Kem Cheese/ });
  if (await creamCheese.count()) await creamCheese.check();
  await pause(page, 500);

  await page.getByRole('spinbutton', { name: 'Số lượng' }).fill('2');
  await pause(page, 600);
  await page.getByRole('button', { name: /Thêm vào giỏ hàng/ }).click();
  await expect(page).toHaveURL(/\/cart$/);

  // 3. Kiểm tra Giỏ hàng & Reload F5 giữ localStorage
  await showStepBanner(page, `[${modeLabel}] 4/6 · Giỏ hàng: Reload (F5) giữ nguyên dữ liệu`);
  await expect(page.getByRole('heading', { name: /Giỏ hàng/ })).toBeVisible();
  await pause(page, 1000);
  await page.reload();
  await expect(page.getByText('Cappuccino')).toBeVisible();
  await pause(page, 1000);

  // Bấm Đặt hàng khi chưa đăng nhập -> Auth Guard redirect /login
  await showStepBanner(page, `[${modeLabel}] 4/6 · Auth Guard chặn khách chưa đăng nhập -> /login`);
  await page.getByRole('link', { name: 'Đặt hàng' }).click();
  await expect(page).toHaveURL(/\/login/);
  await pause(page, 900);

  // Thử nhập sai mật khẩu -> hiện lỗi "Tài khoản hoặc mật khẩu sai.", sau đó đăng nhập đúng
  await page.getByLabel('Email').fill('customer@brewlite.vn');
  await page.getByLabel('Mật khẩu').fill('WrongPass123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Tài khoản hoặc mật khẩu sai.')).toBeVisible({ timeout: 8000 });
  await pause(page, 1200);

  await page.getByLabel('Mật khẩu').fill('Password123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // 4. Checkout: Mã giảm giá lỗi -> Mã giảm giá đúng -> VNPay Fail -> Retry Thành công
  await showStepBanner(page, `[${modeLabel}] 5/6 · Checkout: Mã lỗi HETHAN -> Áp mã BREW10`);
  await expect(page.getByRole('heading', { name: 'Thanh toán' })).toBeVisible();
  await pause(page, 800);

  const promoInput = page.locator('#promo-input');
  await promoInput.fill('HETHAN');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await pause(page, 1100);

  await promoInput.fill('BREW10');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Đã áp dụng')).toBeVisible({ timeout: 8000 });
  await pause(page, 1100);

  // Thanh toán VNPay lần 1: Thao tác HỦY trực tiếp trên cổng VNPay Sandbox -> VNPay redirect về vnpay-return (mã 24)
  await showStepBanner(page, `[${modeLabel}] 5/6 · Cổng VNPay Sandbox -> Chọn NCB & Hủy giao dịch`);
  await page.getByRole('button', { name: /Tiến hành thanh toán qua VNPay/ }).click();
  await page.waitForURL(/vnpayment\.vn/, { timeout: 25000 });
  await pause(page, 1000);

  await page.getByText('Thẻ nội địa và tài khoản ngân hàng').click();
  await pause(page, 800);
  await page.locator('#NCB').click();
  await page.locator('#card_number_mask').waitFor({ state: 'visible', timeout: 15000 });
  await pause(page, 900);

  // Bấm Hủy thanh toán và Xác nhận hủy ngay trên giao diện VNPay Sandbox
  await page.locator('a').filter({ hasText: 'Hủy thanh toán' }).first().click();
  await pause(page, 800);
  await page.getByText('Xác nhận hủy', { exact: true }).first().click();

  // VNPay tự redirect về /orders/vnpay-return với mã lỗi 24
  await page.waitForURL(/\/orders\/vnpay-return/, { timeout: 25000 });
  await showStepBanner(
    page,
    `[${modeLabel}] 5/6 · VNPay Return báo thất bại (24) -> Xem chi tiết đơn`,
  );
  await expect(page.getByText(/Giao dịch không thành công/)).toBeVisible({ timeout: 15000 });
  await pause(page, 1500);

  await page.goto(`/orders/${createdOrderId}`);
  await expect(page.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAYMENT_FAILED', {
    timeout: 15000,
  });
  await pause(page, 1200);

  // Bấm Thử thanh toán lại qua VNPay -> Nhập thẻ test NCB & OTP 123456 thật trên VNPay Sandbox -> Thành công (00)
  await showStepBanner(page, `[${modeLabel}] 5/6 · Thử lại VNPay -> Nhập thẻ NCB & OTP 123456`);
  const retryBtn = page.getByRole('button', {
    name: /Thử thanh toán lại qua VNPay|Thanh toán ngay qua VNPay/,
  });
  await expect(retryBtn).toBeVisible();
  await retryBtn.click();
  await page.waitForURL(/vnpayment\.vn/, { timeout: 25000 });
  await pause(page, 900);

  await page.getByText('Thẻ nội địa và tài khoản ngân hàng').click();
  await pause(page, 700);
  await page.locator('#NCB').click();
  await page.locator('#card_number_mask').waitFor({ state: 'visible', timeout: 15000 });

  await page.locator('#card_number_mask').fill('9704198526191432198');
  await pause(page, 400);
  await page.locator('#cardHolder').fill('NGUYEN VAN A');
  await pause(page, 400);
  await page.locator('#cardDate').fill('07/15');
  await pause(page, 700);
  await page.locator('#btnContinue').click();

  await page.waitForTimeout(1000);
  if (
    await page
      .locator('#btnAgree')
      .isVisible()
      .catch(() => false)
  ) {
    await page.locator('#btnAgree').click();
  }

  await page.locator('#otpvalue').waitFor({ state: 'visible', timeout: 15000 });
  await pause(page, 700);
  await page.locator('#otpvalue').fill('123456');
  await pause(page, 700);
  await page.locator('#btnConfirm').click();

  // VNPay tự redirect về /orders/vnpay-return với mã 00 thành công
  await page.waitForURL(/\/orders\/vnpay-return/, { timeout: 25000 });
  await showStepBanner(page, `[${modeLabel}] 5/6 · VNPay Return xác nhận thành công (PAID)`);
  await expect(page.getByText(/Thanh toán qua cổng VNPay thành công!/)).toBeVisible({
    timeout: 15000,
  });
  await pause(page, 1500);

  await page.goto(`/orders/${createdOrderId}`);
  await expect(page.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAID', {
    timeout: 15000,
  });
  await pause(page, 1300);

  // 5. Quầy Barista chuyển trạng thái đơn
  await showStepBanner(
    page,
    `[${modeLabel}] 6/6 · Quầy Barista: PAID -> PREPARING -> READY -> COMPLETED`,
  );
  await page.goto('/login');
  await page.getByLabel('Email').fill('barista@brewlite.vn');
  await page.getByLabel('Mật khẩu').fill('matkhau123');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 }),
    page.getByRole('button', { name: 'Đăng nhập' }).click(),
  ]);
  await page.goto('/barista');
  await expect(page.getByRole('heading', { name: 'Quầy pha chế' })).toBeVisible({ timeout: 15000 });
  await pause(page, 1000);

  const orderArticle = page
    .locator('article')
    .filter({ hasText: `#${createdOrderId}` })
    .first();
  await expect(orderArticle).toBeVisible({ timeout: 15000 });

  // PAID -> PREPARING
  await orderArticle.getByRole('button').click();
  await pause(page, 1100);
  // PREPARING -> READY
  await orderArticle.getByRole('button').click();
  await pause(page, 1100);
  // READY -> COMPLETED
  await orderArticle.getByRole('button').click();
  await pause(page, 1400);

  // Xem lại lịch sử đơn của khách hàng
  await showStepBanner(page, `[${modeLabel}] Hoàn tất luồng End-to-End BrewLite!`);
  await page.goto('/login');
  await page.getByLabel('Email').fill('customer@brewlite.vn');
  await page.getByLabel('Mật khẩu').fill('Password123');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 }),
    page.getByRole('button', { name: 'Đăng nhập' }).click(),
  ]);
  await page.goto(`/orders/${createdOrderId}`);
  await expect(page.getByTestId('status-badge')).toHaveAttribute('data-status', 'COMPLETED', {
    timeout: 15000,
  });
  await pause(page, 1800);
}

test.describe('Demo Video Recording', () => {
  // Bỏ qua trên CI vì luồng demo kết nối trực tiếp VNPay Sandbox thật (không mock API)
  test.skip(
    !!process.env.CI,
    'Script quay video demo chỉ chạy ở môi trường local có VNPay Sandbox.',
  );
  test.setTimeout(180_000);

  test('demo-desktop', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: './test-results/demo-desktop',
        size: { width: 1280, height: 720 },
      },
    });
    const page = await context.newPage();
    await runFullDemoFlow(page, 'Desktop');
    await context.close();
  });

  test('demo-mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      recordVideo: {
        dir: './test-results/demo-mobile',
        size: { width: 375, height: 667 },
      },
    });
    const page = await context.newPage();
    await runFullDemoFlow(page, 'Mobile');
    await context.close();
  });
});
