import fs from 'fs';
import { COOKIES_FILE_PATH } from './config';

export function validateCookies(): Boolean {
  return fs.existsSync(COOKIES_FILE_PATH);
}

export function getRandomArbitrary(min: number, max: number): Number {
  return Math.random() * (max - min) + min;
}

export async function sleep(milliseconds: number) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}
