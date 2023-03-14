import { BASE_URL } from '../../config';
import HTTP_CLIENT from '../../http';
import { PostPublished } from '../../types';
const request = require('request-promise-native');

async function createStory({
  upload_id,
}: {
  upload_id: string;
}): Promise<PostPublished> {
  const options = {
    method: 'POST',
    url: 'https://www.instagram.com/api/v1/web/create/configure_to_story/',
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
    form: { upload_id },
  };
  return JSON.parse(await request(options));
}

export default createStory;
