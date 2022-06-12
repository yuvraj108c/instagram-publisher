import { MAX_CAPTION_LENGTH } from '../../config';
import {
  CAPTION_TOO_LONG_ERR,
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
} from '../../errors';
import { Image } from '../../types';
const sizeOf = require('image-size');

export function validateCaption(caption: string) {
  if (caption.length > MAX_CAPTION_LENGTH) {
    throw new Error(CAPTION_TOO_LONG_ERR);
  }
}

export function validateImageExists(image_path: string) {
  let image: Image;
  try {
    image = sizeOf(image_path);
  } catch (error) {
    throw new Error(IMAGES_NOT_FOUND_ERR);
  }
}

export function validateImageAspectRatio(image: Image) {
  if (image.height !== image.width) {
    throw new Error(IMAGES_WRONG_ASPECT_RATIO_ERR);
  }
}

export function validateImageJPG(image: Image) {
  if (image.type !== 'jpg') {
    throw new Error(IMAGES_NOT_JPG_ERR);
  }
}
