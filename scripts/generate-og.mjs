import sharp from "sharp";
import { statSync } from "fs";

const W = 1200;
const H = 630;

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#063a6b"/>
      <stop offset="100%" stop-color="#116bb9"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#00a1ed" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#00a1ed" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <circle cx="980" cy="120" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="1080" cy="520" r="220" fill="rgba(255,255,255,0.03)"/>
  <text x="80" y="360" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#ffffff">Oman Money Exchange</text>
  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="rgba(255,255,255,0.78)">Send smart. Live smart. Money transfer across Oman.</text>
  <text x="80" y="560" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="rgba(255,255,255,0.5)">LuLu Exchange Oman</text>
</svg>`);

const { data, info } = await sharp("assets/img/lulu-exchange-logo-dark.svg", {
  density: 280,
})
  .resize({ width: 440 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
}

const logoLight = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer();

await sharp(svg)
  .composite([{ input: logoLight, left: 80, top: 110 }])
  .png({ compressionLevel: 8 })
  .toFile("assets/img/og-image.png");

const out = await sharp("assets/img/og-image.png").metadata();
console.log(
  `wrote assets/img/og-image.png ${out.width}x${out.height} (${statSync("assets/img/og-image.png").size} bytes)`
);
