import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) {
  console.error('Không tìm thấy ffmpeg-static binary.');
  process.exit(1);
}

const rootDir = path.resolve(process.cwd());
const testResultsDir = path.join(rootDir, 'frontend', 'test-results');
const evidenceDir = path.join(rootDir, 'docs', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

// Tìm tất cả file video.webm do Playwright xuất ra trong frontend/test-results
function findVideos(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findVideos(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.webm')) {
      results.push(fullPath);
    }
  }
  return results;
}

const videos = findVideos(testResultsDir);
if (videos.length === 0) {
  console.error('Chưa có file video .webm nào trong frontend/test-results/.');
  process.exit(1);
}

for (const webmFile of videos) {
  const folderName = path.basename(path.dirname(webmFile)).toLowerCase();
  const isMobile = folderName.includes('mobile');
  const isDesktop = folderName.includes('desktop');

  if (!isMobile && !isDesktop) continue;

  const outName = isMobile ? 'brewlite-demo-mobile.mp4' : 'brewlite-demo-desktop.mp4';
  const outPath = path.join(evidenceDir, outName);

  console.log(`Đang chuyển đổi ${webmFile} -> ${outPath} ...`);
  // Chuyển đổi sang H.264 MP4 chuẩn phát trên mọi trình duyệt / Windows / Google Drive
  execFileSync(
    ffmpegPath,
    [
      '-y',
      '-i',
      webmFile,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outPath,
    ],
    { stdio: 'inherit' },
  );

  const stat = fs.statSync(outPath);
  console.log(`Hoàn tất: ${outPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
}

