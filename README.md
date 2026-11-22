# RentWorx Server

Express REST API for the RentWorx Equipment Rental Platform.

## Purpose

Provides equipment catalog APIs, JWT verification and role-based authorization, favorites, bookings, Stripe Checkout/webhooks, image upload proxying, and analytics for admin and owner dashboards.

## Live API

<https://rentworx-server.onrender.com/api>

Repository: <https://github.com/shohanurcodes/rentworx-server>

## Key features

- Express 5 + TypeScript + MongoDB/Mongoose
- Health check and explicit production CORS
- JWKS-based JWT verification for BetterAuth tokens
- `verifyToken`, `verifyRenter`, `verifyOwner`, `verifyAdmin`
- Server-side equipment search, filter, sort, and pagination
- Booking pricing and atomic availability reservation
- Stripe Checkout sessions and signed webhooks
- Payments collection and transaction records
- Admin/owner analytics with 6-month booking, revenue, and earnings series
- Cron job that completes paid bookings past their end date (on boot + every 15 minutes)

## npm packages

- `express`, `cors`, `helmet`, `dotenv`
- `mongoose`, `mongodb`
- `zod`, `jose`
- `stripe`
- `node-cron`
- TypeScript, `tsx`, and `@types/*`

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Health check: <http://localhost:5000/api/health>

## Scripts

```bash
npm run dev        # start with tsx watch
npm run build      # compile to dist/
npm run start      # serve compiled output
npm run typecheck  # TypeScript check
npm run seed       # seed admin/owner/sample data
```

## Environment

See [`.env.example`](./.env.example). Never commit real credentials.

In production, `config/env.ts` fails fast if `MONGODB_URI` is missing or if `CLIENT_URL` / `AUTH_JWKS_URL` / `AUTH_ISSUER` / `AUTH_AUDIENCE` still point to localhost.

## Deployment — Render

The included [`render.yaml`](./render.yaml) is a Render Blueprint. Create a Blueprint service from the repository; it builds with `npm ci --include=dev && npm run build`, starts with `npm run start`, and health-checks `/api/health`.

On Render's free tier the service may sleep when idle. The booking job runs once on every boot, so any paid booking that expired while the service was asleep is still finalized.

Set these Render environment values:

```text
MONGODB_URI=<same Atlas cluster as the client>
CLIENT_URL=https://rentworx-client.vercel.app
AUTH_JWKS_URL=https://rentworx-client.vercel.app/api/auth/jwks
AUTH_ISSUER=https://rentworx-client.vercel.app
AUTH_AUDIENCE=https://rentworx-client.vercel.app
STRIPE_SECRET_KEY=<Stripe test key>
STRIPE_WEBHOOK_SECRET=<Stripe webhook secret>
IMGBB_API_KEY=<imgbb key>
ADMIN_EMAIL=faizakhann995@gmail.com
ADMIN_PASSWORD=<strong password>
OWNER_EMAIL=s42226444@gmail.com
OWNER_PASSWORD=<strong password>
```

The Stripe webhook is registered on the test account at `https://rentworx-server.onrender.com/api/payments/webhook` (endpoint `we_1UeY51C6euQJvmFzEA8f0k1S`) for `checkout.session.completed` and `checkout.session.expired`. Its signing secret is stored only in the Render `STRIPE_WEBHOOK_SECRET` env var. If the endpoint is ever recreated, copy its new `whsec_...` secret into Render **and trigger a fresh deploy** — updating the env var alone does not restart the running process.

Seed test accounts:

```text
faizakhann995@gmail.com / Admin123
s42226444@gmail.com / Owner123
renter.part4@rentworx.test / Renter123
```

See also [API_CONTRACT.md](../API_CONTRACT.md).
