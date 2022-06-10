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
      // validate images

      if (images.length < MIN_SLIDESHOW_IMAGES) {
        throw new Error(MIN_2_IMAGES_ERR);
      }
      if (images.length > MAX_SLIDESHOW_IMAGES) {
        throw new Error(MAX_10_IMAGES_ERR);
      }

      // validate caption size
      if (caption.length > MAX_CAPTION_LENGTH) {
        throw new Error(CAPTION_TOO_LONG_ERR);
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
        imageSizes.filter(i => i.type === 'jpg').length === images.length;

      if (!imagesAreJPG) {
        throw new Error(IMAGES_NOT_JPG_ERR);
      }

      // check 1:1 aspect ratio
      const imagesAreOneOne: Boolean =
        imageSizes.filter(i => i.height === i.width).length === images.length;

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
        return createSlideshowResponse.status === 'ok';
      }
      return false;
    } else {
      await this._login();
      await this._setHeaders();
      return await this.createSlideshow(images, caption);
    }
  }

  async _uploadPhoto({ photo }: { photo: string }) {
    // Warning! don't change anything bellow.
    const uploadId = Date.now();

    const file = await fs.readFileSync(photo);

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

  async sleep(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async createReel({
    video_path,
    thumbnail_path,
    caption,
  }: {
    video_path: string;
    thumbnail_path: string;
    caption: string;
  }): Promise<boolean> {
    if (this._validateCookies()) {
      // check if images exists
      let imageSize: Image;
      try {
        imageSize = sizeOf(thumbnail_path);
      } catch (error) {
        throw new Error(THUMBNAIL_NOT_FOUND_ERR);
      }

      // check if jpg
      const imageIsJPG: Boolean = imageSize.type === 'jpg';

      if (!imageIsJPG) {
        throw new Error(THUMBNAIL_NOT_JPG_ERR);
      }

      // check if video exists
      if (!fs.existsSync(video_path)) {
        throw new Error(VIDEO_NOT_FOUND_ERR);
      }

      // validate caption size
      if (caption.length > MAX_CAPTION_LENGTH) {
        throw new Error(CAPTION_TOO_LONG_ERR);
      }

      // Validate video extension
      const video_extension: any = video_path.split('.')[
        video_path.split('.').length - 1
      ];

      if (!VALID_VIDEO_EXTENSION.find(e => e === video_extension)) {
        throw new Error(INVALID_VIDEO_FORMAT);
      }

      // Retrieve video data
      const video_info = await ffprobe(video_path, {
        path: ffprobeStatic.path,
      });
      const { duration, width, height, display_aspect_ratio } = video_info[
        'streams'
      ].filter((i: any) => i.codec_type === 'video')[0];

      if (!VALID_VIDEO_ASPECT_RATIOS.find(a => a === display_aspect_ratio)) {
        throw new Error(INVALID_VIDEO_ASPECT_RATIO);
      }

      try {
        const timestamp = Date.now();
        const request_1_headers = {
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'x-asbd-id,x-ig-app-id',
          origin: 'https://www.instagram.com',
        };
        await this._request({
          uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
          method: 'OPTIONS',
          headers: request_1_headers,
        });

        await this._request({
          uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
          method: 'GET',
        });

        const video_file = fs.readFileSync(video_path);

        const request_3_headers = {
          'x-instagram-rupload-params': JSON.stringify({
            'client-passthrough': '1',
            is_igtv_video: true,
            is_sidecar: '0',
            is_unified_video: '1',
            media_type: 2,
            for_album: false,
            video_format: '',
            upload_id: timestamp,
            upload_media_duration_ms:
              Number(Number(duration).toFixed(3)) * 1000,
            upload_media_height: height,
            upload_media_width: width,
            video_transform: null,
          }),
          'x-entity-name': `fb_uploader_${timestamp}`,
          offset: 0,
          origin: 'https://www.instagram.com',
          'x-entity-length': video_file.byteLength,
          'Content-Length': video_file.byteLength,
        };

        // upload video file
        await this._request({
          uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
          headers: request_3_headers,
          method: 'POST',
          json: false,
          body: video_file,
        });

        const request_4_headers = {
          'access-control-request-method': 'POST',
          'access-control-request-headers':
            'content-type,offset,x-asbd-id,x-entity-length,x-entity-name,x-entity-type,x-ig-app-id,x-instagram-ajax,x-instagram-rupload-params',
          origin: 'https://www.instagram.com',
        };

        await this._request({
          uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
          method: 'OPTIONS',
          headers: request_4_headers,
        });

        await this.sleep(500);
        await this._publishThumbnail(timestamp, thumbnail_path, height, width);

        const wait_time = 60; //sec
        console.info(
          `[InstagramPublisher] - Waiting for video to process (${wait_time} sec)`
        );
        await this.sleep(wait_time * 1000);
        const uploaded_res = await this._publishVideoReel({
          caption,
          upload_id: timestamp,
        });

        const reel_created: boolean = JSON.parse(uploaded_res).status == 'ok';
        console.info(
          `[InstagramPublisher] - Video reel created: ${reel_created}`
        );
        return reel_created;
      } catch (error) {
        throw new Error(
          `[InstagramPublisher] - Failed to create video reel - ${error}`
        );
      }
    } else {
      await this._login();
      await this._setHeaders();
      return await this.createReel({ video_path, thumbnail_path, caption });
    }
  }

  async _publishVideoReel({
    caption,
    upload_id,
  }: {
    caption: string;
    upload_id: number;
  }) {
    const options = {
      method: 'POST',
      url: 'https://www.instagram.com/igtv/configure_to_igtv/',
      headers: {
        'User-Agent': this._useragent,
        Cookie: this._cookies,
        'X-CSRFToken': this._csrftoken,
        origin: 'https://www.instagram.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://www.instagram.com/',
        'x-requested-with': 'XMLHttpRequest',
      },
      form: {
        source_type: 'library',
        caption,
        upload_id,
        disable_comments: '0',
        like_and_view_counts_disabled: '0',
        igtv_share_preview_to_feed: '1',
        is_unified_video: '1',
        video_subtitles_enabled: '0',
      },
    };
    return await request(options);
  }

  async _publishThumbnail(
    upload_id: number,
    image_path: string,
    video_height: number,
    video_width: number
  ) {
    const image_file = fs.readFileSync(image_path);
    const options = {
      method: 'POST',
      url: `${BASE_URL}/rupload_igphoto/fb_uploader_${upload_id}`,
      headers: {
        'User-Agent': this._useragent,
        Cookie: this._cookies,
        origin: 'https://www.instagram.com',
        'Content-Type': 'image/jpeg',
        'Content-Length': image_file.byteLength,
        'x-instagram-rupload-params': `{"media_type":2,"upload_id":"${upload_id}","upload_media_height":${video_height},"upload_media_width":${video_width}}`,
        'x-entity-length': image_file.byteLength,
        'x-entity-type': 'image/jpeg',
        'x-entity-name': `fb_uploader_${upload_id}`,
        offset: 0,
      },
      body: image_file,
    };
    await request(options);
  }
}

module.exports = InstagramPublisher;
