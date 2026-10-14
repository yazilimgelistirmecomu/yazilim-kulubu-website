// Generates circular favicons (transparent corners) from public/logo.png.
// Usage: node scripts/make-favicons.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = 'public/logo.png';
const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// Bounding box of non-white pixels (the seal), ignoring a thin border of image edge noise.
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 8; y < H - 8; y++) for (let x = 8; x < W - 8; x++) {
  const i = (y * W + x) * 3;
  if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
const d = Math.min(maxX - minX, maxY - minY) + 1; // circle diameter
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
const left = Math.round(cx - d / 2), top = Math.round(cy - d / 2);
console.log('seal bbox', { minX, maxX, minY, maxY, d });

const square = await sharp(SRC).extract({ left, top, width: d, height: d }).toBuffer();

async function circle(size) {
  // Render at 4x then downscale the mask for smooth edges.
  const big = size * 4;
  const mask = Buffer.from(`<svg width="${big}" height="${big}"><circle cx="${big / 2}" cy="${big / 2}" r="${big / 2}" fill="#fff"/></svg>`);
  const img = await sharp(square).resize(big, big).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return sharp(img).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
}

const out = { 'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'android-chrome-192x192.png': 192, 'android-chrome-512x512.png': 512, 'favicon-48x48.png': 48 };
for (const [name, size] of Object.entries(out)) fs.writeFileSync('public/' + name, await circle(size));

// favicon.ico: PNG-compressed ICO with 16/32/48 entries
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(circle));
const header = Buffer.alloc(6); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = pngs.map((p, i) => {
  const e = Buffer.alloc(16);
  e[0] = sizes[i]; e[1] = sizes[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(p.length, 8); e.writeUInt32LE(offset, 12); offset += p.length; return e;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...pngs]));
fs.unlinkSync('public/favicon-48x48.png');
