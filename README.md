# ScrapMate — Doorstep Scrap Collection & Recycling Marketplace

A full-stack MVP: customers schedule scrap pickups, collectors weigh items at the door,
admins manage prices/collectors/pickups, and payments + receipts are recorded end-to-end.

This is an original project (branding, copy, and design created from scratch) — it is not
affiliated with, and does not copy any code, assets, or exact pricing from, any existing
scrap-collection company.

---

## 1. Project overview

Customer flow: register → view scrap rates → schedule a pickup (category → items → quantity
→ estimate → address → date → time → contact → confirm) → track pickup status → collector
weighs items at the door → final amount calculated automatically → payment recorded →
digital receipt.

Admin flow: dashboard stats → manage customers/collectors → assign collectors to pickups →
manage scrap categories/items/prices (with price-change history) → view reports (revenue,
scrap by item) with CSV export.

Collector flow: see assigned pickups → update status through the day → enter actual weights
→ system calculates the final amount from the admin-set rate → mark pickup completed.

## 2. Features

- JWT authentication (httpOnly cookie) with customer / collector / admin roles
- Admin-controlled scrap categories, items, and city-specific price ranges, with full price
  history (old price, new price, changed by, timestamp)
- Multi-step pickup booking wizard with a live estimated-value range
- Pickup status timeline: BOOKED → ASSIGNED → COLLECTOR_ON_THE_WAY → ARRIVED → WEIGHING →
  COMPLETED (or CANCELLED)
- Collector weighing screen: enters actual weight per item, picks min/avg/max rate (rate
  itself is never editable by the collector — it always comes from the admin-set price)
- Payment recording for cash / UPI / bank transfer, plus a Razorpay-shaped flow that
  automatically falls back to a mock order when no Razorpay keys are configured
- Digital receipt per completed pickup
- Admin dashboard with pickup/customer/collector/revenue stats and CSV-exportable reports
- Saved addresses (add/edit/delete/default) for customers
- Seed script with demo admin/collector/customer accounts and realistic starter pricing

## 3. Tech stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, react-hot-toast
**Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, helmet, express-rate-limit
**Database:** MongoDB

## 4. Folder structure

```
scrapmate/
  backend/
    src/
      config/db.js
      models/            # User, Address, ScrapCategory, ScrapItem, ScrapPrice,
                          # PriceHistory, Pickup, Payment
      middleware/         # auth, error handler, validation
      controllers/
      routes/
      utils/               # JWT helpers, ID generators
      seed/seed.js
      app.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      components/          # Navbar, Footer
      layouts/             # MainLayout, DashboardLayout
      pages/                # every screen listed in section 2
      context/AuthContext.jsx
      services/api.js
      routes/ProtectedRoute.jsx
    .env.example
    package.json
  README.md
```

## 5. Installation

Requires Node.js 18+ and a running MongoDB instance (local or Atlas).

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 6. Environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and adjust as needed.

**backend/.env**
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/scrapmate
JWT_SECRET=change_this_dev_secret_key
JWT_EXPIRES_IN=7d
COOKIE_NAME=scrapmate_token
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```
The app runs fully without Cloudinary, Razorpay, or SMTP credentials — those features
fall back to mock behavior (logged to the console) when the keys are missing.

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## 7. MongoDB setup

- **Local:** install MongoDB Community Server and make sure it's running on
  `mongodb://127.0.0.1:27017`.
- **Atlas (cloud, free tier):** create a cluster, get its connection string, and set it as
  `MONGODB_URI` in `backend/.env`.

## 8. Seed the database

```bash
cd backend
npm run seed
```
This clears existing data and creates: an admin account, two collector accounts, one demo
customer, all scrap categories/items/prices from the spec (Normal Recyclables, E-Waste,
Appliances, Vehicle Scrap), a saved address, and one sample pickup.

## 9. Start the backend

```bash
cd backend
npm run dev      # nodemon, auto-restarts on changes
# or: npm start
```
API runs at `http://localhost:5000`. Health check: `GET /api/health`.

## 10. Start the frontend

```bash
cd frontend
npm run dev
```
App runs at `http://localhost:5173`.

## 11. API documentation

All routes are prefixed with `/api`. Protected routes require the auth cookie (or a
`Authorization: Bearer <token>` header).

```
AUTH
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me                       (protected)
POST   /auth/forgot-password

USER
GET    /users/profile                 (protected)
PUT    /users/profile                 (protected)

ADDRESSES (all protected)
GET    /addresses
POST   /addresses
PUT    /addresses/:id
DELETE /addresses/:id

SCRAP (public)
GET    /scrap/categories
GET    /scrap/items?category=
GET    /scrap/rates?city=&search=&category=

PICKUPS (customer, protected)
POST   /pickups
GET    /pickups
GET    /pickups/:id                   (customer/collector/admin can view their own)
PUT    /pickups/:id/cancel

COLLECTOR (collector role only)
GET    /collector/pickups
GET    /collector/pickups/:id
PUT    /collector/pickups/:id/status
PUT    /collector/pickups/:id/weighing
PUT    /collector/pickups/:id/complete

PAYMENTS (protected)
POST   /payments/create
POST   /payments/verify
GET    /payments/:id

ADMIN (admin role only)
GET    /admin/dashboard
GET    /admin/users
PUT    /admin/users/:id/toggle-active
GET    /admin/collectors
POST   /admin/collectors
PUT    /admin/collectors/:id
GET    /admin/pickups
POST   /admin/assign-collector
POST   /admin/scrap-items
PUT    /admin/scrap-items/:id
DELETE /admin/scrap-items/:id
GET    /admin/reports?type=revenue|scrap-by-category|summary
```

## 12. Demo accounts (DEVELOPMENT ONLY — created by the seed script)

| Role      | Email                     | Password       |
|-----------|---------------------------|----------------|
| Admin     | admin@scrapmate.dev       | Admin@123      |
| Collector | collector1@scrapmate.dev  | Collector@123  |
| Collector | collector2@scrapmate.dev  | Collector@123  |
| Customer  | customer@scrapmate.dev    | Customer@123   |

## 13. Deployment instructions

- **Backend:** deploy to Render/Railway/Fly.io/EC2. Set all `backend/.env` variables in the
  host's environment settings. Point `MONGODB_URI` at Atlas for production. Set `CLIENT_URL`
  to your deployed frontend origin so CORS allows it.
- **Frontend:** `npm run build` produces a static `dist/` folder — deploy it to
  Vercel/Netlify/Cloudflare Pages, or serve it behind Nginx. Set `VITE_API_URL` to your
  deployed backend's `/api` URL at build time.
- Use a process manager (PM2) or the platform's built-in process supervision for the
  backend in production, and always set `NODE_ENV=production`.

## 14. Troubleshooting

- **"MongoDB connection error" on startup** — confirm MongoDB is running and `MONGODB_URI`
  is correct. The server still boots so you can fix `.env` without restarting from scratch,
  but every DB-backed route will 500 until it connects.
- **CORS errors in the browser console** — make sure `CLIENT_URL` in `backend/.env` exactly
  matches the URL the frontend is served from (including port).
- **401 on every request after login** — check that cookies are enabled and that
  `frontend`/`backend` are on `localhost` (or the same registrable domain) during
  development, since the auth cookie is httpOnly + sameSite=lax.
- **Rates page is empty** — run `npm run seed` in `backend/`; prices are city-specific, and
  the seed script only populates "Bengaluru".

---

## Known limitations (be upfront about these before treating this as production-ready)

- Payments: cash/UPI/bank transfer are recorded directly; the Razorpay path is architected
  (order creation, verification endpoint, mock fallback) but not wired to the real Razorpay
  SDK — that's a clearly marked integration point in `paymentController.js`.
- Cloudinary image upload, Google Maps/Mapbox address autocomplete, Nodemailer emails, and
  WhatsApp/SMS notifications are represented as mock/placeholder behavior (console logs)
  rather than live integrations, per the "must run locally without paid services" requirement.
- No automated test suite yet.
- Admin category management (create/edit/deactivate categories) and file/photo upload for
  collector pickup evidence are stubbed at the data-model level (fields exist) but don't yet
  have dedicated UI screens.
- Forgot-password is architected (endpoint + no-op mock email) but there's no actual reset
  page yet since no email transport is configured.

## Next recommended development steps

1. Wire the real Razorpay SDK + webhook verification once you have sandbox keys.
2. Add Cloudinary upload for collector pickup-evidence photos.
3. Add admin UI for category CRUD (model + routes already support it).
4. Add integration tests for the booking → weighing → payment flow.
5. Add Google Maps/Mapbox autocomplete to the address step.
6. Add pagination to admin tables (users/pickups) once data volume grows.
