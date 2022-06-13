import { MAX_CAPTION_LENGTH, VALID_VIDEO_EXTENSION } from '../../config';
import {
  CAPTION_TOO_LONG_ERR,
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
  INVALID_VIDEO_FORMAT,
  THUMBNAIL_NOT_FOUND_ERR,
  THUMBNAIL_NOT_JPG_ERR,
  VIDEO_NOT_FOUND_ERR,
} from '../../errors';
import { Image } from '../../types';
import fs from 'fs';
const sizeOf = require('image-size');

export function validateCaption(caption: string) {
  if (caption.length > MAX_CAPTION_LENGTH) {
    throw new Error(CAPTION_TOO_LONG_ERR);
  }
}

export function validateImageExists(
  image_path: string,
  isThumbnail: boolean = false
) {
  try {
    sizeOf(image_path);
  } catch (error) {
    throw new Error(
      isThumbnail ? THUMBNAIL_NOT_FOUND_ERR : IMAGES_NOT_FOUND_ERR
    );
  }
}

export function validateImageAspectRatio(image: Image) {
  if (image.height !== image.width) {
    throw new Error(IMAGES_WRONG_ASPECT_RATIO_ERR);
  }
}

export function validateImageJPG(image: Image, isThumbnail: boolean = false) {
  if (image.type !== 'jpg') {
    throw new Error(isThumbnail ? THUMBNAIL_NOT_JPG_ERR : IMAGES_NOT_JPG_ERR);
  }
}

export function validateVideoExists(video_path: string) {
  if (!fs.existsSync(video_path)) {
    throw new Error(VIDEO_NOT_FOUND_ERR);
  }
}

export function validateVideoMp4(video_path: string) {
  const video_extension: any = video_path.split('.')[
    video_path.split('.').length - 1
  ];

  if (!VALID_VIDEO_EXTENSION.find(e => e === video_extension)) {
    throw new Error(INVALID_VIDEO_FORMAT);
  }
}
