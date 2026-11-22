# RentWorx API Contract

Base URL: `http://localhost:5000/api` (local) / `https://rentworx-server.onrender.com/api` (production)

## Response shape

```ts
// Success
{
  success: true,
  message: "OK",
  data: ...,
  meta?: { page, limit, total, totalPages }
}

// Error
{
  success: false,
  message: "Unauthorized",
  errors?: ...
}
```

## Auth

The client authenticates with BetterAuth on `/api/auth/*` and sends the resulting JWT to this API:

```http
Authorization: Bearer <jwt>
```

Roles: `customer` (renter), `owner`, `admin`.

Middlewares: `verifyToken`, `verifyRenter`, `verifyOwner`, `verifyAdmin`.

## Public endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | health check |
| GET | `/equipment` | approved equipment, search/filter/sort/paginate |
| GET | `/equipment/featured?limit=6` | featured approved equipment |
| GET | `/equipment/:id` | equipment details |
| GET | `/reviews?limit=4` | approved reviews |

`GET /equipment` query parameters:

```text
search, location, category, rentalType,
minPrice, maxPrice, available,
sort=recent|priceAsc|priceDesc,
page, limit
```

## Customer endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/auth/me` | current user |
| PATCH | `/users/me` | update profile |
| GET | `/favorites` | my favorites |
| POST | `/favorites` | add favorite |
| DELETE | `/favorites/:equipmentId` | remove favorite |
| POST | `/bookings/checkout` | reserve + create Stripe Checkout session |
| GET | `/bookings/my` | my rentals |
| GET | `/bookings/:id/status` | booking/payment status |

## Owner endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/equipment` | add equipment (status: pending) |
| GET | `/equipment/my` | my equipment |
| PATCH | `/equipment/:id` | update my equipment |
| DELETE | `/equipment/:id` | delete my equipment |
| GET | `/bookings/owner` | rentals for my equipment |
| PATCH | `/bookings/:id/status` | confirm/complete/cancel booking |
| GET | `/analytics/owner` | owner analytics |
| POST | `/upload/imgbb` | proxy imgbb upload |

## Admin endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/users` | all users |
| PATCH | `/users/:id/role` | change role |
| PATCH | `/users/:id/manage` | activate/deactivate account |
| DELETE | `/users/:id` | delete user account |
| GET | `/equipment/admin` | all equipment statuses |
| PATCH | `/equipment/:id/status` | approve/reject |
| PATCH | `/equipment/:id` | update equipment |
| DELETE | `/equipment/:id` | delete equipment |
| GET | `/bookings/admin` | all rentals |
| GET | `/analytics/admin` | platform analytics |

## Analytics response fields

Both analytics endpoints include their totals/status counts plus six zero-filled monthly points (oldest → newest, UTC, e.g. `"Nov 26"`):

```ts
monthlyBookings: Array<{ month: string; bookings: number }>
monthlyRevenue:  Array<{ month: string; revenue: number }>   // admin, paid bookings
monthlyEarnings: Array<{ month: string; earnings: number }>  // owner, succeeded payments
```

## Stripe webhook

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/payments/webhook` | finalize booking + save payment |

Handled events: `checkout.session.completed` and `checkout.session.expired`. The webhook route uses `express.raw()` and must be mounted before `express.json()`.
