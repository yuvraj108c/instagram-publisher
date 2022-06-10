const sharp = require('sharp');
const fs = require('fs');

export const FILES_DIR = 'files/';

try {
  fs.mkdirSync(FILES_DIR);
} catch (error) {}

export async function createImage(
  w: number,
  h: number,
  n: string
): Promise<string> {
  const svgImage = `
    <svg width="${w}" height="${h}">
    </svg>
    `;
  const svgBuffer = Buffer.from(svgImage);
  const path: string = `${FILES_DIR}/${n}`;
  await sharp(svgBuffer).toFile(path);
  return path;
}

export function createVideo(): string {
  const path = `${FILES_DIR}/vid.mp4`;
  fs.writeFileSync(path, '');
  return path;
}
