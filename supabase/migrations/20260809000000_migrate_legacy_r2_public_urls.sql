-- Replace only Wild Soul Club's former R2 development origin. Object keys and
-- unrelated external image URLs remain unchanged.
UPDATE products
SET thumbnail_url = replace(
  thumbnail_url,
  'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/',
  'https://images.wildsoulclub.com/'
)
WHERE thumbnail_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE product_images
SET image_url = replace(image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE product_images
SET transparent_url = replace(transparent_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE transparent_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE categories
SET image_url = replace(image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE collections
SET image_url = replace(image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE drops
SET banner_image_url = replace(banner_image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE banner_image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE hero_sliders
SET image_url = replace(image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';

UPDATE banners
SET image_url = replace(image_url, 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/', 'https://images.wildsoulclub.com/')
WHERE image_url LIKE 'https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev/%';
