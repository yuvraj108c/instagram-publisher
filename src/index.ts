import fs from 'fs';
import { OptionsWithUri, RequestPromiseAPI } from 'request-promise-native';
import {
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
  LOGIN_ERR,
  MAX_10_IMAGES_ERR,
  MIN_2_IMAGES_ERR,
} from './errors';
import { ICookie, Image, Login, LoginRes } from './types';

const request = require('request-promise-native');
const useragentFromSeed = require('useragent-from-seed');
const { Cookie } = require('tough-cookie');
const sizeOf = require('image-size');
const isUrl = require('is-url');

const BASE_URL: string = 'https://i.instagram.com';
const COOKIES_FILE_PATH: string = 'cookies.json';

class InstagramPublisher {
  _request: RequestPromiseAPI = request;
  _loginData: Login;

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

    if (this._validateCookies() && requestOptions.headers != undefined) {
      const cookies: ICookie[] = JSON.parse(
        fs.readFileSync(COOKIES_FILE_PATH, 'utf-8')
      );

      const csrftoken: String = cookies.filter(c => c.key == 'csrftoken')[0]
        .value;
      requestOptions.headers['X-CSRFToken'] = csrftoken;
      requestOptions.headers.Cookie = cookies
        .map(c => `${c.key}=${c.value}`)
        .join(';');
    }
    this._request = request.defaults(requestOptions);
  }

  _validateCookies(): Boolean {
    return fs.existsSync(COOKIES_FILE_PATH);
  }

  async createSlideshow(images: string[], caption: string = '') {
    if (this._validateCookies()) {
      // validate images

      if (images == null || images.length < 2) {
        throw new Error(MIN_2_IMAGES_ERR);
      }
      if (images.length > 10) {
        throw new Error(MAX_10_IMAGES_ERR);
      }

      // check if images exists
      let imageSizes: Image[];
      try {
        imageSizes = images.map(sizeOf);
      } catch (error) {
        throw new Error(IMAGES_NOT_FOUND_ERR);
      }

      // check if jpg
      const imagesAreJPG: Boolean =
        imageSizes.filter(i => i.type == 'jpg').length == images.length;

      if (!imagesAreJPG) {
        throw new Error(IMAGES_NOT_JPG_ERR);
      }

      // check 1:1 aspect ratio
      const imagesAreOneOne: Boolean =
        imageSizes.filter(i => i.height == i.width).length == images.length;

      if (!imagesAreOneOne) {
        throw new Error(IMAGES_WRONG_ASPECT_RATIO_ERR);
      }

      const photosUploaded = [];
      const errors: String[] = [];

      // upload photos
      for (let idx = 0; idx < images.length; idx++) {
        const photo = images[idx];
        try {
          const uploadResponse = await this._uploadPhoto({ photo });
          photosUploaded.push(uploadResponse);
        } catch (error) {
          errors.push(
            `[InstagramPublisher/createSlideshow] - Photo ${photo} not uploaded`
          );
        }
      }

      // create slideshow
      if (photosUploaded.length > 0) {
        const createSlideshowResponse = await this._saveSlideshow({
          photosUploaded,
          caption,
        });
        console.info(
          `[InstagramPublisher] - Status: ${createSlideshowResponse.status} (${photosUploaded.length} uploaded, ${errors.length} failed)`
        );
      }
    } else {
      await this._login();
      await this._setHeaders();
      await this.createSlideshow(images, caption);
    }
  }

  async _uploadPhoto({ photo }: { photo: string }) {
    // Warning! don't change anything bellow.
    const uploadId = Date.now();

    let file;

    // Needed to new method, if image is from url.
    if (isUrl(photo)) {
      // Enconding: null is required, only way a Buffer is returned
      file = await this._request.get({ url: photo, encoding: null });
    } else {
      file = await fs.readFileSync(photo);
    }

    const ruploadParams = {
      media_type: 1,
      upload_id: uploadId.toString(),
      upload_media_height: 1080,
      upload_media_width: 1080,
      xsharing_user_ids: JSON.stringify([]),
      image_compression: JSON.stringify({
        lib_name: 'moz',
        lib_version: '3.1.m',
        quality: '80',
      }),
    };

    const nameEntity = `${uploadId}_0_${this._getRandomArbitrary(
      1000000000,
      9999999999
    )}`;

    const headersPhoto = {
      'x-entity-type': 'image/jpeg',
      offset: 0,
      'x-entity-name': nameEntity,
      'x-instagram-rupload-params': JSON.stringify(ruploadParams),
      'x-entity-length': file.byteLength,
      'Content-Length': file.byteLength,
      'Content-Type': 'application/octet-stream',
      'x-ig-app-id': `1217981644879628`,
      'Accept-Encoding': 'gzip',
      'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
      'X-IG-Connection-Speed': `${this._getRandomArbitrary(1000, 3700)}kbps`,
      'X-IG-Bandwidth-Speed-KBPS': '-1.000',
      'X-IG-Bandwidth-TotalBytes-B': '0',
      'X-IG-Bandwidth-TotalTime-MS': '0',
    };

    // Json = false, must be important to post work!
    let responseUpload = await this._request({
      uri: `/rupload_igphoto/${nameEntity}`,
      headers: headersPhoto,
      method: 'POST',
      json: false,
      body: file,
    });

    try {
      responseUpload = JSON.parse(responseUpload);

      if ('upload_id' in responseUpload) return responseUpload;

      throw new Error('Image upload error');
    } catch (e) {
      throw new Error(`Image upload error: ${e}`);
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
      throw new Error(
        '[InstagramPublisher/Login] - No cookies found after login'
      );
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

  _getRandomArbitrary(min: number, max: number): Number {
    return Math.random() * (max - min) + min;
  }

  async _saveSlideshow({ photosUploaded, caption }: any) {
    const payload = {
      caption,
      children_metadata: [...photosUploaded],
      client_sidecar_id: Date.now().toString(),
      disable_comments: '0',
      like_and_view_counts_disabled: false,
      source_type: 'library',
    };

    const requestHeaders = {
      'x-asbd-id': '198387',
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': 'hmac.AR0Etu9HnB7d5E470wlN1BGGukZQTzTDDhnNS48b83mytnHU',
      'x-instagram-ajax': '6543adcc6d29',
    };

    const uploadResponse = await this._request({
      uri: `/api/v1/media/configure_sidecar/`,
      method: 'POST',
      json: payload,
      headers: requestHeaders,
    });

    return uploadResponse;
  }
}

module.exports = InstagramPublisher;
