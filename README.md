# KORAX — Web app (epk-front)

The React SPA for [KORAX](https://github.com/iheblhbib/epk-back), an Electronic Press Kit (EPK) SaaS platform — build, theme, and share professional press kits for artists, labels, and agencies. Builds to 100% static files; **no Node.js runtime needed in production**, only a static file host.

> **This repo used to be the `frontend/` folder of a single monorepo.** It's now split into two independent repos: this one (the SPA) and [`epk-back`](https://github.com/iheblhbib/epk-back) (the Laravel API this app talks to). Full architecture and deployment docs — including how the two repos deploy together onto two cPanel subdomains — live in `epk-back`'s [docs/architecture.md](https://github.com/iheblhbib/epk-back/blob/main/docs/architecture.md) and [docs/cpanel-deployment.md](https://github.com/iheblhbib/epk-back/blob/main/docs/cpanel-deployment.md).

## Local development

### 1. Prerequisites

- **Node.js 20+** and npm.
- The [`epk-back`](https://github.com/iheblhbib/epk-back) API running somewhere this app can reach — locally at `http://localhost:8000` by default (see that repo's README for its own setup), or a deployed instance if you're just working on the UI against real data.

### 2. Install and configure

```bash
npm install
cp .env.example .env
```

`VITE_API_URL` in `.env` defaults to `http://localhost:8000`, matching a locally-running `epk-back`. Point it at a different API URL if you're working against a deployed backend instead.

### 3. Run it

```bash
npm run dev
```

The app is now running at `http://localhost:5173`.

### 4. Verify everything works

```bash
npm run build   # proves the app is deployable as static files only — no Node runtime needed
npm run test
npx tsc -b
npm run lint
```

Manual smoke test: register a new account against your `epk-back` instance → check the verification link (printed to that repo's `storage/logs/laravel.log` if it's running with `MAIL_MAILER=log`) → sign in → create a workspace → invite a teammate → check role-based permissions on the Team page.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query, React Hook Form + Zod, Vitest + Testing Library.

`shadcn/ui` is a dev-time code generator only (`npx shadcn add <component>` writes a `.tsx` file into the repo and exits) — it's not a runtime dependency and has no bearing on the "static files only, no Node server" production constraint.

## Deployment

This builds to a static bundle (`npm run build` → `dist/`) meant to be uploaded to its own subdomain (e.g. `app.koraxx.fr` or `epk.karthagopm.com`), separate from the API's subdomain. See `epk-back`'s [docs/cpanel-deployment.md](https://github.com/iheblhbib/epk-back/blob/main/docs/cpanel-deployment.md) for the full topology, `.htaccess` rewrite rule (needed for React Router's client-side routes to survive a direct visit/refresh), and the redeploy process.
