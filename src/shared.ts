import * as fs from 'fs';
import { COOKIES_FILE_PATH } from './config';

export function validateCookies(): Boolean {
  const exists = fs.existsSync(COOKIES_FILE_PATH);

  // check expiration date
  if (exists) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH, 'utf8'));
    const expirationDate = new Date(
      cookies.find((c: any) => c.key === 'sessionid').expires
    );
    return new Date() < expirationDate;
  }
  return false;
}

export async function sleep(milliseconds: number) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}
