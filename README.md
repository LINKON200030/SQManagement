# SQManagement

Business order management system for tracking tasks, assignments, and payments.

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas URI
npm install
npm run dev        # runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000 (local) or your Render URL
npm install
npm run dev        # runs on http://localhost:5173
```

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Create new **Web Service** on render.com
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables: `MONGO_URI`, `PORT`

### Frontend → Vercel

1. Create new project on vercel.com
2. Root directory: `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Keep Backend Alive (Render free tier)

Add a free ping at cron-job.org targeting `https://your-backend.onrender.com/` every 5 minutes.

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | All orders (supports ?assignedTo=&priceStatus=&status=) |
| GET | /api/orders/today | Orders due today |
| GET | /api/orders/upcoming | Orders due after today |
| POST | /api/orders | Create new order |
| PATCH | /api/orders/:id | Update order (status, payment, etc.) |

## Users

Linkon · Raki · Babu · Balli · Johana

---

## Client Galleries

Private, token-gated photo galleries with optional password, watermarked web previews,
full-resolution downloads (toggleable), and a print store backed by Stripe Checkout.
Galleries live entirely inside SQManagement — the public surface is mounted at `/g/*`
and does **not** touch the separate studio website.

### Admin endpoints (gated by `ADMIN_SECRET`, send via `X-Admin-Secret` header)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST   | `/api/admin/galleries` | Create gallery; returns `shareLink` |
| GET    | `/api/admin/galleries` | List galleries |
| GET    | `/api/admin/galleries/:id` | Detail |
| PATCH  | `/api/admin/galleries/:id` | Toggle `downloadEnabled`, `watermarkEnabled`, mark `highlights`, set `expiresAt`, set/clear password |
| DELETE | `/api/admin/galleries/:id` | Removes gallery + best-effort R2 cleanup |
| POST   | `/api/admin/galleries/:id/photos` | `multipart/form-data` field `files` (up to 50, 30 MB each) — server runs sharp to make `web/` (1600px, q82, watermarked if enabled) and stores original at `full/` |
| DELETE | `/api/admin/galleries/:id/photos/:photoId` | Remove single photo |
| GET    | `/api/admin/galleries/:id/orders` | Print orders for this gallery |
| GET/POST/PATCH/DELETE | `/api/admin/print-products` | Manage the print catalogue (the source of truth for checkout prices) |

In `NODE_ENV !== 'production'`, `ADMIN_SECRET` may be left blank — the admin routes
are open locally so you can iterate without setting a header.

### Public endpoints (token-gated, no auth header)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET    | `/g/:token` | HTML gallery (responsive grid, highlights filter, lightbox). If a password is set, returns the password form first. |
| POST   | `/g/:token/unlock` | Form post; sets an HMAC-signed `httpOnly` cookie (~8h) on success |
| GET    | `/g/:token/download/:photoId` | 302 to a fresh 10-minute signed URL for the full-res original. 403 if `downloadEnabled` is false. |
| GET    | `/g/:token/download-all` | Streamed ZIP of every full-res original (store mode — JPEGs don't compress). 403 if `downloadEnabled` is false. |
| POST   | `/g/:token/checkout` | JSON `{ email, items: [{ sku, quantity, photoId? }] }`. Prices are looked up server-side from `PrintProduct` — **client-supplied amounts are ignored**. Returns a Stripe Checkout URL. |

The existing Stripe webhook (`POST /api/stripe/webhook`) branches on `metadata.source === 'gallery'`:
on `checkout.session.completed` it marks the `GalleryOrder` as Paid, records shipping
address + total, decrements stock for `kind: 'physical'` SKUs only (prints are
made-to-order), and logs the customer-confirmation hook for whichever email provider
you wire in.

### Security model — what is and isn't true

**What the system actually protects:**

- **Token unguessability** — 48-hex (192-bit) tokens via `crypto.randomBytes(24)`. Not enumerable.
- **Optional password gate** — bcrypt-hashed; correct entry mints an HMAC-signed `httpOnly`, `SameSite=Lax`, `Secure` (in prod) cookie scoped to that gallery for ~8 hours. No server-side session store needed.
- **Time-limited image URLs** — every photo URL the visitor sees is a freshly signed R2 GET URL with a 10-minute TTL. We never expose the R2 public bucket URL or the `full/` keys in the HTML.
- **Server-built Stripe line items** — the public `/checkout` endpoint looks every SKU up in Mongo and uses *its* `priceMinor`. Client price is dropped on the floor.
- **Admin/public separation** — public routes (`/g/*`) only ever return `clientName`, `shootDate`, the per-photo `_id`/`isHighlight`/`url` triple, and the *active* print catalogue. No admin fields, no `r2KeyFull`, no `passwordHash`, no orders list.
- **Download gating** — `/download/:id` and `/download-all` return 403 unless `downloadEnabled` is true on the gallery; `Cache-Control: no-store` is set on every gallery response.
- **Watermark** — a tiled, semi-transparent diagonal text watermark is composited into the `web/` variant via sharp. The `full/` original is never watermarked; it's only reachable via the gated download routes.

**What we explicitly do NOT promise (be honest about this):**

- **Screenshots are not blocked.** Period. No browser feature can stop them. The
  burned-in watermark is what survives a screenshot.
- The client-side deterrents — disabled context menu, `-webkit-touch-callout: none`, blocked image drag, `user-select: none`, the CSS overlay watermark — are *deterrents only*. They stop casual right-click-save and accidental sharing; they do not stop anyone with DevTools, a phone camera, or a screen recorder.
- 10-minute signed URLs do not stop someone from saving an image they've already loaded.
- If a visitor shares their password or the gallery URL, the cookie protects only their browser session — anyone else who has the URL still hits the password gate, but anyone with the URL **and** the password gets in.

The intent is to make casual leakage friction-y and to make ownership obvious if a
watermarked preview leaks — not to build DRM.

### New env vars (see `.env.example`)

```
ADMIN_SECRET=                 # gates /api/admin/* — header: X-Admin-Secret
GALLERY_COOKIE_SECRET=        # HMAC key for password-cookie; falls back to ADMIN_SECRET
PUBLIC_APP_URL=               # base URL used in shareLink + Stripe success/cancel
GALLERY_WATERMARK_TEXT=       # text burned into web variants and CSS overlay
GALLERY_DELIVERY_MINOR=500    # delivery shipping rate in pence (collection is £0)
R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL
```

Frontend optionally accepts `VITE_ADMIN_SECRET` so the admin tab sets the
`X-Admin-Secret` header automatically.

