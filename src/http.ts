import { OptionsWithUri, RequestPromiseAPI } from 'request-promise-native';
import fs from 'fs';
import { ICookie } from './types';
import { validateCookies } from './shared';
import { BASE_URL, COOKIES_FILE_PATH } from './config';

const request = require('request-promise-native');
const useragentFromSeed = require('useragent-from-seed');

class HTTP_CLIENT {
  static request: RequestPromiseAPI = request;
  static cookies: string = '';
  static useragent: string = '';
  static csrftoken: string = '';

  static setUserAgent(email: string) {
    HTTP_CLIENT.useragent = useragentFromSeed(email);
  }

  static setHeaders() {
    HTTP_CLIENT.request = request;

    const requestOptions: OptionsWithUri = {
      baseUrl: BASE_URL,
      uri: '',
      json: true,
      headers: {
        'User-Agent': this.useragent,
        'Accept-Language': 'en-US',
        'X-Instagram-AJAX': 1,
        'X-Requested-With': 'XMLHttpRequest',
        Referer: BASE_URL,
      },
    };

    if (validateCookies() && requestOptions.headers !== undefined) {
      const cookies: ICookie[] = JSON.parse(
        fs.readFileSync(COOKIES_FILE_PATH, 'utf-8')
      );

      const csrftoken: String = cookies.filter(c => c.key === 'csrftoken')[0]
        .value;
      this.csrftoken = csrftoken.toString();
      requestOptions.headers['X-CSRFToken'] = csrftoken;
      this.cookies = cookies.map(c => `${c.key}=${c.value}`).join(';');
      requestOptions.headers.Cookie = this.cookies;
    }
    HTTP_CLIENT.request = request.defaults(requestOptions);
  }
}

export default HTTP_CLIENT;
