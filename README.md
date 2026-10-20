# CareNest Babysitter Booking Frontend

CareNest is a React application built with Vite. The frontend and backend are maintained and deployed from **separate Git repositories**.

## Live website and API

- Frontend (GitHub Pages): [dmansour2000.github.io/reactjsbabysitterbookingplatformfrontend](https://dmansour2000.github.io/reactjsbabysitterbookingplatformfrontend)
- Backend API (Render): [nodejsbabysitterbookingplatformbackend.onrender.com](https://nodejsbabysitterbookingplatformbackend.onrender.com)

The production frontend uses the Render API by default. You can override the API base URL at build time with `VITE_API_BASE_URL`.

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

Useful scripts:

- `npm run dev` — start the Vite development server
- `npm run build` — create the static production site in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
