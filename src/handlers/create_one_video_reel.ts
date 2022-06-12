import { VALID_VIDEO_ASPECT_RATIOS, BASE_URL } from '../config';
import { INVALID_VIDEO_ASPECT_RATIO } from '../errors';
import { PostPublished } from '../types';
import { sleep } from '../shared';
import HTTP_CLIENT from '../http';
import {
  validateCaption,
  validateImageExists,
  validateImageJPG,
  validateVideoExists,
  validateVideoMp4,
} from './common/validators';
import uploadVideo from './common/upload_video';
import uploadVideoThumbnail from './common/upload_video_thumbnail';

const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const request = require('request-promise-native');
const sizeOf = require('image-size');

async function createSingleVideoHandler({
  video_path,
  thumbnail_path,
  caption,
}: {
  video_path: string;
  thumbnail_path: string;
  caption: string;
}): Promise<boolean> {
  validateCaption(caption);

  validateImageExists(thumbnail_path);
  validateImageJPG(sizeOf(thumbnail_path));

  validateVideoExists(video_path);
  validateVideoMp4(video_path);

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

export default createSingleVideoHandler;
