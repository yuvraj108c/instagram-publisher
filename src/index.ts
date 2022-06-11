import createImageSlideshowHandler from './handlers/image_slideshow';
import login from './handlers/login';
import HTTP_CLIENT from './http';
import { validateCookies } from './shared';

class InstagramPublisher {
  _email: string = '';
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
}

module.exports = InstagramPublisher;
