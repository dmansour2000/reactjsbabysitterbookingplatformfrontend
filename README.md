# CareNest Babysitter Booking Frontend

CareNest is a React application built with Vite. The frontend and backend are maintained and deployed from **separate Git repositories**.

## Live website and API

- Frontend (GitHub Pages): [dmansour2000.github.io/reactjsbabysitterbookingplatformfrontend](https://dmansour2000.github.io/reactjsbabysitterbookingplatformfrontend)
- Backend API (Render): [nodejsbabysitterbookingplatformbackend.onrender.com](https://nodejsbabysitterbookingplatformbackend.onrender.com)

The production frontend uses the Render API by default. You can override the API base URL at build time with `VITE_API_BASE_URL`.

## Google AdSense

The frontend loads the standard AdSense script site-wide for Auto ads. In AdSense, add and verify the published site, then enable Auto ads in the site's ad settings. The AMP-only `<amp-auto-ads>` element is not used because this frontend is a regular React site, not an AMP site. Google's standard AdSense script is included in `index.html`, and the publisher record is published as `public/ads.txt`.

The frontend also supports a responsive manual ad unit on the home, about, services, contact, policies, and caregiver search pages. Configure:

- `VITE_ADSENSE_CLIENT` — your AdSense publisher ID (`ca-pub-…`); the current public publisher ID is set as the default.
- `VITE_ADSENSE_SLOT` — the ad unit ID created in AdSense. Manual placements stay hidden until this is set.

Set these values in `.env.local` for local builds. For GitHub Pages, configure them in the environment used to build and deploy the frontend, then redeploy. AdSense account approval and site verification are handled in Google AdSense; the Google OAuth client ID is separate and cannot be used as an AdSense publisher ID. Do not put private keys or passwords in frontend variables.

## Google sign-in

Set the frontend variable to the OAuth client ID from Google Cloud:

- `VITE_GOOGLE_CLIENT_ID` — Google OAuth web client ID. The current client ID is included as a public frontend default. Add `http://localhost:5173` and `https://dmansour2000.github.io` as authorized JavaScript origins in Google Cloud.

Set the matching backend variables in the backend environment:

- `GOOGLE_CLIENT_ID` — same Google web client ID.
For local Vite, set `VITE_GOOGLE_CLIENT_ID` in `.env.local` if you use a different Google client. The backend client ID belongs in backend `.env` locally and in Render's environment settings in production. Never put client secrets in the frontend. Social registration follows the selected account type; babysitter accounts still need to complete their profile and required identity document review before appearing in search.

The caregiver location selector uses the bilingual Egypt governorate and district data from [Open Admin Data](https://github.com/open-admin-data/egypt-administrative-divisions), licensed under CC BY 4.0. Attribution is included in `public/location-data-credit.txt`.

## Run locally

Clone the frontend and backend repositories into separate directories. Install and start the backend using the README and scripts in its repository. The backend needs its own `.env` file with `MONGO_URI` and `JWT_SECRET`; do not commit that file.

From this frontend repository, install dependencies and start Vite:

```sh
npm install
npm run dev
```

During development, the frontend sends API requests to `http://localhost:5170` by default. If your local backend uses a different address, set `VITE_API_BASE_URL` when starting Vite:

```sh
VITE_API_BASE_URL=http://localhost:5170 npm run dev
```

Open the local URL printed by Vite.

For local development, use the Vite URL (usually `http://localhost:5173/`). If you want to serve a production build instead, run:

```sh
npm run build
npm run serve
```

Then open `http://localhost:4173/`. The GitHub Pages subpath is enabled automatically on GitHub Actions builds; local builds use the root path so both Vite preview and the included server work locally.

## Build and preview

Create a production build:

```sh
npm run build
```

Preview the generated `dist/` site locally:

```sh
npm run preview
```

To build against a local backend, set `VITE_API_BASE_URL` for the build:

```sh
VITE_API_BASE_URL=http://localhost:5170 npm run build
```

## Deployment

The frontend repository is published on GitHub Pages at the site linked above. The backend is deployed independently to Render. Frontend deployments should use the Render API URL in production; local API overrides should only be used for local builds and development.

## Search visibility

The public pages have localized titles and descriptions, canonical URLs, social sharing metadata, and Care Nest organization/site structured data. The production build creates static page shells for GitHub Pages routes so they work on direct visits and crawlers can read each page's metadata. `public/robots.txt` points crawlers to `public/sitemap.xml`. After deployment, verify the site in Google Search Console and submit the sitemap at `https://dmansour2000.github.io/reactjsbabysitterbookingplatformfrontend/sitemap.xml`. Search engines decide when and whether to index submitted URLs.

Useful scripts:

- `npm run dev` — start the Vite development server
- `npm run build` — create the static production site in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
