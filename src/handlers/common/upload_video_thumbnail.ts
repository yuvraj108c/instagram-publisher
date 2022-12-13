import { BASE_URL } from '../../config';
import HTTP_CLIENT from '../../http';
import * as fs from 'fs';
import { MediaUploadRes } from '../../types';
const request = require('request-promise-native');

async function uploadVideoThumbnail({
  image_path,
  video_upload_id,
  video_height,
  video_width,
  is_reel = false,
}: {
  image_path: string;
  video_upload_id: string;
  video_width: number;
  video_height: number;
  is_reel: boolean;
}): Promise<MediaUploadRes> {
  const request_4_headers = {
    'access-control-request-method': 'POST',
    'access-control-request-headers':
      'content-type,offset,x-asbd-id,x-entity-length,x-entity-name,x-entity-type,x-ig-app-id,x-instagram-ajax,x-instagram-rupload-params',
    origin: BASE_URL,
  };
  await HTTP_CLIENT.request({
    uri: is_reel
      ? `/rupload_igphoto/feed_${video_upload_id}`
      : `/rupload_igphoto/fb_uploader_${video_upload_id}`,
    method: 'OPTIONS',
    headers: request_4_headers,
  });

  const image_file = fs.readFileSync(image_path);
  const options = {
    method: 'POST',
    url: is_reel
      ? `${BASE_URL}/rupload_igphoto/feed_${video_upload_id}`
      : `${BASE_URL}/rupload_igphoto/fb_uploader_${video_upload_id}`,
    headers: {
      'User-Agent': HTTP_CLIENT.useragent,
      Cookie: HTTP_CLIENT.cookies,
      origin: BASE_URL,
      'Content-Type': 'image/jpeg',
      'Content-Length': image_file.byteLength,
      'x-instagram-rupload-params': `{"media_type":2,"upload_id":"${video_upload_id}","upload_media_height":${video_height},"upload_media_width":${video_width}}`,
      'x-entity-length': image_file.byteLength,
      'x-entity-type': 'image/jpeg',
      'x-entity-name': is_reel
        ? `feed_${video_upload_id}`
        : `fb_uploader_${video_upload_id}`,
      offset: 0,
    },
    body: image_file,
  };
  return JSON.parse(await request(options));
}

export default uploadVideoThumbnail;
