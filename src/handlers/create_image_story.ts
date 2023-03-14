import { Image, PostPublished } from '../types';
import { validateImageExists, validateImageJPG } from './common/validators';
import HTTP_CLIENT from '../http';
import uploadPhoto from './common/upload_photo';
import { BASE_URL } from '../config';
const sizeOf = require('image-size');
const request = require('request-promise-native');

async function createImageStoryHandler({
  image_path,
  verbose,
}: {
  image_path: string;
  verbose: boolean;
}): Promise<boolean> {
  validateImageExists(image_path);

  const image: Image = sizeOf(image_path);
  validateImageJPG(image);

  const request_1_headers = {
    'access-control-request-method': 'POST',
    'access-control-request-headers':
      'x-asbd-id,x-csrftoken,x-ig-app-id,x-ig-www-claim,x-instagram-ajax',
  };

  await HTTP_CLIENT.request({
    uri: `/api/v1/media/configure`,
    method: 'OPTIONS',
    headers: request_1_headers,
  });

  const upload_img_res = await uploadPhoto(image_path);

  const formData: any = {
    caption: '',
    upload_id: upload_img_res.upload_id,
  };

  const options = {
    method: 'POST',
    url: 'https://www.instagram.com/api/v1/web/create/configure_to_story/',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1 Instagram 231.0.0.18.113',
      Cookie: HTTP_CLIENT.cookies,
      'X-CSRFToken': HTTP_CLIENT.csrftoken,
      origin: BASE_URL,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: BASE_URL,
      'x-ig-app-id': '1217981644879628',
      'x-asbd-id': '198387',
      'x-frame-options': 'SAMEORIGIN',
    },
    form: { ...formData },
  };
  const final_res: PostPublished = JSON.parse(await request(options));

  if (verbose)
    console.info(
      `[InstagramPublisher] - Image Story Created: ${final_res.status}`
    );

  return final_res.status === 'ok';
}

export default createImageStoryHandler;
