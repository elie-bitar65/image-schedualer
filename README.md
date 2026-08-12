# Image Scheduler V1

This first version stores:

- one BMP image as Base64
- one schedule containing only a list of `HH:MM` times

The public retrieval endpoint is:

`GET /api/config`

Example response:

```json
{
  "image": "data:image/bmp;base64,Qk...",
  "schedule": ["08:00", "12:00", "18:30"],
  "updatedAt": "2026-08-11T..."
}
```

## 1. Create a free Supabase project

Create a Supabase project.

Open the SQL Editor and run the contents of `supabase.sql`.

Then collect:

- Project URL
- service_role key

Keep the service_role key private. Never put it into browser-side JavaScript.

## 2. Test locally

Install Node.js 18+.

Copy `.env.example` values into your environment, then run:

```bash
npm install
npm start
```

Open:

`http://localhost:3000`

## 3. Deploy

Deploy this folder as a Node web service.

Set these environment variables on the hosting service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Build command:

`npm install`

Start command:

`npm start`

After deployment:

- Admin page: `https://YOUR-SITE/`
- Public API: `https://YOUR-SITE/api/config`

## Important

The API endpoint is public by design so a device can retrieve the image and schedule without logging in.

The upload/save endpoint requires the admin password.

For this first version, keep the BMP reasonably small because the image is returned as Base64 inside JSON.


image to schdualer v2
# EPD Image Scheduler V2

Run `supabase_v2.sql` once in Supabase SQL Editor, then deploy on Render with the same environment variables as V1.

Modes: BW 1bpp, generic BWR/BWY dual-plane 1bpp, generic 7-color indexed 4bpp.

Important: colored EPD packing is controller-specific; verify against your panel sample code.

