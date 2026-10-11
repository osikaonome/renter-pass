// Generates PWA icons into public/icons. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const logo = (size, padding) => {
  const inner = size - padding * 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${padding ? 0 : size * 0.22}" fill="#1f6f5c"/>
  <g transform="translate(${padding} ${padding}) scale(${inner / 32})">
    <path d="M9 16.5 16 10l7 6.5V23a1 1 0 0 1-1 1h-4v-5h-4v5h-4a1 1 0 0 1-1-1z" fill="#ffffff"/>
  </g>
</svg>`);
};

await mkdir("public/icons", { recursive: true });
await sharp(logo(192, 0)).png().toFile("public/icons/icon-192.png");
await sharp(logo(512, 0)).png().toFile("public/icons/icon-512.png");
// Maskable icons keep the logo inside the central safe zone.
await sharp(logo(512, 80)).png().toFile("public/icons/icon-maskable-512.png");
await sharp(logo(180, 0)).png().toFile("public/icons/apple-touch-icon.png");
console.log("Icons written to public/icons");
