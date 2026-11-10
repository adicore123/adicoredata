// יוצר את אייקוני ה-PNG של AdiCore בלי תלויות חיצוניות. הרצה: npm run icons
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y, size);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function capsuleDist(px, py, cx, cy, halfLen, r) {
  const dx = Math.abs(px - cx) - halfLen;
  return Math.hypot(Math.max(dx, 0), py - cy) - r;
}

function roundedRectSDF(px, py, cx, cy, hx, hy, r) {
  const dx = Math.abs(px - cx) - (hx - r);
  const dy = Math.abs(py - cy) - (hy - r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
}

function iconPixel(maskable) {
  return (x, y, s) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const k = maskable ? 0.76 : 1;

    const t = clamp01((px + py) / (2 * s));
    let r = lerp(69, 13, t);
    let g = lerp(194, 138, t);
    let b = lerp(151, 102, t);

    // ארבעה פסים לבנים — שורות תיק העבודות
    const barH = s * 0.072 * k;
    const barR = barH / 2;
    const half = [0.21, 0.275, 0.275, 0.18].map((v) => v * s * k);
    let cov = 0;
    const ys = [0.245, 0.4, 0.555, 0.71].map((f) => f * s);
    for (let i = 0; i < 4; i++) {
      const dist = capsuleDist(px, py, s / 2, ys[i], half[i] - barR, barR);
      cov = Math.max(cov, clamp01(0.5 - dist));
    }
    r = lerp(r, 255, cov);
    g = lerp(g, 255, cov);
    b = lerp(b, 255, cov);

    const alpha = maskable
      ? 255
      : Math.round(clamp01(0.5 - roundedRectSDF(px, py, s / 2, s / 2, s / 2, s / 2, s * 0.23)) * 255);

    return [Math.round(r), Math.round(g), Math.round(b), alpha];
  };
}

mkdirSync(outDir, { recursive: true });
for (const s of [192, 512]) {
  writeFileSync(join(outDir, `icon-${s}.png`), encodePng(s, iconPixel(false)));
}
writeFileSync(join(outDir, "icon-maskable-512.png"), encodePng(512, iconPixel(true)));
console.log("✔ AdiCore icons written");
