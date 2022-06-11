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
import HTTP_CLIENT from './http';
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
  constructor({ email, password }: Login) {
    HTTP_CLIENT.setUserAgent(email);
    HTTP_CLIENT.setHeaders();

    if (this._validateCookies()) {
      console.info(`[InstagramPublisher] - Authenticated: true`);
    }
  }

  _validateCookies(): Boolean {
    return fs.existsSync(COOKIES_FILE_PATH);
  }

  async createSlideshow(
    images: string[] = [],
    caption: string = ''
  ): Promise<boolean> {
    if (this._validateCookies()) {
      return await createImageSlideshowHandler(
        images,
        caption,
        HTTP_CLIENT.request
      );
    } else {
      // await this._login();
      HTTP_CLIENT.setHeaders();

      return await createImageSlideshowHandler(
        images,
        caption,
        HTTP_CLIENT.request
      );
    }
  }
}

module.exports = InstagramPublisher;
