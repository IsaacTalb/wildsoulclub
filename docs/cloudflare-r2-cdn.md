# Cloudflare R2 image CDN setup

The storefront is designed to serve public catalog images directly from an R2
custom domain. Vercel remains the application origin; the image hostname is a
separate Cloudflare/R2 origin. This avoids putting a second proxy in front of
Vercel while still using Cloudflare's CDN for image delivery.

## Cloudflare setup

1. In **R2 > wildsoulclub > Settings > Custom Domains**, connect a dedicated
   hostname such as `images.example.com`. Use the R2 custom-domain flow rather
   than creating a DNS record that points at the Vercel application.
2. Keep the bucket's `r2.dev` development URL disabled after the custom domain
   works. The custom domain is the public read surface; S3 credentials remain
   server-only and must never be exposed in `NEXT_PUBLIC_*` variables.
3. Add the following bucket CORS policy, replacing the two example origins with
   the production and preview/admin origins that perform browser uploads:

   ```json
   [
     {
       "AllowedOrigins": ["https://example.com", "https://www.example.com"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type", "cache-control"],
       "ExposeHeaders": ["etag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. Cloudflare caches cacheable files requested through an R2 custom domain.
   The application writes `Cache-Control: public, max-age=31536000,
   s-maxage=31536000, immutable` on new public images. A Cache Rule is optional;
   if one is created, scope it only to the image hostname and set **Cache
   eligibility: Eligible for cache**. Do not use "Cache Everything" on the
   Vercel application hostname.
5. Optional: enable Tiered Cache for the image hostname. Do not enable a rule
   that strips query strings from Next.js `/_next/image` requests on the app
   hostname because width and quality are encoded in that query string.

## Vercel environment

Set these variables for Production and every Preview environment that should
display R2 images, then redeploy (the image allowlist is read at build time):

```dotenv
R2_PUBLIC_BASE_URL=https://images.example.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=wildsoulclub
```

`R2_PUBLIC_BASE_URL` must contain only the origin—no bucket path and no trailing
slash. Existing database rows that contain an `object_key` are automatically
rendered with this hostname; no URL migration is required. Rows that contain
only a stale absolute `image_url` should be repaired by restoring their R2
`object_key`, since an arbitrary old URL cannot reliably be mapped back to an
object.

## Verify and troubleshoot

Use a real object key in these commands:

```bash
curl -I https://images.example.com/products/OBJECT.jpg
curl -I 'https://example.com/_next/image?url=https%3A%2F%2Fimages.example.com%2Fproducts%2FOBJECT.jpg&w=640&q=75'
```

The direct response should be `200`, have the correct image `Content-Type`, and
eventually show `CF-Cache-Status: HIT` after repeated requests. The optimized
response should also be `200` and should never redirect to an expiring
`r2.cloudflarestorage.com` URL.

If signed-in users see an image while signed-out users do not, inspect the
failed image request rather than changing Supabase row-level security. A `403`
from the image hostname means the R2 custom domain is not serving that bucket;
a CORS browser error on `PUT` means the bucket CORS origins/headers are wrong;
a `400` from `/_next/image` usually means `R2_PUBLIC_BASE_URL` was absent or
different during the Vercel build. When the public base URL is deliberately
unset, `/api/public/images/<key>` is the authenticated-server fallback and now
streams a cacheable object instead of returning an expiring redirect.

Objects uploaded before this change may lack the cache metadata. They will
still work, but either re-upload them (which creates a new UUID URL), copy them
onto themselves with the desired metadata, or apply a hostname-scoped
Cloudflare Cache Rule.
