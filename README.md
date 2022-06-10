<p align="center">
  <a href="https://www.npmjs.com/package/instagram-publisher"><img alt="NPM version" src="https://badge.fury.io/js/instagram-publisher.svg"></a>
</p>

# Instagram Publisher

- Create Instagram Slideshows & Reels via NodeJS.
- Inspired by [instagram-web-api](https://www.npmjs.com/package/instagram-web-api)

## Install

```bash
npm install instagram-publisher
```

## Authentication

```js
const InstagramPublisher = require('instagram-publisher');

const client = new InstagramPublisher({
  email: 'email@gmail.com',
  password: '12345',
});
```

## Create Slideshow

```js
const images = ['./cat.jpg', './dog.jpg']; // only local .jpg files
const caption = 'Slideshow caption';

const isSuccess = await client.createSlideshow(images, caption);
```

## Create Video Reel

```js
const reel_data = {
  thumbnail_path: './thumbnail.jpg', // only local .jpg files
  caption: 'Reel caption',
  video_path: './video.mp4', // only local .mp4 files
};

const isSuccess = await client.createReel(reel_data);
```

## Important Notes

- Maximum `10` images are allowed per slideshow
- Minimum `2` images should be provided per slideshow
- Only `.jpg` images are supported for slideshow & thumbnails
- Supported aspect ratio for slideshow images: `1:1`
- Supported reels aspect ratio: `1:1`, `9:16`, `16:9`
- Supported video formats: `.mp4`
- Maximum caption length: `2200` characters
- URL's are not supported
- Cookies are cached under `cookies.json`
- Video reels may take some time to be published [Wait time: 60 seconds]

## License

MIT
