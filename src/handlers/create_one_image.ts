import {
  Image,
  LinkablePostPublished,
  LocationSearchRes,
  PostPublished,
} from '../types';
import {
  validateCaption,
  validateImageExists,
  validateImageJPG,
} from './common/validators';
import HTTP_CLIENT from '../http';
import uploadPhoto from './common/upload_photo';
import { BASE_URL } from '../config';
import getLocation from './common/get_location';
import { LOCATION_NOT_FOUND } from '../errors';
const sizeOf = require('image-size');
const request = require('request-promise-native');

async function createSingleImageHandler({
  image_path,
  caption,
  verbose,
  location,
}: {
  image_path: string;
  caption: string;
  verbose: boolean;
  location?: string;
}): Promise<LinkablePostPublished> {
  validateCaption(caption);
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

  const formData: any = {
    source_type: 'library',
    caption,
    upload_id: upload_img_res.upload_id,
    disable_comments: '0',
    like_and_view_counts_disabled: '0',
    igtv_share_preview_to_feed: '1',
    is_unified_video: '1',
    video_subtitles_enabled: '0',
  };

  if (location) {
    try {
      const locationData: LocationSearchRes = await getLocation(location);
      formData.location = JSON.stringify({
        lat: locationData.venues[0].lat,
        lng: locationData.venues[0].lng,
        facebook_places_id: locationData.venues[0].external_id,
      });
      formData.geotag_enabled = true;
    } catch (error) {
      throw new Error(LOCATION_NOT_FOUND);
    }
  }

  const final_res: PostPublished = JSON.parse(
    await request({
      url: `${BASE_URL}/api/v1/media/configure/`,
      method: 'POST',
      headers: request_2_headers,
      form: {
        ...formData,
      },
    })
  );

  if (verbose)
    console.info(
      `[InstagramPublisher] - Image Post Created: ${final_res.status}`
    );

  return { succeeded: final_res.status === 'ok', code: final_res.media.code };
}

export default createSingleImageHandler;
