[![NPM Version](http://img.shields.io/npm/v/instagram-publisher.svg?style=flat)](https://www.npmjs.org/package/Instagram-publisher)
[![NPM Downloads](https://img.shields.io/npm/dm/instagram-publisher.svg?style=flat)](https://npmcharts.com/compare/instagram-publisher?minimal=true)

# Instagram Publisher

- Publish Instagram Images, Image Slideshows & Video Reels via NodeJS.
- Inspired by [instagram-web-api](https://www.npmjs.com/package/instagram-web-api)

## Install

```bash
npm install instagram-publisher
```

## Authentication

```js
import InstagramPublisher from 'instagram-publisher';

const client = new InstagramPublisher({
  email: 'youremail@gmail.com',
  password: '12345',
});
```

## Create Image

```js
const image_data = {
  image_path: './a.jpg',
  caption: 'Image caption',
};
const created = await client.createSingleImage(image_data);
```

## Create Image Slideshow

```js
const slideshow_data = {
  images: ['./a.jpg', './b.jpg'],
  caption: 'Slideshow caption',
};
const created = await client.createImageSlideshow(slideshow_data);
```

## Create Video Reel

```js
const video_data = {
  video_path: './video.mp4',
  thumbnail_path: './thumbnail.jpg',
  caption: 'Reel caption',
};

const created = await client.createSingleVideo(video_data);
```

## Important Notes

- Maximum images per slideshow: `10`
- Minimum images per slideshow: `2`
- Supported images format: `.jpg`
- Supported aspect ratio for slideshow images: `1:1`
- Supported video aspect ratio: `1:1`, `9:16`, `16:9`
- Supported video formats: `.mp4`
- Maximum caption length: `2200` characters
- URL's are not supported. Use local files only
- All methods return a `boolean` value
- Cookies are cached under `cookies.json`
- Videos take some time to be published (< 60 seconds)

## License

MIT
