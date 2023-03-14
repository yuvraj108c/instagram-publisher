import { createImage, FILES_DIR, getRandomString } from './utils';
import InstagramPublisher from '../src';

const fs = require('fs');
const { IMAGES_NOT_FOUND_ERR, IMAGES_NOT_JPG_ERR } = require('../src/errors');

const IP = new InstagramPublisher({
  email: '',
  password: '',
});

beforeAll(() => {
  fs.writeFileSync(
    'cookies.json',
    JSON.stringify([
      {
        key: 'sessionid',
        expires: new Date('2100-09-11T12:56:18.000Z').toISOString(),
      },
    ])
  );
});

afterAll(() => {
  fs.rmdirSync(FILES_DIR, { recursive: true });
  fs.unlinkSync('cookies.json', () => {});
});

test('Ensure image exists locally', async () => {
  const image_path =
    'https://kgo.googleusercontent.com/profile_vrt_raw_bytes_1587515358_10512.png';

  await expect(
    async () => await IP.createSingleImage({ image_path, caption: 'caption' })
  ).rejects.toThrowError(IMAGES_NOT_FOUND_ERR);
});

test('Ensure image is JPG', async () => {
  const image_path = await createImage(1000, 1000, `${getRandomString()}.png`);

  await expect(
    async () => await IP.createSingleImage({ image_path, caption: 'caption' })
  ).rejects.toThrowError(IMAGES_NOT_JPG_ERR);
});
