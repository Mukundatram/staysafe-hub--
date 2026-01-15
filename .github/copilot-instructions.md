# GitHub Copilot Instructions — staysafe

Purpose: give AI coding agents the essentials to be productive quickly in this repo.

- Architecture summary:
  - Monorepo-like layout: `Backend/` (Node + Express + Mongoose) and `Frontend/` (React SPA created with create-react-app). See [Backend/src/server.js](Backend/src/server.js) for route mounting and static uploads handling.
  - Backend exposes a REST API under `/api/*` (routes live in `Backend/src/routes/`) and serves uploaded assets from `/uploads`.
  - Frontend is a single-page app in `Frontend/src/`. API calls use `Frontend/src/services/api.js` and the CRA proxy to `http://localhost:4000` (see `Frontend/package.json`).

- Quick dev workflows (Windows environment):
  - Backend (dev):
    - `cd Backend`
    - `npm install`
    - `npm run dev` (runs `nodemon src/server.js`; server defaults to port 4000)
  - Backend (prod/start): `npm start` (runs `node src/server.js`)
  - Frontend:
    - `cd Frontend`
    - `npm install`
    - `npm run start` (CRA start — `proxy` points to `http://localhost:4000`)
  - MongoDB: ensure `MONGO_URI` is set in a `.env` file for the backend before starting (see `Backend/src/server.js`).

- Key patterns & conventions found in the codebase:
  - Express routes are grouped by feature in `Backend/src/routes/` (e.g., `authRoutes.js`, `propertyRoutes.js`) and reference models in `Backend/src/models/`.
  - Middleware lives under `Backend/src/middleware/` (auth and upload handling). Use existing middleware to keep consistency.
  - File uploads are served from `/uploads` and stored under `Backend/uploads/` (accessible via `app.use('/uploads', ...)`). When adding new upload endpoints follow the existing `uploadMiddleware.js` pattern.
  - Frontend service layer: most API calls are centralized in `Frontend/src/services/*Service.js` (see `propertyService.js`, `chatbotService.js`). Follow that pattern when adding new REST interactions.
  - State/contexts: auth and wishlist contexts live in `Frontend/src/context/` and are used across pages; prefer using these contexts for shared state instead of ad-hoc prop drilling.

- Integration & cross-component notes:
  - Frontend expects backend on port 4000 (CRA `proxy`), and CORS is currently limited to `http://localhost:3000` in the backend (`Backend/src/server.js`). If running on different ports set both CORS origin and CRA proxy accordingly.
  - Uploaded static assets are referenced by frontend using `/uploads/...` paths; ensure uploads folder permissions and path consistency.
  - Authentication: backend uses JWT tokens (see `jsonwebtoken` in `Backend/package.json`) — check `Backend/src/middleware/authMiddleware.js` and frontend `AuthContext.js` for token handling patterns.

- Things to watch / repo-specific quirks discovered:
  - `Frontend/package.json` contains a Windows-friendly `start` script that sets `NODE_OPTIONS` before starting CRA — keep Windows environment in mind when running scripts.
  - The backend relies on `process.env.MONGO_URI` and `process.env.PORT` — tests or local runs must populate a `.env` file.
  - Route names are pluralized in many places (`/api/bookings`, `/api/properties`) — keep naming consistent when introducing new endpoints.

- How to make safe edits and tests for PRs:
  - Run backend and frontend locally, exercise a small endpoint from `Frontend` using the UI or `curl` to verify behavior.
  - For backend changes that touch models or routes, run manual smoke calls (Postman/Insomnia) and check `uploads/` static serving for file endpoints.

- Examples to reference when coding:
  - Add a new API route: mirror the style in `Backend/src/routes/propertyRoutes.js` and mount in `Backend/src/server.js`.
  - Add a frontend data fetcher: follow `Frontend/src/services/propertyService.js` and call from a page component or context.

If anything above is unclear or you'd like a different focus (tests, CI, or more detailed API examples), tell me which areas to expand and I'll iterate.

- CI / PR guidance (recommended):
  - Goals: run lint, run frontend build, run backend smoke tests, and surface obvious errors early.
  - Secrets & envs: store `MONGO_URI`, `PORT` (if overridden), and any email creds in GitHub Secrets. Use `MONGO_URI` only for integration jobs or use an in-memory mock for unit tests.
  - Linting: add `eslint` and a minimal `.eslintrc.json`. Suggested scripts (add to each `package.json`):
    - Backend: `"lint": "eslint \"src/**/*.{js,jsx}\" --quiet"`
    - Frontend: `"lint": "eslint \"src/**/*.{js,jsx}\" --quiet"`
  - Tests: there are no automated tests currently. CI should at minimum run Frontend tests (`npm --prefix Frontend test -- --watchAll=false`) and a small backend smoke test (supertest).
  - Example GitHub Actions workflows (minimal):
    - `ci-frontend.yml`: checkout, setup Node 18, `npm ci`, `npm run lint` (if present), `npm run build`.
    - `ci-backend.yml`: checkout, setup Node 18, `npm ci`, `npm run lint` (if present), run smoke tests. Use `MONGO_URI` from Secrets for integration tests.
  - PR checklist for maintainers (add as PR template):
    - **Build**: Frontend builds locally: `cd Frontend && npm run build`.
    - **Env**: Document and add Secrets for new env variables.
    - **Routes**: New API endpoints under `Backend/src/routes/` and mounted in [Backend/src/server.js](Backend/src/server.js).
    - **Uploads**: Use `Backend/src/middleware/uploadMiddleware.js` and serve files under `/uploads`.
    - **Security**: No secrets committed; JWT auth via `jsonwebtoken`.
    - **Tests**: Add smoke/unit tests for backend changes where feasible.

If you'd like, I can also scaffold `ci-frontend.yml` and `ci-backend.yml` in `.github/workflows/` with these minimal steps.
