#!/usr/bin/env node
/**
 * Đo POST /orders có Bearer token — PB-29 / Sub-task 29.1
 * Chạy: npm run perf:orders
 *
 * Mỗi request tạo một đơn thật trong DB: chỉ chạy trên database dành cho đo hiệu năng.
 * Tài khoản mặc định là user test của seed; đổi bằng PERF_EMAIL / PERF_PASSWORD.
 */
const { finish, login, runScenario } = require('./common');

const email = process.env.PERF_EMAIL ?? 'customer@brewlite.vn';
const password = process.env.PERF_PASSWORD ?? 'Password123';

/** Giỏ hàng mẫu theo dữ liệu seed: 2 dòng, một dòng có 2 topping */
const orderBody = {
  items: [
    { productId: 3, size: 'L', qty: 2, toppingIds: [1, 2] },
    { productId: 4, size: 'M', qty: 1, toppingIds: [] },
  ],
};

async function main() {
  const token = await login(email, password);
  const summaries = [
    await runScenario({
      name: 'Tạo đơn hàng',
      path: '/orders',
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: orderBody,
    }),
  ];
  finish(summaries);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
