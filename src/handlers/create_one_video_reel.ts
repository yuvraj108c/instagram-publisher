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
import { Image, PostPublished } from '../types';
import fs from 'fs';
import { sleep } from '../shared';
import HTTP_CLIENT from '../http';
import { validateCaption } from './common/validators';
import uploadVideo from './common/upload_video';
import uploadVideoThumbnail from './common/upload_video_thumbnail';

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
    const video_uploaded = await uploadVideo({
      video_duration: duration,
      video_height: height,
      video_width: width,
      video_path,
    });

    await uploadVideoThumbnail({
      video_height: height,
      video_width: width,
      image_path: thumbnail_path,
      video_upload_id: video_uploaded.upload_id,
    });

    console.info(`[InstagramPublisher] - Processing video..`);
    await sleep(15000);

    let retry_count = 0;
    let processed: boolean = false;

    // Retry every 15 seconds until video is processed
    while (retry_count < 5 && processed === false) {
      const uploaded_res = await _publishVideoReel({
        caption,
        upload_id: video_uploaded.upload_id,
      });

      processed = uploaded_res.status == 'ok';

      retry_count++;
      await sleep(15000);
    }

    console.info(`[InstagramPublisher] - Video reel created: ${processed}`);
    return processed;
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
  upload_id: string;
}): Promise<PostPublished> {
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
  return JSON.parse(await request(options));
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
