import {
  VALID_VIDEO_EXTENSION,
  VALID_VIDEO_ASPECT_RATIOS,
  BASE_URL,
} from '../config';
import {
  THUMBNAIL_NOT_FOUND_ERR,
  THUMBNAIL_NOT_JPG_ERR,
  VIDEO_NOT_FOUND_ERR,
  INVALID_VIDEO_FORMAT,
  INVALID_VIDEO_ASPECT_RATIO,
} from '../errors';
import { Image } from '../types';
import fs from 'fs';
import { sleep } from '../shared';
import HTTP_CLIENT from '../http';
import { validateCaption } from './common/validators';

const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const request = require('request-promise-native');
const sizeOf = require('image-size');

async function createVideoReelHandler({
  video_path,
  thumbnail_path,
  caption,
}: {
  video_path: string;
  thumbnail_path: string;
  caption: string;
}): Promise<boolean> {
  validateCaption(caption);
  _validateImage(thumbnail_path);
  _validateVideo(video_path);

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
      origin: BASE_URL,
    };
    await HTTP_CLIENT.request({
      uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
      method: 'OPTIONS',
      headers: request_1_headers,
    });

    await HTTP_CLIENT.request({
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
        upload_media_duration_ms: Number(Number(duration).toFixed(3)) * 1000,
        upload_media_height: height,
        upload_media_width: width,
        video_transform: null,
      }),
      'x-entity-name': `fb_uploader_${timestamp}`,
      offset: 0,
      origin: BASE_URL,
      'x-entity-length': video_file.byteLength,
      'Content-Length': video_file.byteLength,
    };

    // upload video file
    await HTTP_CLIENT.request({
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
      origin: BASE_URL,
    };

    await HTTP_CLIENT.request({
      uri: `/rupload_igvideo/fb_uploader_${timestamp}`,
      method: 'OPTIONS',
      headers: request_4_headers,
    });

    await sleep(500);
    await _publishThumbnail(timestamp, thumbnail_path, height, width);

    const wait_time = 60; //sec
    console.info(
      `[InstagramPublisher] - Waiting for video to process (${wait_time} sec)`
    );
    await sleep(wait_time * 1000);
    const uploaded_res = await _publishVideoReel({
      caption,
      upload_id: timestamp,
    });

    const reel_created: boolean = JSON.parse(uploaded_res).status == 'ok';
    console.info(`[InstagramPublisher] - Video reel created: ${reel_created}`);
    return reel_created;
  } catch (error) {
    throw new Error(
      `[InstagramPublisher] - Failed to create video reel - ${error}`
    );
  }
}

async function _publishVideoReel({
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
      'User-Agent': HTTP_CLIENT.useragent,
      Cookie: HTTP_CLIENT.cookies,
      'X-CSRFToken': HTTP_CLIENT.csrftoken,
      origin: BASE_URL,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: BASE_URL,
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

async function _publishThumbnail(
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
      'User-Agent': HTTP_CLIENT.useragent,
      Cookie: HTTP_CLIENT.cookies,
      origin: BASE_URL,
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

function _validateImage(image: string) {
  // check if images exists
  let imageSize: Image;
  try {
    imageSize = sizeOf(image);
  } catch (error) {
    throw new Error(THUMBNAIL_NOT_FOUND_ERR);
  }

  // check if jpg
  const imageIsJPG: Boolean = imageSize.type === 'jpg';

  if (!imageIsJPG) {
    throw new Error(THUMBNAIL_NOT_JPG_ERR);
  }
}

function _validateVideo(video_path: string) {
  // check if video exists
  if (!fs.existsSync(video_path)) {
    throw new Error(VIDEO_NOT_FOUND_ERR);
  }

  // Validate video extension
  const video_extension: any = video_path.split('.')[
    video_path.split('.').length - 1
  ];

  if (!VALID_VIDEO_EXTENSION.find(e => e === video_extension)) {
    throw new Error(INVALID_VIDEO_FORMAT);
  }
}

export default createVideoReelHandler;
