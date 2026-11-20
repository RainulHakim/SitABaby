# Rent a Baby

A complete React + TypeScript babysitting request app. Warm paper, coral, Fraunces typography, and a tuned dark theme. Grid and spring-based swipe discovery, city search, filters, saved requests, shareable details, a photo crop and compression wizard, and browser-owned edit/delete controls.

## Five-step setup

1. **Install Node.js 22.12+** (or 20.19+) and run `npm install` in this directory.
2. **Run `npm run dev`.** Open the printed URL. With no environment variables, eight realistic requests appear automatically. Photos, edits, saved requests, ownership keys, and reports persist in this browser’s localStorage.
3. **Optional: create a free Supabase project.** Open its SQL editor and run [supabase/schema.sql](supabase/schema.sql). It creates the listings table, indexes, report table, public photo bucket, and anonymous access policies.
4. **Connect shared storage.** Copy `.env.example` to `.env`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your project's URL and public anonymous key (never the service-role key). Restart Vite. Shared mode starts with an empty database; post a request to populate it. Demo requests stay on the original device and are not uploaded automatically.
5. **Check and deploy.** Run `npm test` and `npm run build`. Deploy `dist` to your preferred static host. `npm run preview` serves the production build locally.

## One-click deployment

Push this directory to a GitHub repository. Replace `YOUR_GITHUB_REPOSITORY_URL` below with that repository's HTTPS URL, then open the link. The hosts detect Vite and build `dist` automatically.

- [Deploy with Vercel](https://vercel.com/new/clone?repository-url=YOUR_GITHUB_REPOSITORY_URL)
- [Deploy with Netlify](https://app.netlify.com/start/deploy?repository=YOUR_GITHUB_REPOSITORY_URL)

For shared mode, set both `VITE_` variables in the hosting dashboard **before building**. Without them, the deployed app runs in device-only demo mode. SPA route fallbacks are included for both hosts. Set the `og:image` URL in `index.html` to your final absolute domain URL for social crawlers. A PNG social card and its editable SVG source are bundled.

## How the app works

- `src/lib/data.ts` defines a single `DataAdapter` interface with localStorage and Supabase implementations. Ages are stored in months. Availability stores selected days and time windows; each selected window applies to all selected days. Saved IDs and owner tokens always stay local.
- `src/pages/` contains route-split posting, detail, collection, and information pages; the initial browse route loads immediately. Discover supports touch dragging, buttons, and left/right keyboard arrows. Right saves; left skips.
- Photos are cropped in-browser to 960 × 1200, compressed to WebP, and uploaded to `listing-photos` in shared mode. No image-processing service is involved. Hide face deliberately blurs the entire photo; it does not detect faces. Playroom or toy photos are encouraged.
- Random UUID ownership tokens are sent in the `x-owner-token` header for writes. SQL column permissions prevent anonymous clients from reading or changing ownership tokens. RLS restricts update and delete to the matching token. Losing browser data loses edit access; there is no account recovery. Do not expose tokens in logs or URLs.
- Contact reveal is a UI privacy measure, **not access control**: anonymous database readers can retrieve contact fields. Listings are public and unverified. Do not post sensitive information. No payments or bookings are processed.
- Reports are private rows visible to project administrators in Supabase; demo reports are device-local. There is no moderation queue UI or automatic review service. Administrators should review the table routinely. Public anonymous uploads can attract abuse; configure project quotas and monitor bucket use before a broad launch. Uploaded photos remain in storage when listings are removed, so administrators can clean unused objects separately.
- If Supabase variables exist but the service fails, the app shows an error and retry action; it does not silently switch to a separate device-only dataset. Demo storage failures show actionable messages. Local mode is best for a small number of listings because browser storage is limited.

## Commands

| Command            | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`      | Vite development server                                                       |
| `npm run build`    | Strict TypeScript check and production bundle                                 |
| `npm run preview`  | Preview the production bundle                                                 |
| `npm run test:e2e` | Desktop and 360px mobile browser flows (uses installed Google Chrome)         |
| `npm run format`   | Format the source files                                                       |
| `npm test`         | Data persistence, ownership, filtering helpers, and privacy validation checks |

The app uses React, React Router, Tailwind CSS v4, Framer Motion, Lucide, and `@supabase/supabase-js`; no component kit. Unsplash images and Google Fonts require an internet connection. Replace remote photos with your own assets if you need completely offline visuals. Respect reduced-motion preferences, use the theme toggle for light/dark mode, and see the in-app Safety tips before arranging a sit.
