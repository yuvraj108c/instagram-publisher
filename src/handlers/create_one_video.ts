import { VALID_VIDEO_ASPECT_RATIOS, BASE_URL } from '../config';
import { INVALID_VIDEO_ASPECT_RATIO, LOCATION_NOT_FOUND } from '../errors';
import {
  LinkablePostPublished,
  LocationSearchRes,
  PostPublished,
} from '../types';
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
import getLocation from './common/get_location';

const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const request = require('request-promise-native');
const sizeOf = require('image-size');

async function createSingleVideoHandler({
  video_path,
  thumbnail_path,
  caption,
  is_reel,
  location,
  verbose,
}: {
  video_path: string;
  thumbnail_path: string;
  caption: string;
  is_reel: boolean;
  location?: string;
  verbose: boolean;
}): Promise<LinkablePostPublished> {
  validateCaption(caption);

  validateImageExists(thumbnail_path, true);
  validateImageJPG(sizeOf(thumbnail_path), true);

  validateVideoExists(video_path);
  validateVideoMp4(video_path);

  // Retrieve video data
  const video_info = await ffprobe(video_path, {
    path: ffprobeStatic.path,
  });
  const { duration, width, height, display_aspect_ratio } = video_info[
    'streams'
  ].filter((i: any) => i.codec_type === 'video')[0];

  // Display Aspect Ratio is frequently listed as N/A in ffprobe, which manifests
  // as undefined here.
  const is_display_aspect_ratio_missing = display_aspect_ratio == null;

  if (
    !is_display_aspect_ratio_missing &&
    !VALID_VIDEO_ASPECT_RATIOS.find(a => a === display_aspect_ratio)
  ) {
    throw new Error(INVALID_VIDEO_ASPECT_RATIO);
  }

  try {
    const video_uploaded = await uploadVideo({
      video_duration: duration,
      video_height: height,
      video_width: width,
      video_path,
      is_reel,
    });

    await uploadVideoThumbnail({
      video_height: height,
      video_width: width,
      image_path: thumbnail_path,
      video_upload_id: video_uploaded.upload_id,
      is_reel,
    });

    if (verbose) console.info(`[InstagramPublisher] - Processing video..`);
    await sleep(15000);

    let retry_count = 0;
    let processed: boolean = false;
    let uploaded_res: PostPublished = {
      status: 'failed',
      media: { code: '', upload_id: '', status: '', pk: '' },
    };

    // Retry every 15 seconds until video is processed
    while (retry_count < 5 && processed === false) {
      uploaded_res = is_reel
        ? await _publishReel({
            caption,
            upload_id: video_uploaded.upload_id,
            location,
          })
        : await _publishVideo({
            caption,
            upload_id: video_uploaded.upload_id,
            location,
          });

      processed = uploaded_res.status == 'ok';

      retry_count++;
      await sleep(15000);
    }

    if (verbose) {
      console.info(
        is_reel
          ? `[InstagramPublisher] - Reel created: ${processed}`
          : `[InstagramPublisher] - Video post created: ${processed}`
      );
    }
    return { succeeded: processed, code: uploaded_res.media.code };
  } catch (error) {
    throw new Error(`[InstagramPublisher] - Failed to create video - ${error}`);
  }
}

async function _publishVideo({
  caption,
  upload_id,
  location,
}: {
  caption: string;
  upload_id: string;
  location?: string;
}): Promise<PostPublished> {
  const formData: any = {
    source_type: 'library',
    caption,
    upload_id,
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
    form: { ...formData },
  };
  return JSON.parse(await request(options));
}

async function _publishReel({
  caption,
  upload_id,
  location,
}: {
  caption: string;
  upload_id: string;
  location?: string;
}): Promise<PostPublished> {
  const options_1 = {
    method: 'OPTIONS',
    url: 'https://i.instagram.com/api/v1/media/configure_to_clips/',
    headers: {
      authority: 'i.instagram.com',
      accept: '*/*',
      'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8',
      'access-control-request-headers':
        'x-asbd-id,x-csrftoken,x-ig-app-id,x-ig-www-claim,x-instagram-ajax',
      'access-control-request-method': 'POST',
      origin: 'https://www.instagram.com',
      referer: 'https://www.instagram.com/',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'User-Agent': HTTP_CLIENT.useragent,

      'x-frame-options': 'SAMEORIGIN',
    },
  };
  await request(options_1);

  const formData: any = {
    upload_id,
    caption,
    retry_timeout: 12,
    clips_uses_original_audio: 1,
    uses_original_audio: 1,
    original_audio: 1,
    audio: 1,
    clips_audio: 1,
    clips_with_audio: 1,
    with_audio: 1,
    enable_audio: 1,
    clips_enable_audio: 1,
    clips_audio_enable: 1,
    audio_enable: 1,
    audio_type: 'original_sounds',
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
  const options = {
    method: 'POST',
    url: 'https://i.instagram.com/api/v1/media/configure_to_clips/',
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
  return JSON.parse(await request(options));
}

export default createSingleVideoHandler;
