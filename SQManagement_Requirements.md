# SQManagement — Build Requirements for Claude Code

> **For Claude Code Agent:** Build this full-stack web app following the spec below. The **home page layout must match the provided hand-drawn sketch exactly** (see Section 4). Do not redesign the layout — implement what is drawn.

---

## 1. App Purpose

**SQManagement** is a business management web app used to manage orders/tasks and improve communication between a small team of employees. Users create orders, assign them to team members, track payment and completion status, and see what's due today vs. upcoming.

---

## 2. Tech Stack (strict)

**Frontend**
- React (Vite)
- Zustand (state)
- Axios (API calls)
- Tailwind CSS
- shadcn/ui
- React Router

**Backend**
- Node.js + Express
- Mongoose

**Database**
- MongoDB Atlas (free tier)

**Deployment (plan for, don't deploy yet)**
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

---

## 3. Predefined Users (no auth needed)

Hardcode these 5 users in dropdowns (both "Order By" and "Assigned To"):
- Linkon
- Raki
- Babu
- Balli
- Johana

---

## 4. Home Page Layout — MATCH SKETCH EXACTLY

The layout below reflects the hand-drawn wireframe. Preserve this structure.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [LOGO]   Home                                       [Create New Order] │  ← Header (top bar)
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────┐   ┌────────────────┐ │
│  │ Today's Orders                                 │   │ Company Info   │ │
│  │ ─────────────────────────────────────────────  │   │ ─────────────  │ │
│  │ Order Title │ Assigned │ Payment │ Due │ Tag  │   │ Bank Details   │ │
│  │ Demo        │ ...      │ ...     │ ... │ ...  │   │ Upload/demo #  │ │
│  │ Demo        │ ...      │ ...     │ ... │ ...  │   └────────────────┘ │
│  │                                                │                      │
│  │ Upcoming Orders                                │   ┌────────────────┐ │
│  │ ─────────────────────────────────────────────  │   │ Quick Links    │ │
│  │ Date  │ Order Details (headline)               │   │ ─────────────  │ │
│  │ Demo  │ ...                                    │   │ Drive Link     │ │
│  │ Demo  │ Order detail ...                       │   │ Film sending   │ │
│  │                                                │   │ address        │ │
│  │                          [All Orders →]       │   └────────────────┘ │
│  └───────────────────────────────────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layout specifics:
- **Top header bar**: Logo on the far left, "Home" nav label next to logo, **"Create New Order"** button aligned to the **far right**.
- **Main content** is a **2-column layout**:
  - **Left column (wider, ~70%)**: stacks two sections vertically
    1. **Today's Orders** — table/list
    2. **Upcoming Orders** — table/list (shows date + headline preview)
    3. **"All Orders" button** at the bottom-right corner of this column
  - **Right column (narrower, ~30%)**: stacks two small info cards vertically
    1. **Company Info card** — Bank Details, Upload/demo number
    2. **Quick Links card** — Drive Link, Film sending address
- Clean, minimal, table-based. Clear visual separation between Today and Upcoming.

---

## 5. Pages / Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Layout as drawn above |
| `/orders/new` | Create Order | Form (see Section 6) |
| `/orders` | All Orders | Full table of every order with filters |
| `/orders/:id` | Order Detail (optional) | View/edit single order |

---

## 6. Create Order Form

When user clicks **"Create New Order"** → navigate to `/orders/new` with these fields:

| Field | Type | Notes |
|-------|------|-------|
| Order Title | text input | required |
| Order Description | textarea | required |
| Price | number input | required |
| Price Status | dropdown | `Paid` / `Unpaid`, default `Unpaid` |
| Order By | dropdown | Linkon / Raki / Babu / Balli / Johana |
| Assigned To | dropdown | Linkon / Raki / Babu / Balli / Johana |
| Order Tag | dropdown | `Emergency` / `Flexible` |
| Due Date & Time | datetime picker | required |
| Order Created | auto | set on server at creation (do not show in form) |

On submit → POST to `/api/orders` → redirect to `/`.

---

## 7. Today's / Upcoming Order Row Format

Each row in the Today and Upcoming tables shows these columns in order:

```
Order Title | Assigned Person | Payment Status | Due Time | Tag | Completion Status
```

- **Payment Status** shown as colored pill: green=Paid, red=Unpaid
- **Completion Status** shown as colored pill: green=Completed, gray=Not Completed
- **Tag** shown as colored pill: red=Emergency, blue=Flexible
- Clicking a row opens the order detail (or opens an edit modal — your choice, keep it simple)

### Logic:
- **Today's Orders**: `dueDate` is today (same calendar day, user's local time)
- **Upcoming Orders**: `dueDate` is after today
- Sort by due time ascending within each section

---

## 8. All Orders Page (`/orders`)

- Full table of every order (past, today, upcoming)
- Same columns as home page rows + created date
- Filters at the top:
  - Assigned person (dropdown, includes "All")
  - Payment Status (All / Paid / Unpaid)
  - Completion Status (All / Completed / Not Completed)
  - Tag (All / Emergency / Flexible)

---

## 9. Backend API

Base URL: `/api`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/today` | Orders due today |
| GET | `/api/orders/upcoming` | Orders due after today |
| GET | `/api/orders/:id` | Single order |
| PATCH | `/api/orders/:id` | Update status/payment/fields |
| DELETE | `/api/orders/:id` | Delete order |

### Mongoose Schema

```js
{
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  priceStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  orderBy: { type: String, enum: ['Linkon','Raki','Babu','Balli','Johana'], required: true },
  assignedTo: { type: String, enum: ['Linkon','Raki','Babu','Balli','Johana'], required: true },
  tag: { type: String, enum: ['Emergency', 'Flexible'], required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Completed', 'Not Completed'], default: 'Not Completed' },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 10. Folder Structure

```
sqmanagement/
├── frontend/
│   └── src/
│       ├── components/      # Header, OrderTable, OrderRow, StatusPill, InfoCard
│       ├── pages/           # Home, CreateOrder, AllOrders
│       ├── store/           # Zustand store (orders, loading, actions)
│       ├── services/        # axios instance + API calls
│       ├── App.jsx
│       └── main.jsx
└── backend/
    ├── models/Order.js
    ├── routes/orders.js
    ├── controllers/orderController.js
    ├── config/db.js
    └── server.js
```

---

## 11. Environment Variables

**Frontend `.env`**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend `.env`**
```
PORT=5000
MONGO_URI=<mongodb atlas connection string>
```

---

## 12. Implementation Order (follow this)

1. Scaffold backend: Express + Mongoose + Order model + routes + CORS
2. Test API with sample data (seed 5-10 fake orders)
3. Scaffold frontend: Vite + Tailwind + shadcn/ui + router + Zustand store
4. Build **Home page first** — match the sketch layout exactly (2-column grid)
5. Build Create Order form
6. Build All Orders page with filters
7. Wire up status toggles (mark completed, mark paid)
8. Add form validation on both ends
9. Add loading and empty states

---

## 13. Rules for the Agent

- **Do not deviate from the sketch layout.** Left column = orders, right column = info cards. Create New Order button stays top-right.
- Use shadcn/ui components (`Button`, `Table`, `Dialog`, `Input`, `Select`, `Card`).
- Keep it minimal and clean — no gradients, no fancy animations.
- Use `date-fns` for date comparisons (today vs upcoming).
- Handle CORS properly in Express.
- Use async/await everywhere.
- Validate inputs on both frontend and backend.
- No authentication in v1.

---

## 14. Out of Scope (do not build)

- Authentication / login
- Real-time updates (Socket.io)
- Email/push notifications
- File uploads
- Multi-company support

---

**Final goal:** A simple, clean, free-to-host order management app with the exact home layout from the sketch.
