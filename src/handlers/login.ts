import * as fs from 'fs';
import { LOGIN_ERR, LOGIN_ERR_COOKIES } from '../errors';
import HTTP_CLIENT from '../http';
import { COOKIES_FILE_PATH } from '../config';
import { LoginRes } from '../types';
const { Cookie } = require('tough-cookie');

async function login({
  email,
  password,
  verbose,
}: {
  email: string;
  password: string;
  verbose: boolean;
}): Promise<Boolean> {
  // Get CSRFToken from cookie before login
  let value;
  await HTTP_CLIENT.request('/', { resolveWithFullResponse: true }).then(
    res => {
      const pattern = new RegExp(/(csrf_token\\":\\")[\w]+/);
      const matches = res.body.match(pattern);
      value = matches[0].substring(15);
    }
  );

  // Provide CSRFToken for login or challenge request
  HTTP_CLIENT.request = HTTP_CLIENT.request.defaults({
    headers: { 'X-CSRFToken': value },
  });

  // Temporary work around for https://github.com/jlobos/instagram-web-api/issues/118
  const createEncPassword = (pwd: string) => {
    return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`;
  };

  // Login
  const res = await HTTP_CLIENT.request.post('/accounts/login/ajax/', {
    resolveWithFullResponse: true,
    form: { username: email, enc_password: createEncPassword(password) },
  });

  if (!res.headers['set-cookie']) {
    throw new Error(LOGIN_ERR_COOKIES);
  }
  const cookies = res.headers['set-cookie'];
  const loginRes: LoginRes = res.body;

  if (!loginRes.authenticated) {
    throw new Error(LOGIN_ERR);
  }

  if (verbose)
    console.info(
      `[InstagramPublisher] - Authenticated: ${res.body.authenticated}`
    );

  // save to cookies.json
  cookies.push('ig_cb=1');

  const cookiesJSON = cookies.map(Cookie.parse).map((c: any) => c.toJSON());
  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookiesJSON));

  return loginRes.authenticated;
}
export default login;
