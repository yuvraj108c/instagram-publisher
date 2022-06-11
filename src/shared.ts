import fs from 'fs';

export const COOKIES_FILE_PATH = 'cookies.json';

export function validateCookies(): Boolean {
  return fs.existsSync(COOKIES_FILE_PATH);
}

export function getRandomArbitrary(min: number, max: number): Number {
  return Math.random() * (max - min) + min;
}
