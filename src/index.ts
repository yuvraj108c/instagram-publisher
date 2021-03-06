import createImageSlideshowHandler from './handlers/create_image_slideshow';
import login from './handlers/login';
import createSingleVideoHandler from './handlers/create_one_video_reel';
import HTTP_CLIENT from './http';
import { validateCookies } from './shared';
import createSingleImageHandler from './handlers/create_one_image';

class InstagramPublisher {
  /** @internal */
  _email: string = '';
  /** @internal */
  _password: string = '';

  constructor({ email, password }: { email: string; password: string }) {
    this._email = email;
    this._password = password;
    HTTP_CLIENT.setUserAgent(email);
    HTTP_CLIENT.setHeaders();

    if (validateCookies()) {
      console.info(`[InstagramPublisher] - Authenticated: true`);
    }
  }

  async createSingleImage({
    image_path,
    caption = '',
  }: {
    image_path: string;
    caption: string;
  }): Promise<boolean> {
    if (validateCookies()) {
      return await createSingleImageHandler({ image_path, caption });
    } else {
      await login({ email: this._email, password: this._password });
      HTTP_CLIENT.setHeaders();

      return await createSingleImageHandler({ image_path, caption });
    }
  }

  async createImageSlideshow({
    images = [],
    caption = '',
  }: {
    images: string[];
    caption: string;
  }): Promise<boolean> {
    if (validateCookies()) {
      return await createImageSlideshowHandler({ images, caption });
    } else {
      await login({ email: this._email, password: this._password });
      HTTP_CLIENT.setHeaders();

      return await createImageSlideshowHandler({ images, caption });
    }
  }

  async createSingleVideo({
    video_path,
    thumbnail_path,
    caption,
  }: {
    video_path: string;
    thumbnail_path: string;
    caption: string;
  }): Promise<boolean> {
    if (validateCookies()) {
      return await createSingleVideoHandler({
        video_path,
        thumbnail_path,
        caption,
      });
    } else {
      await login({ email: this._email, password: this._password });
      HTTP_CLIENT.setHeaders();

      return await createSingleVideoHandler({
        video_path,
        thumbnail_path,
        caption,
      });
    }
  }
}

export default InstagramPublisher;
module.exports = InstagramPublisher;
