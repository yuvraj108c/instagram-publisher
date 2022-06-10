<p align="center">
  <a href="https://www.npmjs.com/package/instagram-publisher"><img alt="NPM version" src="https://badge.fury.io/js/instagram-publisher.svg"></a>
</p>

# Instagram Publisher

- This package allows you to create Instagram Slideshows via NodeJS.
- Inspired by [instagram-web-api](https://www.npmjs.com/package/instagram-web-api)

## Install

```bash
npm install instagram-publisher
```

## Usage

```js
const InstagramPublisher = require('instagram-publisher');

(async () => {
  const client = new InstagramPublisher({
    email: 'email@gmail.com',
    password: '12345',
  });

  const images = ['./cat.jpg', './dog.jpg']; // only local .jpg files
  const caption = 'Slideshow caption';

  await client.createSlideshow(images, caption);
})();
```

## Important Notes

- Maximum `10` images are allowed per slideshow
- Minimum `2` images should be provided
- Only `.jpg` images are supported
- All images must have a `1:1` aspect ratio
- Cookies are cached under `cookies.json`
- URL's are not supported

## License

MIT
