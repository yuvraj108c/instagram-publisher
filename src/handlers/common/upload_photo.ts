import { BASE_URL } from '../../config';
import HTTP_CLIENT from '../../http';
import fs from 'fs';
import { Image, MediaUploadRes } from '../../types';
const sizeOf = require('image-size');

async function uploadPhoto(image_path: string): Promise<MediaUploadRes> {
  const upload_id = Date.now();

  const request_1_headers = {
    'access-control-request-method': 'POST',
    'access-control-request-headers':
      'content-type,offset,x-asbd-id,x-entity-length,x-entity-name,x-entity-type,x-ig-app-id,x-instagram-ajax,x-instagram-rupload-params',
  };
  await HTTP_CLIENT.request({
    uri: `/rupload_igphoto/fb_uploader_${upload_id}`,
    method: 'OPTIONS',
    headers: request_1_headers,
  });

  const image_file = fs.readFileSync(image_path);
  const image_size: Image = sizeOf(image_file);

  const request_2_headers = {
    'x-instagram-rupload-params': JSON.stringify({
      media_type: 1,
      upload_id,
      upload_media_height: image_size.height,
      upload_media_width: image_size.width,
    }),
    'x-entity-name': `fb_uploader_${upload_id}`,
    offset: 0,
    origin: BASE_URL,
    'x-entity-length': image_file.byteLength,
    'Content-Length': image_file.byteLength,
    'Content-Type': 'image/jpeg',
    'x-entity-type': 'image/jpeg',
  };

  // upload video file
  const response: MediaUploadRes = JSON.parse(
    await HTTP_CLIENT.request({
      uri: `/rupload_igphoto/fb_uploader_${upload_id}`,
      headers: request_2_headers,
      method: 'POST',
      json: false,
      body: image_file,
    })
  );

  return response;
}

export default uploadPhoto;
