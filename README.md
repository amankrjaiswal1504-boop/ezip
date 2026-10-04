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
- **Floating widgets on every page** (bottom-right): AI chat assistant + WhatsApp contact
- **ScrapMate Assistant** (AI chat): answers rate questions from the live price list, estimates
  payouts, tracks the logged-in user's pickups, proposes cancel/reschedule (only executed after the
  user presses Confirm), answers from an admin-editable FAQ, English + Hindi/Hinglish, streaming
  replies, and hands off to a human (support ticket + WhatsApp) when asked, when the user is upset,
  or after two unanswered messages. Without an API key it runs as a rule-based bot on the same data.
- **WhatsApp button** with a smart prefilled message (user's name, pickup ID on pickup pages) and
  online/offline status from configured support hours
- **Admin "Chat & Support"**: conversations (filter escalated/unresolved, transcript, mark
  resolved), support tickets, chat analytics (topics, repeated questions, escalation rate), FAQ editor

## 3. Tech stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, react-hot-toast
**Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, helmet, express-rate-limit,
Anthropic SDK (`@anthropic-ai/sdk`) for the chat assistant
**Testing:** Jest, Supertest, mongodb-memory-server (no local MongoDB needed for tests)
**Database:** MongoDB

## 4. Folder structure

```
scrapmate/
  backend/
    src/
      config/db.js
      models/            # User, Address, ScrapCategory, ScrapItem, ScrapPrice,
                          # PriceHistory, Pickup, Payment, ChatSession, ChatMessage,
                          # SupportTicket, Faq
      services/           # rateService, pickupService (shared by controllers + chat)
        chat/             # claudeAgent, tools, systemPrompt, fallbackBot, classifier,
                          # catalog, sanitize, tickets
      middleware/         # auth, error handler, validation
      controllers/
      routes/
      utils/               # JWT helpers, ID generators
      seed/seed.js
      app.js
      server.js
    tests/                 # Jest + Supertest (chat fallback mode, chat AI mode with mocked SDK)
    .env.example
    package.json
  frontend/
    src/
      components/          # Navbar, Footer, FloatingWidgets, chat/ChatPanel, chat/ChatCards
      hooks/               # useChatAssistant (streaming + fallback, history, unread)
      utils/whatsapp.js    # wa.me link + prefilled message builder
      layouts/             # MainLayout, DashboardLayout
      pages/                # every screen listed in section 2
      context/AuthContext.jsx
      services/api.js, services/chatApi.js
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

# AI chat assistant (optional)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5-5
ANTHROPIC_EFFORT=low
ANTHROPIC_FALLBACKS=default
CHAT_RATE_LIMIT_PER_MIN=12

# Support / WhatsApp
SUPPORT_WHATSAPP_NUMBER=
SUPPORT_HOURS_START=9
SUPPORT_HOURS_END=20
SUPPORT_TIMEZONE=Asia/Kolkata
SUPPORT_REPLY_MINUTES=10
DEFAULT_CITY=Bengaluru
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
```
The app runs fully without Cloudinary, Razorpay, SMTP, or Anthropic credentials — those features
fall back to mock behavior (logged to the console) when the keys are missing.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI mode for the chat assistant. Server-side only, never sent to the browser. Without it the widget uses the rule-based bot. |
| `ANTHROPIC_MODEL` | Model ID (default `claude-sonnet-5-5`). |
| `ANTHROPIC_EFFORT` | `low` / `medium` / `high`. Chat replies are short, so `low` keeps them fast and cheap. |
| `ANTHROPIC_FALLBACKS` | `default` enables the API's server-side refusal fallback (Claude API only). Set `off` for a platform or model that rejects it. |
| `CHAT_RATE_LIMIT_PER_MIN` | Messages per minute per logged-in user (or per IP when anonymous). |
| `SUPPORT_WHATSAPP_NUMBER` | Digits with country code, e.g. `919876543210`. Used when the frontend doesn't set `VITE_WHATSAPP_NUMBER`. |
| `SUPPORT_HOURS_*`, `SUPPORT_TIMEZONE`, `SUPPORT_REPLY_MINUTES` | Drive the WhatsApp online/offline dot and the "replies in ~X min" tooltip. |
| `DEFAULT_CITY` | City used for rates when the user has no default address. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Reserved for outgoing WhatsApp Cloud API notifications (Phase 2). Not used yet. |

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_WHATSAPP_NUMBER=
VITE_WHATSAPP_MESSAGE=Hi ScrapMate, I need help with scrap pickup
```
If neither `VITE_WHATSAPP_NUMBER` nor `SUPPORT_WHATSAPP_NUMBER` is set, the WhatsApp button
still works but opens WhatsApp's contact picker with the message prefilled.

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
Appliances, Vehicle Scrap), a saved address, one sample pickup, and the starter FAQs the chat
assistant answers from. It also clears chat conversations and support tickets.

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

### Run the tests

```bash
cd backend
npm test
```
Tests start their own in-memory MongoDB (the first run downloads a MongoDB binary, ~100 MB).
They cover the chat assistant: answers from real DB prices, ownership checks (including inside
tool calls), confirm-gated cancellation, escalation to tickets, SSE streaming, prompt-injection
sanitising, and the Claude tool loop with the SDK mocked (no API key or network needed).

### Try the assistant

Open any page and click the rust chat button (bottom-right). Try: "copper rate", "10 kg
newspaper and 1 fridge" (then **Book this pickup**), "तांबे का भाव", "track my pickup" (log in
as the demo customer first), "cancel SM-2026-000001", or "talk to a human". Then log in as admin
and open **Chat & Support** to see the conversation and ticket.

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

CHAT (public; account tools need login)
GET    /chat/config                   AI/fallback mode, WhatsApp number, support hours
GET    /chat/history                  current conversation (anonymous: per browser session)
DELETE /chat/history                  clear conversation (escalated ones are archived for support)
POST   /chat                          { message, page?, stream? } - SSE stream by default,
                                       JSON when stream=false
POST   /chat/actions/:actionId        (protected) { decision: confirm|dismiss } for a proposed
                                       cancel/reschedule

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
GET    /admin/support/conversations?filter=escalated|unresolved&page=
GET    /admin/support/conversations/:id
PUT    /admin/support/conversations/:id/resolve
GET    /admin/support/tickets?status=open|in_progress|resolved|unresolved&page=
PUT    /admin/support/tickets/:ticketId       { status?, adminNote? }
GET    /admin/support/analytics?days=30
GET    /admin/faqs
POST   /admin/faqs
PUT    /admin/faqs/:id
DELETE /admin/faqs/:id
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
- Automated tests cover the chat assistant only (backend). The booking -> weighing -> payment flow
  and the frontend have no tests yet.
- Chat assistant: AI mode is tested against a mocked SDK, not the live API. Topic analytics use
  keyword classification, so they are approximate. Support hours and the WhatsApp number come from
  env vars; admin-editable settings arrive with the CMS controls.
- The assistant can't create bookings itself; it links into the booking wizard with items
  prefilled. Time slots are a fixed list until admin-configurable slots are added.
- On phones the floating buttons sit over page content while scrolling (the page gets extra bottom
  padding so nothing is permanently hidden).
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
