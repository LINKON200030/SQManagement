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
