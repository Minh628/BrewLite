import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import https from 'node:https';

/**
 * Bảng mã 64 ký tự chuẩn của PlantUML
 */
function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  let r = '';
  r += encode6bit(c1 & 0x3F);
  r += encode6bit(c2 & 0x3F);
  r += encode6bit(c3 & 0x3F);
  r += encode6bit(c4 & 0x3F);
  return r;
}

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data.charCodeAt(i), 0, 0);
    } else {
      r += append3bytes(
        data.charCodeAt(i),
        data.charCodeAt(i + 1),
        data.charCodeAt(i + 2)
      );
    }
  }
  return r;
}

/**
 * Mã hóa chuỗi PlantUML theo thuật toán chuẩn của PlantUML:
 * UTF-8 -> DeflateRaw -> PlantUML 64-bit
 */
function encodePlantUML(puml) {
  const deflated = zlib
    .deflateRawSync(Buffer.from(puml, 'utf8'), { level: 9 })
    .toString('binary');
  return encode64(deflated);
}

/**
 * Gửi request tới server PlantUML chính thức để biên dịch ra SVG chuẩn
 */
function fetchPlantUmlSvg(encoded) {
  const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`PlantUML server trả về HTTP status ${res.statusCode}`)
          );
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      })
      .on('error', (err) => reject(err));
  });
}

async function renderPumlFile(pumlPath, outSvgPath) {
  const fileName = path.basename(pumlPath);
  console.log(`Đang biên dịch ${fileName} qua PlantUML...`);
  const content = fs.readFileSync(pumlPath, 'utf8');
  const encoded = encodePlantUML(content);
  const svg = await fetchPlantUmlSvg(encoded);

  if (svg.includes('bad URL') || svg.includes('An error has occured')) {
    throw new Error(`PlantUML trả về nội dung lỗi cho file ${fileName}`);
  }

  fs.writeFileSync(outSvgPath, svg, 'utf8');
  console.log(`✓ Đã tạo thành công: ${outSvgPath} (${svg.length} bytes)`);
}

async function main() {
  const diagramsDir = path.resolve('docs/diagrams');
  const pumlFiles = fs
    .readdirSync(diagramsDir)
    .filter((f) => f.endsWith('.puml'));

  for (const file of pumlFiles) {
    const pumlPath = path.join(diagramsDir, file);
    const outSvgPath = path.join(diagramsDir, file.replace(/\.puml$/, '.svg'));
    try {
      await renderPumlFile(pumlPath, outSvgPath);
    } catch (err) {
      console.error(`✗ Lỗi khi xử lý ${file}:`, err.message);
    }
  }
}

main();
