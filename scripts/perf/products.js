#!/usr/bin/env node
/**
 * Đo GET /products (menu đầy đủ và có lọc/tìm) — PB-29 / Sub-task 29.1
 * Chạy: npm run perf:products
 */
const { finish, runScenario } = require('./common');

async function main() {
  const summaries = [];
  summaries.push(await runScenario({ name: 'Menu đầy đủ', path: '/products' }));
  summaries.push(
    await runScenario({
      name: 'Menu lọc danh mục + tìm không dấu',
      path: '/products?category=1&q=ca%20phe',
    }),
  );
  finish(summaries);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
