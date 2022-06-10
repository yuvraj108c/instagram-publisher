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

export function createVideo(f: string): string {
  const path = `${FILES_DIR}/${f}`;
  fs.writeFileSync(path, '');
  return path;
}
