# RentWorx Server

Express REST API for the RentWorx Equipment Rental Platform.

## Purpose

Provides equipment catalog APIs, JWT verification and role-based authorization, favorites, bookings, Stripe Checkout/webhooks, image upload proxying, and analytics for admin and owner dashboards.

## Live API

`https://<render-service>.onrender.com/api` _(add after deployment)_

## Key features

- Express 5 + TypeScript + MongoDB/Mongoose
- Health check and explicit production CORS
- JWKS-based JWT verification for BetterAuth tokens
- `verifyToken`, `verifyRenter`, `verifyOwner`, `verifyAdmin`
- Server-side equipment search, filter, sort, and pagination
- Booking pricing and atomic availability reservation
- Stripe Checkout sessions and signed webhooks
- Payments collection and transaction records
- Admin/owner analytics and cron booking status updates

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

See also [API_CONTRACT.md](./API_CONTRACT.md).
