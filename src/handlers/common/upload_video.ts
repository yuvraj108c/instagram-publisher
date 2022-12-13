import { BASE_URL } from '../../config';
import HTTP_CLIENT from '../../http';
import * as fs from 'fs';
import { MediaUploadRes } from '../../types';

async function uploadVideo({
  video_path,
  video_height,
  video_width,
  video_duration,
  is_reel = false,
}: {
  video_path: string;
  video_duration: number;
  video_height: number;
  video_width: number;
  is_reel: boolean;
}): Promise<MediaUploadRes> {
  const upload_id = Date.now();

  const request_1_headers = {
    'access-control-request-method': 'GET',
    'access-control-request-headers': 'x-asbd-id,x-ig-app-id',
    origin: BASE_URL,
  };

  await HTTP_CLIENT.request({
    uri: is_reel
      ? `/rupload_igvideo/feed_${upload_id}`
      : `/rupload_igvideo/fb_uploader_${upload_id}`,
    method: 'OPTIONS',
    headers: request_1_headers,
  });

  const video_file = fs.readFileSync(video_path);

  const request_3_headers = is_reel
    ? {
        'x-instagram-rupload-params': JSON.stringify({
          'client-passthrough': '1',
          is_igtv_video: false,
          is_sidecar: '0',
          is_unified_video: false,
          media_type: 2,
          for_album: false,
          upload_id,
          upload_media_duration_ms:
            Number(Number(video_duration).toFixed(3)) * 1000,
          upload_media_height: video_height,
          upload_media_width: video_width,
          video_transform: null,
          video_format: 'video/mp4',
          is_clips_video: true,
          uses_original_audio: true,
          audio_type: 'original_sounds',
        }),
        'x-entity-name': `feed_${upload_id}`,
        offset: 0,
        origin: BASE_URL,
        'x-entity-length': video_file.byteLength,
        'Content-Length': video_file.byteLength,
      }
    : {
        'x-instagram-rupload-params': JSON.stringify({
          'client-passthrough': '1',
          is_igtv_video: true,
          is_sidecar: '0',
          is_unified_video: '1',
          media_type: 2,
          for_album: false,
          video_format: '',
          upload_id,
          upload_media_duration_ms:
            Number(Number(video_duration).toFixed(3)) * 1000,
          upload_media_height: video_height,
          upload_media_width: video_width,
          video_transform: null,
        }),
        'x-entity-name': `fb_uploader_${upload_id}`,
        offset: 0,
        origin: BASE_URL,
        'x-entity-length': video_file.byteLength,
        'Content-Length': video_file.byteLength,
      };

  // upload video file
  const response: MediaUploadRes = JSON.parse(
    await HTTP_CLIENT.request({
      uri: is_reel
        ? `/rupload_igvideo/feed_${upload_id}`
        : `/rupload_igvideo/fb_uploader_${upload_id}`,
      headers: request_3_headers,
      method: 'POST',
      json: false,
      body: video_file,
    })
  );

  return { ...response, upload_id: upload_id.toString() };
}

export default uploadVideo;
