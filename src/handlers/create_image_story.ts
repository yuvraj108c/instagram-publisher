import { Image, LinkablePostPublished, PostPublished } from '../types';
import { validateImageExists, validateImageJPG } from './common/validators';
import HTTP_CLIENT from '../http';
import uploadPhoto from './common/upload_photo';
import createStory from './common/create_story';
const sizeOf = require('image-size');

async function createImageStoryHandler({
  image_path,
  verbose,
}: {
  image_path: string;
  verbose: boolean;
}): Promise<LinkablePostPublished> {
  validateImageExists(image_path);

  const image: Image = sizeOf(image_path);
  validateImageJPG(image);

  const request_1_headers = {
    'access-control-request-method': 'POST',
    'access-control-request-headers':
      'x-asbd-id,x-csrftoken,x-ig-app-id,x-ig-www-claim,x-instagram-ajax',
  };

  await HTTP_CLIENT.request({
    uri: `/api/v1/media/configure`,
    method: 'OPTIONS',
    headers: request_1_headers,
  });

  const upload_img_res = await uploadPhoto(image_path);

  const final_res: PostPublished = await createStory({
    upload_id: upload_img_res.upload_id,
  });

  if (verbose)
    console.info(
      `[InstagramPublisher] - Image Story Created: ${final_res.status}`
    );

  return {
    succeeded: final_res.status === 'ok',
    code: final_res.media.pk,
  };
}

export default createImageStoryHandler;
