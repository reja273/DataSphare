<<<<<<< HEAD
# DataSphare

DataSphare is a static learning frontend served by an Express backend. The backend provides account registration/sign-in, persistent community stories, likes, comments, author follows, private stories, and owner-only story updates/deletion.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm --prefix backend install
cp .env.example .env
npm --prefix backend run dev
```

Open `http://localhost:3000`. The backend in `backend/` serves the website from `frontend/` and the API from `/api`. During local development, it uses `backend/data.json` when `MONGODB_URI` is not set. This file is ignored by Git. The first empty database is seeded with a few public example stories; the sample author account has a random password and cannot sign in. Create a normal account through **Join** to publish and engage.

## Production configuration

Set these environment variables in the hosting service:

- `NODE_ENV=production`
- `JWT_SECRET` to a unique random secret of at least 32 characters (48 random bytes is recommended)
- `MONGODB_URI` to a persistent MongoDB connection string
- `PORT` is supplied by most hosting services
- `TRUST_PROXY=1` only when the service runs behind a trusted reverse proxy

Production refuses to start without a strong JWT secret and MongoDB, because a local JSON file on an ephemeral host can lose user data after restarts. The frontend and API are designed to share one origin; configure `CORS_ORIGIN` only if hosting them separately. Never commit `.env`, database credentials, or `backend/data.json`.

## Free showcase hosting

The repository includes a `render.yaml` blueprint for a free Render web service in Singapore. Before creating it, push the project to a GitHub repository and create a MongoDB Atlas free cluster in a nearby region. Connect the repository in Render and provide the Atlas connection string when prompted for `MONGODB_URI`. Render generates `JWT_SECRET` for the service. The Render service installs and runs its Node app from `backend/`; Express serves `../frontend` from the repository checkout. The free web service sleeps after 15 minutes without traffic and may take about a minute to wake; its filesystem is temporary, so MongoDB is required for persistent community data.

## API overview

- `GET /api/health` — service and storage health
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/posts`, `GET /api/posts/:slug`, `POST /api/posts`
- `PUT /api/posts/:id`, `DELETE /api/posts/:id` (author only)
- `POST /api/posts/:id/like`, `POST /api/posts/:id/comments`
- `POST /api/users/:id/follow`

Authenticated requests use `Authorization: Bearer <token>`. Story content is sanitized on the server before storage.
=======
# DataSphare
>>>>>>> 1df67470b1873f2ee7821b574300e4fbebb14052
