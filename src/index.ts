import createImageSlideshowHandler from './handlers/create_image_slideshow';
import login from './handlers/login';
import createSingleVideoHandler from './handlers/create_one_video';
import HTTP_CLIENT from './http';
import { validateCookies } from './shared';
import createSingleImageHandler from './handlers/create_one_image';
import createImageStoryHandler from './handlers/create_image_story';
import { LinkablePostPublished } from './types';

class InstagramPublisher {
  /** @internal */
  _email: string = '';
  /** @internal */
  _password: string = '';
  /** @internal */
  _verbose: boolean = false;

  constructor({
    email,
    password,
    verbose = false,
  }: {
    email: string;
    password: string;
    verbose?: boolean;
  }) {
    this._email = email;
    this._password = password;
    this._verbose = verbose;
    HTTP_CLIENT.setHeaders();

    if (validateCookies() && this._verbose) {
      console.info(`[InstagramPublisher] - Authenticated: true (cached)`);
    }
  }

  async createSingleImage({
    image_path,
    caption = '',
    location,
  }: {
    image_path: string;
    caption: string;
    location?: string;
  }): Promise<LinkablePostPublished> {
    if (!validateCookies()) {
      await login({
        email: this._email,
        password: this._password,
        verbose: this._verbose,
      });
      HTTP_CLIENT.setHeaders();
    }
    return await createSingleImageHandler({
      image_path,
      caption,
      location,
      verbose: this._verbose,
    });
  }

  async createImageSlideshow({
    images = [],
    caption = '',
    location,
  }: {
    images: string[];
    caption: string;
    location?: string;
  }): Promise<LinkablePostPublished> {
    if (!validateCookies()) {
      await login({
        email: this._email,
        password: this._password,
        verbose: this._verbose,
      });
      HTTP_CLIENT.setHeaders();
    }
    return await createImageSlideshowHandler({
      images,
      caption,
      location,
      verbose: this._verbose,
    });
  }

  async createSingleVideo({
    video_path,
    thumbnail_path,
    caption,
    location,
  }: {
    video_path: string;
    thumbnail_path: string;
    caption: string;
    location?: string;
  }): Promise<LinkablePostPublished> {
    if (!validateCookies()) {
      await login({
        email: this._email,
        password: this._password,
        verbose: this._verbose,
      });
      HTTP_CLIENT.setHeaders();
    }

    return await createSingleVideoHandler({
      video_path,
      thumbnail_path,
      caption,
      is_reel: false,
      location,
      verbose: this._verbose,
    });
  }

  async createReel({
    video_path,
    thumbnail_path,
    caption,
    location,
  }: {
    video_path: string;
    thumbnail_path: string;
    caption: string;
    location?: string;
  }): Promise<LinkablePostPublished> {
    if (!validateCookies()) {
      await login({
        email: this._email,
        password: this._password,
        verbose: this._verbose,
      });
      HTTP_CLIENT.setHeaders();
    }

    return await createSingleVideoHandler({
      video_path,
      thumbnail_path,
      caption,
      is_reel: true,
      location,
      verbose: this._verbose,
    });
  }

  async createImageStory({
    image_path,
  }: {
    image_path: string;
  }): Promise<LinkablePostPublished> {
    if (!validateCookies()) {
      await login({
        email: this._email,
        password: this._password,
        verbose: this._verbose,
      });
      HTTP_CLIENT.setHeaders();
    }

    return await createImageStoryHandler({
      image_path,
      verbose: this._verbose,
    });
  }
}

export default InstagramPublisher;
module.exports = InstagramPublisher;
