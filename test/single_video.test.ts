import { createImage, createVideo, FILES_DIR } from './utils';

const InstagramPublisher = require('../src');
const fs = require('fs');
const {
  THUMBNAIL_NOT_FOUND_ERR,
  VIDEO_NOT_FOUND_ERR,
  INVALID_VIDEO_FORMAT,
  THUMBNAIL_NOT_JPG_ERR,
} = require('../src/errors');
const { MAX_CAPTION_SIZE } = require('../src/config');

const IP = new InstagramPublisher({
  email: '',
  password: '',
});

beforeAll(() => {
  fs.writeFileSync('cookies.json', JSON.stringify([{}]));
});

afterAll(() => {
  fs.rmdirSync(FILES_DIR, { recursive: true });
  fs.unlinkSync('cookies.json', () => {});
});

test('Ensure thumbnail exists', async () => {
  const params = {
    thumbnail_path: './adsf.jpg',
    video_path: createVideo('vid.mp4'),
    caption: 'caption',
  };

  await expect(
    async () => await IP.createSingleVideo(params)
  ).rejects.toThrowError(THUMBNAIL_NOT_FOUND_ERR);
});

test('Ensure video exists', async () => {
  const img_path = await createImage(1000, 1000, `a.jpg`);
  const params = {
    thumbnail_path: img_path,
    video_path: './video_123.mp4',
    caption: 'caption',
  };

  await expect(
    async () => await IP.createSingleVideo(params)
  ).rejects.toThrowError(VIDEO_NOT_FOUND_ERR);
});

test('Ensure video has .mp4 extension', async () => {
  const img_path = await createImage(1000, 1000, `a.jpg`);

  const params = {
    thumbnail_path: img_path,
    video_path: createVideo(`vid.mov`),
    caption: 'Caption',
  };
  await expect(
    async () => await IP.createSingleVideo(params)
  ).rejects.toThrowError(INVALID_VIDEO_FORMAT);
});

test('Ensure caption does not exceed limit', async () => {
  const img_path = await createImage(1000, 1000, `a.jpg`);

  const params = {
    thumbnail_path: img_path,
    video_path: createVideo(`vid.mp4`),
    caption: new Array(MAX_CAPTION_SIZE).join(','),
  };
  await expect(
    async () => await IP.createSingleVideo(params)
  ).rejects.toThrowError(MAX_CAPTION_SIZE);
});

test('Ensure thumbnail is JPG', async () => {
  const img_path = await createImage(1000, 1000, `a.png`);
  const params = {
    thumbnail_path: img_path,
    video_path: createVideo('vid.mp4'),
    caption: 'caption',
  };
  await expect(
    async () => await IP.createSingleVideo(params)
  ).rejects.toThrowError(THUMBNAIL_NOT_JPG_ERR);
});
