import { BASE_URL } from '../../config';
import HTTP_CLIENT from '../../http';
import { LocationSearchRes } from '../../types';
const request = require('request-promise-native');

async function getLocation(location: string): Promise<LocationSearchRes> {
  const headers = {
    'x-asbd-id': '198387',
    'x-ig-app-id': '936619743392459',
    'User-Agent': HTTP_CLIENT.useragent,
    Cookie: HTTP_CLIENT.cookies,
    'X-CSRFToken': HTTP_CLIENT.csrftoken,
    origin: BASE_URL,
    Referer: BASE_URL,
  };

  const response: LocationSearchRes = JSON.parse(
    await request({
      url: `${BASE_URL}/api/v1/location_search/?search_query=${location}`,
      method: 'GET',
      headers,
    })
  );

  return response;
}

export default getLocation;
