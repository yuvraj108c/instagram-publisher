import fs from 'fs';
import {
  MIN_SLIDESHOW_IMAGES,
  MAX_SLIDESHOW_IMAGES,
  MAX_CAPTION_LENGTH,
} from '../config';
import {
  MIN_2_IMAGES_ERR,
  MAX_10_IMAGES_ERR,
  CAPTION_TOO_LONG_ERR,
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
} from '../errors';
import HTTP_CLIENT from '../http';
import { getRandomArbitrary } from '../shared';
import { Image } from '../types';
const sizeOf = require('image-size');

async function createImageSlideshowHandler({
  images = [],
  caption = '',
}: {
  images: string[];
  caption: string;
}) {
  _validateImages(images);
  _validateCaption(caption);

  const photosUploaded = [];
  const errors: String[] = [];

  // upload photos
  for (let idx = 0; idx < images.length; idx++) {
    const photo = images[idx];
    try {
      const uploadResponse = await _uploadPhoto({ photo });
      photosUploaded.push(uploadResponse);
    } catch (error) {
      errors.push(
        `[InstagramPublisher/createSlideshow] - Photo ${photo} not uploaded`
      );
    }
  }

  // create slideshow
  if (photosUploaded.length > 0) {
    const createSlideshowResponse = await _saveSlideshow({
      photosUploaded,
      caption,
    });
    console.info(
      `[InstagramPublisher] - Status: ${createSlideshowResponse.status} (${photosUploaded.length} uploaded, ${errors.length} failed)`
    );
    return createSlideshowResponse.status === 'ok';
  }
  return false;
}

async function _saveSlideshow({ photosUploaded, caption }: any) {
  const payload = {
    caption,
    children_metadata: [...photosUploaded],
    client_sidecar_id: Date.now().toString(),
    disable_comments: '0',
    like_and_view_counts_disabled: false,
    source_type: 'library',
  };

  const requestHeaders = {
    'x-asbd-id': '198387',
    'x-ig-app-id': '936619743392459',
  };

  const uploadResponse = await HTTP_CLIENT.request({
    uri: `/api/v1/media/configure_sidecar/`,
    method: 'POST',
    json: payload,
    headers: requestHeaders,
  });

  return uploadResponse;
}

async function _uploadPhoto({ photo }: { photo: string }) {
  // Warning! don't change anything bellow.
  const uploadId = Date.now();

  const file = await fs.readFileSync(photo);

  const ruploadParams = {
    media_type: 1,
    upload_id: uploadId.toString(),
    upload_media_height: 1080,
    upload_media_width: 1080,
    xsharing_user_ids: JSON.stringify([]),
    image_compression: JSON.stringify({
      lib_name: 'moz',
      lib_version: '3.1.m',
      quality: '80',
    }),
  };

  const nameEntity = `${uploadId}_0_${getRandomArbitrary(
    1000000000,
    9999999999
  )}`;

  const headersPhoto = {
    'x-entity-type': 'image/jpeg',
    offset: 0,
    'x-entity-name': nameEntity,
    'x-instagram-rupload-params': JSON.stringify(ruploadParams),
    'x-entity-length': file.byteLength,
    'Content-Length': file.byteLength,
    'Content-Type': 'application/octet-stream',
    'x-ig-app-id': `1217981644879628`,
    'Accept-Encoding': 'gzip',
    'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
    'X-IG-Connection-Speed': `${getRandomArbitrary(1000, 3700)}kbps`,
    'X-IG-Bandwidth-Speed-KBPS': '-1.000',
    'X-IG-Bandwidth-TotalBytes-B': '0',
    'X-IG-Bandwidth-TotalTime-MS': '0',
  };

  // Json = false, must be important to post work!
  let responseUpload = await HTTP_CLIENT.request({
    uri: `/rupload_igphoto/${nameEntity}`,
    headers: headersPhoto,
    method: 'POST',
    json: false,
    body: file,
  });

  try {
    responseUpload = JSON.parse(responseUpload);

    if ('upload_id' in responseUpload) return responseUpload;

    throw new Error('Image upload error');
  } catch (e) {
    throw new Error(`Image upload error: ${e}`);
  }
}

function _validateCaption(caption: string) {
  if (caption.length > MAX_CAPTION_LENGTH) {
    throw new Error(CAPTION_TOO_LONG_ERR);
  }
}

function _validateImages(images: string[]) {
  if (images.length < MIN_SLIDESHOW_IMAGES) {
    throw new Error(MIN_2_IMAGES_ERR);
  }
  if (images.length > MAX_SLIDESHOW_IMAGES) {
    throw new Error(MAX_10_IMAGES_ERR);
  }

  // check if images exists
  let imageSizes: Image[];
  try {
    imageSizes = images.map(sizeOf);
  } catch (error) {
    throw new Error(IMAGES_NOT_FOUND_ERR);
  }

  // check if jpg
  const imagesAreJPG: Boolean =
    imageSizes.filter(i => i.type === 'jpg').length === images.length;

  if (!imagesAreJPG) {
    throw new Error(IMAGES_NOT_JPG_ERR);
  }

  // check 1:1 aspect ratio
  const imagesAreOneOne: Boolean =
    imageSizes.filter(i => i.height === i.width).length === images.length;

  if (!imagesAreOneOne) {
    throw new Error(IMAGES_WRONG_ASPECT_RATIO_ERR);
  }
}

export default createImageSlideshowHandler;
