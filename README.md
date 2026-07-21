This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Wild Soul Club setup

Wild Soul Club uses Next.js 16, Supabase Auth, Supabase Postgres, and Cloudflare R2.

### Environment variables

Set these values in both `.env.local` and Vercel Project Settings:

```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Optional fallback if you use Supabase publishable keys instead of anon keys
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=wildsoulclub
R2_PUBLIC_BASE_URL=your_public_r2_base_url
S3_ENDPOINT=your_r2_s3_endpoint
API_TOKEN=your_cloudflare_api_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Wild Soul Club
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the preferred browser key. If your Supabase dashboard only gives you a publishable key, set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` too; the app will use it as a fallback.

### Database setup

Run `src/db/schema.sql` in the Supabase SQL editor. The schema stores structured shop data in Supabase and stores image/object references as Cloudflare R2 URLs and object keys.

Supabase Auth users are mirrored into the public `users` table by the `handle_new_auth_user()` trigger. To make your first admin, sign up once, copy your auth user UUID from Supabase Auth, then run:

```sql
insert into admins (user_id, role, permissions)
values ('YOUR_AUTH_USER_UUID', 'super_admin', '["*"]'::jsonb)
on conflict (user_id) do update set role = excluded.role, permissions = excluded.permissions;
```

### Development checks

```bash
npm run dev
npm run build
npm run lint
```
