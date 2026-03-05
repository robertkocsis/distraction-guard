import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#111111"/>
  <path d="M64 20 L97 35 V65 C97 88 82 100 64 108 C46 100 31 88 31 65 V35 Z" fill="white"/>
  <path d="M53 57 V48 C53 39 75 39 75 48 V57" stroke="#111111" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="46" y="57" width="36" height="27" rx="6" fill="#111111"/>
  <circle cx="64" cy="69" r="4.5" fill="white"/>
  <rect x="61.5" y="69" width="5" height="8" rx="2.5" fill="white"/>
</svg>`;

await mkdir('public/icons', { recursive: true });

for (const size of [16, 48, 128]) {
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon${size}.png`);
  console.log(`Generated icon${size}.png`);
}
