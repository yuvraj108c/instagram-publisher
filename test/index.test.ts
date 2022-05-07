const InstagramPublisher = require('../src');
const sharp = require('sharp');
const fs = require('fs');
const {
  MIN_2_IMAGES_ERR,
  MAX_10_IMAGES_ERR,
  IMAGES_NOT_FOUND_ERR,
  IMAGES_NOT_JPG_ERR,
  IMAGES_WRONG_ASPECT_RATIO_ERR,
  LOGIN_ERR,
} = require('../src/errors');

const IP = new InstagramPublisher({
  email: '',
  password: '',
});

const IMG_DIR = 'images/';

test('Validate login credentials', async () => {
  const client = new InstagramPublisher({
    email: 'sdfdsf@gmail.com',
    password: 'sdfdfds32423sfds',
  });
  await expect(
    async () => await client.createSlideshow(['2.jpg', '1.jpg'], 'caption')
  ).rejects.toThrowError(LOGIN_ERR);
  fs.writeFileSync('cookies.json', JSON.stringify([]));
});

test('Ensure atleast 2 images are provided', async () => {
  const images = ['./a.jpg'];

  await expect(
    async () => await IP.createSlideshow(images, 'caption')
  ).rejects.toThrowError(MIN_2_IMAGES_ERR);

  await expect(async () => await IP.createSlideshow()).rejects.toThrowError(
    MIN_2_IMAGES_ERR
  );
});

test('Ensure max 10 images are provided', async () => {
  const images = new Array(11);

  await expect(
    async () => await IP.createSlideshow(images, 'caption')
  ).rejects.toThrowError(MAX_10_IMAGES_ERR);
});

test('Ensure all images exists', async () => {
  const images = ['./1.jpg', './2.jpg'];
  await expect(
    async () => await IP.createSlideshow(images, 'caption')
  ).rejects.toThrowError(IMAGES_NOT_FOUND_ERR);
});

test('Ensure all images are JPG', async () => {
  const images: string[] = [];

  if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
  }

  for (let i = 0; i < 3; i++) {
    await createImage(1000, 1000, `${i}.jpg`);
    images.push(`${IMG_DIR}/${i}.jpg`);
  }
  await createImage(1000, 1000, `${3}.png`);
  images.push(`${IMG_DIR}/${3}.png`);

  await expect(
    async () => await IP.createSlideshow(images, 'caption')
  ).rejects.toThrowError(IMAGES_NOT_JPG_ERR);

  fs.rmdirSync(IMG_DIR, { recursive: true });
});

test('Ensure all images with aspect ratio 1:1', async () => {
  const images: string[] = [];

  if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
  }

  for (let i = 0; i < 3; i++) {
    await createImage(1000, 1000, `${i}.jpg`);
    images.push(`${IMG_DIR}/${i}.jpg`);
  }
  await createImage(200, 1000, `${3}.jpg`);
  images.push(`${IMG_DIR}/${3}.jpg`);

  await expect(
    async () => await IP.createSlideshow(images, 'caption')
  ).rejects.toThrowError(IMAGES_WRONG_ASPECT_RATIO_ERR);

  fs.rmdirSync(IMG_DIR, { recursive: true });
  fs.rmSync('cookies.json', { force: true });
});

async function createImage(w: number, h: number, n: string) {
  const svgImage = `
  <svg width="${w}" height="${h}">
  </svg>
  `;
  const svgBuffer = Buffer.from(svgImage);
  await sharp(svgBuffer).toFile(`${IMG_DIR}/${n}`);
}
