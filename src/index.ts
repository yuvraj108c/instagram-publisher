import fs from 'fs';
import { OptionsWithUri, RequestPromiseAPI } from 'request-promise-native';
import {
  MAX_CAPTION_LENGTH,
  MAX_SLIDESHOW_IMAGES,
  MIN_SLIDESHOW_IMAGES,
  VALID_VIDEO_ASPECT_RATIOS,
  VALID_VIDEO_EXTENSION,
} from './config';
import {
  CAPTION_TOO_LONG_ERR,
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
  INVALID_VIDEO_ASPECT_RATIO,
  INVALID_VIDEO_FORMAT,
  LOGIN_ERR,
  LOGIN_ERR_COOKIES,
  MAX_10_IMAGES_ERR,
  MIN_2_IMAGES_ERR,
  THUMBNAIL_NOT_FOUND_ERR,
  THUMBNAIL_NOT_JPG_ERR,
  VIDEO_NOT_FOUND_ERR,
} from './errors';
import createImageSlideshowHandler from './handlers/image_slideshow';
import { ICookie, Image, Login, LoginRes } from './types';

const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const request = require('request-promise-native');
const useragentFromSeed = require('useragent-from-seed');
const { Cookie } = require('tough-cookie');
const sizeOf = require('image-size');

const BASE_URL: string = 'https://i.instagram.com';
const COOKIES_FILE_PATH: string = 'cookies.json';

class InstagramPublisher {
  _request: RequestPromiseAPI = request;
  _loginData: Login;
  _cookies: string = '';
  _useragent: string =
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Avant Browser; Avant Browser; .NET CLR 1.0.3705; .NET CLR 1.1.4322; Media Center PC 4.0; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)';
  _csrftoken: string = '';

  constructor({ email, password }: Login) {
    this._loginData = { email, password };
    this._setHeaders();

    if (this._validateCookies()) {
      console.info(`[InstagramPublisher] - Authenticated: true`);
    }
  }

  _setHeaders() {
    this._request = request;
    const userAgent = useragentFromSeed(this._loginData.email);
    this._useragent = userAgent;

    const requestOptions: OptionsWithUri = {
      baseUrl: BASE_URL,
      uri: '',
      json: true,
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US',
        'X-Instagram-AJAX': 1,
        'X-Requested-With': 'XMLHttpRequest',
        Referer: BASE_URL,
      },
    };

    if (this._validateCookies() && requestOptions.headers !== undefined) {
      const cookies: ICookie[] = JSON.parse(
        fs.readFileSync(COOKIES_FILE_PATH, 'utf-8')
      );

      const csrftoken: String = cookies.filter(c => c.key === 'csrftoken')[0]
        .value;
      this._csrftoken = csrftoken.toString();
      requestOptions.headers['X-CSRFToken'] = csrftoken;
      this._cookies = cookies.map(c => `${c.key}=${c.value}`).join(';');
      requestOptions.headers.Cookie = this._cookies;
    }
    this._request = request.defaults(requestOptions);
  }

  _validateCookies(): Boolean {
    return fs.existsSync(COOKIES_FILE_PATH);
  }

  async createSlideshow(
    images: string[] = [],
    caption: string = ''
  ): Promise<boolean> {
    if (this._validateCookies()) {
      return await createImageSlideshowHandler(images, caption, this._request);
    } else {
      await this._login();
      await this._setHeaders();
      return await createImageSlideshowHandler(images, caption, this._request);
    }
  }

  async _login(): Promise<Boolean> {
    const { email, password } = this._loginData;

    // Get CSRFToken from cookie before login
    let value;
    await this._request('/', { resolveWithFullResponse: true }).then(res => {
      const pattern = new RegExp(/(csrf_token":")\w+/);
      const matches = res.toJSON().body.match(pattern);
      value = matches[0].substring(13);
    });

    // Provide CSRFToken for login or challenge request
    this._request = this._request.defaults({
      headers: { 'X-CSRFToken': value },
    });

    // Temporary work around for https://github.com/jlobos/instagram-web-api/issues/118
    const createEncPassword = (pwd: string) => {
      return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`;
    };

    // Login
    const res = await this._request.post('/accounts/login/ajax/', {
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

    console.info(
      `[InstagramPublisher] - Authenticated: ${res.body.authenticated}`
    );

    // save to cookies.json
    cookies.push('ig_cb=1');

    const cookiesJSON = cookies.map(Cookie.parse).map((c: any) => c.toJSON());
    fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookiesJSON));

    return loginRes.authenticated;
  }
}

module.exports = InstagramPublisher;
