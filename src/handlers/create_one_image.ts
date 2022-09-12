import { Image, PostPublished } from '../types';
import {
  validateCaption,
  validateImageAspectRatio,
  validateImageExists,
  validateImageJPG,
} from './common/validators';
import HTTP_CLIENT from '../http';
import uploadPhoto from './common/upload_photo';
import { BASE_URL } from '../config';
const sizeOf = require('image-size');
const request = require('request-promise-native');

async function createSingleImageHandler({
  image_path,
  caption,
  verbose,
}: {
  image_path: string;
  caption: string;
  verbose: boolean;
}): Promise<boolean> {
  validateCaption(caption);
  validateImageExists(image_path);

  const image: Image = sizeOf(image_path);
  validateImageJPG(image);
  validateImageAspectRatio(image);

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

  const request_2_headers = {
    'x-asbd-id': '198387',
    'x-ig-app-id': '936619743392459',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': HTTP_CLIENT.useragent,
    Cookie: HTTP_CLIENT.cookies,
    'X-CSRFToken': HTTP_CLIENT.csrftoken,
    origin: BASE_URL,
    Referer: BASE_URL,
  };

  const upload_img_res = await uploadPhoto(image_path);

  const final_res: PostPublished = JSON.parse(
    await request({
      url: `${BASE_URL}/api/v1/media/configure/`,
      method: 'POST',
      headers: request_2_headers,
      form: {
        source_type: 'library',
        caption,
        upload_id: upload_img_res.upload_id,
        disable_comments: '0',
        like_and_view_counts_disabled: '0',
        igtv_share_preview_to_feed: '1',
        is_unified_video: '1',
        video_subtitles_enabled: '0',
      },
    })
  );

  if (verbose)
    console.info(
      `[InstagramPublisher] - Image Post Created: ${final_res.status}`
    );

  return final_res.status === 'ok';
}

export default createSingleImageHandler;
