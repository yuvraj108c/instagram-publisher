[![NPM Version](http://img.shields.io/npm/v/instagram-publisher.svg?style=flat)](https://www.npmjs.org/package/instagram-publisher)
[![NPM Downloads](https://img.shields.io/npm/dm/instagram-publisher.svg?style=flat)](https://npmcharts.com/compare/instagram-publisher?minimal=true)
[![Issues](https://img.shields.io/github/issues/yuvraj108c/instagram-publisher)](https://github.com/yuvraj108c/instagram-publisher/issues)

# Instagram Publisher

- Publish Instagram Images, Slideshows, Video Reels & Stories via NodeJS.
- Supports Geotagging
- Supports Cookies Caching
- No API key required

## Install

```bash
npm install instagram-publisher
```

## Import

```js
import InstagramPublisher from 'instagram-publisher'; // ES module

const InstagramPublisher = require('instagram-publisher'); // commonJS
```

## Authentication 🔒

```js
const client = new InstagramPublisher({
  email: 'youremail@gmail.com',
  password: '12345',
  verbose: true, // default: false
});
```

## Create Image Post 🖼️

```js
const image_data = {
  image_path: './a.jpg',
  caption: 'Image caption',
  location: 'Chicago, United States', // optional
};
const post_published = await client.createSingleImage(image_data);
```

## Create Image Slideshow 🖼️🖼️🖼️

```js
const slideshow_data = {
  images: ['./a.jpg', './b.jpg'],
  caption: 'Slideshow caption',
  location: 'Chicago, United States', // optional
};
const post_published = await client.createImageSlideshow(slideshow_data);
```

## Create Image Story 🎨

```js
const story_data = {
  image_path: './a.jpg',
};
const post_published = await client.createImageStory(story_data);
```

## Create Video Post 📷

```js
const video_data = {
  video_path: './video.mp4',
  thumbnail_path: './thumbnail.jpg',
  caption: 'Video Post caption',
  location: 'Chicago, United States', // optional
};

const post_published = await client.createSingleVideo(video_data);
```

## Create Reel 📷

```js
const reel_data = {
  video_path: './video.mp4',
  thumbnail_path: './thumbnail.jpg',
  caption: 'Reel caption',
  location: 'Chicago, United States', // optional
};

const post_published = await client.createReel(reel_data);
```

## Getting URL's of posts 🔗

All methods return an object with the published post code: `{ succeeded: true, code: 'CrfNdfjdsfsl' }`. You can generate the URL's as follows:

- Images, Videos & Carousels: https://www.instagram.com/p/ `<code>`
- Reels: https://www.instagram.com/reel/ `<code>`
- Image Story: https://www.instagram.com/stories/ `<your_instagram_username>`/ `<code>`

## Important Notes ⚠️

- Maximum images per slideshow: `10`
- Minimum images per slideshow: `2`
- Supported images format: `.jpg`
- Supported aspect ratio for slideshow images: `1:1`
- Supported video aspect ratio: `1:1`, `9:16`, `16:9`
- Supported video formats: `.mp4`
- Maximum caption length: `2200` characters
- URL's are not supported. Use local files only
- Cookies are cached under `cookies.json`
- Videos take some time to be published (< 60 seconds)
- Enable logging by setting `verbose` flag to true

## Inspiration

- [instagram-web-api](https://www.npmjs.com/package/instagram-web-api)

## License

MIT
