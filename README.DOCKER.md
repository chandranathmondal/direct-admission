Docker quick start

Build and run using docker-compose (reads `.env` for env vars):

```bash
# build and start in background
docker compose up --build -d

# view logs
docker compose logs -f

# stop and remove
docker compose down
```

Run directly with docker (uses .env in current directory):

```bash
docker build -t direct-admission:local .
docker run --rm -d --env-file .env -p 8080:8080 --name direct-admission-local direct-admission:local
```

Notes
- `.env` is ignored by git and `.dockerignore` to avoid leaking secrets. For production use a proper secrets manager.
- If UI appears blank, ensure you built the frontend before starting the server (`npm run build`) or use `docker compose up --build` which runs the build step.

Local development (detailed)

There are two common workflows for local development: "quick iterate" (build+serve) and "live dev" (frontend dev server + backend API).

1) Quick iterate (fast, good for testing the production build locally)

```bash
# install deps once
npm install

# build the frontend and run the Express server that serves the production build
npm run build
npm run start

# open http://localhost:8080
```

2) Live dev (recommended while editing UI)

This runs the Vite dev server for frontend (hot reload) and the backend server for API. Run in two terminals:

Terminal A — frontend dev server (Vite):

```bash
npm install
npm run dev
# opens at http://localhost:3000 (see `vite.config.ts`)
```

Terminal B — backend API server:

```bash
# start backend on port 8080
PORT=8080 node server.js
```

Notes:
- When using the Vite dev server the frontend will be served from port 3000. To have the frontend call the backend API at `/api`, configure a proxy in `vite.config.ts` or call the backend with the full origin `http://localhost:8080/api/...`.
- If you prefer the backend to automatically restart on changes, install `nodemon` as a dev dependency and run `npx nodemon --watch server.js --exec "node server.js"`.

Environment variables and secrets

- The project reads configuration from `.env` (see `.env` in repo). Format is simple KEY=VALUE lines. For values with newlines (for example `GOOGLE_PRIVATE_KEY`), store the key with escaped newlines `\n` and the server will convert them back to real newlines at runtime.
- Example for private key in `.env`:

```bash
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANB...\n-----END PRIVATE KEY-----\n"
```

- For better local secret management, consider using `direnv` or tools like `dotenv-cli` or a secrets manager for production deployments.

Makefile (convenience)

If you work on macOS or Linux, a `Makefile` can simplify common tasks. This repo includes a `Makefile` with targets you can run.

Basic targets:

- `make install` — install npm dependencies (`npm ci`).
- `make build` — run `npm run build`.
- `make start` — build and start the server (production build).
- `make dev` — starts both frontend and backend (note: opens multiple processes in foreground; use separate terminals for long-lived dev).
- `make compose-up` / `make compose-down` — manage docker-compose.
- `make e2e` — run the Playwright E2E tests locally.

Cross-platform note

- Makefiles are great on Unix-like systems. For cross-platform (Windows) teams, prefer npm scripts, `just`, or Node-based task runners (e.g. `npm-run-all`, `concurrently`). npm scripts are already present and are the safest cross-platform option.

Running E2E locally

1. Start the app (either locally or via docker compose):

```bash
# build and start with compose
docker compose up --build -d
```

2. Install dependencies and Playwright browsers locally:

```bash
npm install
npx playwright install
```

3. Run the tests:

```bash
npm run test:e2e
```

Troubleshooting

- Blank UI: ensure `index.html` contains a script tag for the client bundle (`/assets/index-*.js`) or run `npm run build` before `npm run start`.
- Port conflicts: If port 8080 is already used, start the server on a different port via `PORT=3001 npm run start` or stop the process using the port.
- Docker: if you change `.env`, rebuild the image or restart the container (`docker compose up --build`).

Further improvements

- Add a `proxy` section to `vite.config.ts` so the dev server proxies `/api` to the backend automatically.
- Add `nodemon` and a `dev:backend` npm script to auto-reload the server on change.
- For Windows developers, add cross-platform npm scripts or a `justfile` / `taskfile` instead of a Makefile.


CI checks

- The repository contains a CI workflow `.github/workflows/ci-docker.yml` that:
	- builds the Docker image,
	- runs the container,
	- performs a lightweight smoke test against `/api/data`,
	- validates the served `index.html` contains a client bundle and that the bundle is reachable,
	- runs Playwright E2E tests which open the app in Chromium and assert the UI mounts.

Run E2E locally

1. Start your app (either locally or via docker compose):

```bash
# build and start with compose
docker compose up --build -d
```

2. Install dependencies and Playwright browsers locally:

```bash
npm install
npx playwright install
```

3. Run the tests:

```bash
npm run test:e2e
```

Notes
- Playwright will run against `http://localhost:8080` by default as configured in `playwright.config.ts`.
- CI runs the same tests after building the container to ensure both backend and client are served correctly.