/**
 * Tiện ích chung cho kịch bản đo hiệu năng (PB-29 / Sub-task 29.1).
 *
 * Cấu hình qua biến môi trường:
 *   PERF_BASE_URL     địa chỉ backend (mặc định http://localhost:3001)
 *   PERF_DURATION     số giây mỗi kịch bản (mặc định 20)
 *   PERF_CONNECTIONS  số kết nối đồng thời (mặc định 10)
 *   PERF_P95_LIMIT_MS ngưỡng p95 đạt yêu cầu (mặc định 500)
 *   PERF_OUT          nếu có: ghi kết quả JSON vào file này
 */
const fs = require('node:fs');
const autocannon = require('autocannon');

const config = {
  baseUrl: process.env.PERF_BASE_URL ?? 'http://localhost:3001',
  duration: Number(process.env.PERF_DURATION ?? 20),
  connections: Number(process.env.PERF_CONNECTIONS ?? 10),
  p95LimitMs: Number(process.env.PERF_P95_LIMIT_MS ?? 500),
};

/** Phân vị theo phương pháp nearest-rank trên mảng đã sắp xếp tăng dần */
function percentile(sorted, p) {
  if (sorted.length === 0) return NaN;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

/**
 * Chạy một kịch bản autocannon và tự tính p50/p95/p99 từ thời gian phản hồi của từng request
 * (autocannon chỉ báo sẵn p90, p97.5, p99 nên không có p95).
 */
async function runScenario({ name, path, method = 'GET', headers = {}, body }) {
  const latencies = [];
  const statusCounts = {};

  const instance = autocannon({
    url: `${config.baseUrl}${path}`,
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    duration: config.duration,
    connections: config.connections,
  });

  instance.on('response', (_client, statusCode, _resBytes, responseTime) => {
    latencies.push(responseTime);
    statusCounts[statusCode] = (statusCounts[statusCode] ?? 0) + 1;
  });

  const result = await instance;
  latencies.sort((a, b) => a - b);

  const summary = {
    name,
    request: `${method} ${path}`,
    durationS: config.duration,
    connections: config.connections,
    requests: latencies.length,
    rps: Math.round(result.requests.average),
    statusCounts,
    errors: result.errors,
    timeouts: result.timeouts,
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99)),
      max: round(latencies[latencies.length - 1]),
      mean: round(result.latency.average),
    },
  };

  const non2xx = latencies.length - countStatus(statusCounts, 200, 299);
  summary.passed =
    summary.latencyMs.p95 < config.p95LimitMs && non2xx === 0 && summary.errors === 0;

  printSummary(summary, non2xx);
  return summary;
}

function countStatus(statusCounts, from, to) {
  return Object.entries(statusCounts)
    .filter(([code]) => Number(code) >= from && Number(code) <= to)
    .reduce((sum, [, count]) => sum + count, 0);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function printSummary(summary, non2xx) {
  const { latencyMs } = summary;
  console.log(`\n=== ${summary.name}: ${summary.request} ===`);
  console.log(
    `${summary.requests} request trong ${summary.durationS}s, ${summary.connections} kết nối, ~${summary.rps} req/s`,
  );
  console.log(
    `p50 ${latencyMs.p50} ms | p95 ${latencyMs.p95} ms | p99 ${latencyMs.p99} ms | max ${latencyMs.max} ms`,
  );
  console.log(`Mã trạng thái: ${JSON.stringify(summary.statusCounts)}`);
  if (non2xx > 0) {
    console.log(
      `⚠️  ${non2xx} response không phải 2xx. Nếu là 429: khởi động backend với THROTTLE_LIMIT lớn (xem docs/perf-report.md).`,
    );
  }
  console.log(
    summary.passed
      ? `✅ Đạt: p95 < ${config.p95LimitMs} ms`
      : `❌ Không đạt (ngưỡng p95 < ${config.p95LimitMs} ms, không có lỗi)`,
  );
}

/** Ghi kết quả ra file JSON (nếu đặt PERF_OUT) và đặt exit code 1 nếu có kịch bản không đạt */
function finish(summaries) {
  if (process.env.PERF_OUT) {
    const report = { baseUrl: config.baseUrl, at: new Date().toISOString(), summaries };
    fs.writeFileSync(process.env.PERF_OUT, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`\nĐã ghi kết quả: ${process.env.PERF_OUT}`);
  }
  if (summaries.some((s) => !s.passed)) {
    process.exitCode = 1;
  }
}

/** Đăng nhập một lần để lấy accessToken (POST /auth/login bị giới hạn 5 lần/phút) */
async function login(email, password) {
  const response = await fetch(`${config.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Đăng nhập thất bại (${response.status}): ${await response.text()}`);
  }
  const { accessToken } = await response.json();
  return accessToken;
}

module.exports = { config, runScenario, finish, login, percentile };
