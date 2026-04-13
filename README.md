# The Chase

A gamified research instrument exploring Gen Z attitudes toward AI involvement in dating and romantic relationships. Participants swipe through scenario-based vignettes that progressively introduce AI into the dating process, from AI-curated matching to AI-generated messages sent without consent.

Built as a full-stack web application with a swipe-card interface, narrative-driven phases, and a researcher dashboard for real-time analytics.

## Table of Contents

- [Research Design](#research-design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Admin Dashboard](#admin-dashboard)
- [Deployment](#deployment)

---

## Research Design

### Participant Journey

| Phase | Name | Description |
|-------|------|-------------|
| 0 | **About You** | Optional demographics (age, gender, university, state) + informed consent |
| 1 | **Your Story** | 10 cards about past dating app experiences (baseline) |
| 2 | **The World Has Changed** | Narrative context: it's 2026 and AI is now embedded in dating |
| 3 | **The Chase** | 10 stages x 8 cards each (80 vignettes) with escalating AI involvement |
| 4 | **Debrief** | 12 reflection questions + optional researcher discussion signup |

### Phase 3 Stages

Each stage presents a scenario vignette followed by 8 swipe cards:

1. **The Voice That Knows You** - AI voice onboarding
2. **The Text You Did Not Expect** - AI-curated text introductions
3. **The Gathering** - AI-arranged group meetups
4. **The Simulation** - AI compatibility simulation (pre-date preview)
5. **The Date Someone Else Planned** - Fully AI-planned dates
6. **The Coach in Your Pocket** - Real-time AI conversation coaching
7. **The Message You Did Not Write** - AI sends messages without permission
8. **After the Date** - AI post-date data collection and learning
9. **The Connection Compared** - Traditional apps vs AI platforms
10. **The Reveal** - AI chatfishing detection

### Data Collected

- **Swipe direction** (right = accept/comfortable, left = reject/uncomfortable)
- **Response time** in milliseconds (hesitation proxy)
- **Demographics** (optional: age, gender, university, state)
- **Contact info** (optional: email, phone for follow-up discussions)
- All sessions are anonymous by default (identified by 8-character session code)

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** (styling)
- **Framer Motion** (swipe gestures and animations)
- **Zustand** (state management with localStorage persistence)
- **Recharts** (research analytics charts)
- **Radix UI** (accessible dropdowns)

### Backend
- **FastAPI** (async Python API)
- **SQLAlchemy** (async ORM with asyncpg driver)
- **PostgreSQL 16** (database)
- **Pydantic** (request/response validation)

### Infrastructure
- **Docker Compose** (local development)
- Recommended: **Vercel** (frontend) + **Render** (backend) + **Neon** (database)

---

## Project Structure

```
vignette-AI-Dating/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app setup, CORS, lifespan
│   │   ├── config.py            # Settings (database URL, admin secret)
│   │   ├── database.py          # SQLAlchemy async engine and session
│   │   ├── models/
│   │   │   └── models.py        # Participant and Response ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   └── routes/
│   │       └── participants.py  # All API endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── consent/page.tsx          # Informed consent
│   │   │   ├── session/[code]/page.tsx   # Main study interface
│   │   │   └── admin/
│   │   │       ├── page.tsx              # Redirect (security)
│   │   │       └── [slug]/
│   │   │           ├── layout.tsx        # Password gate
│   │   │           ├── page.tsx          # Dashboard
│   │   │           └── charts/page.tsx   # Analytics charts
│   │   ├── components/
│   │   │   ├── SwipeCard.tsx             # Drag-to-swipe card
│   │   │   └── ComboBox.tsx             # Glass-effect dropdown
│   │   └── lib/
│   │       ├── api.ts                    # Typed API client
│   │       ├── store.ts                  # Zustand session store
│   │       └── instrument.ts            # Study content (all phases, stages, cards)
│   ├── package.json
│   ├── Dockerfile
│   └── next.config.ts
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 16 (or Docker)

### Option 1: Docker Compose (recommended)

```bash
docker compose up --build
```

This starts all three services:
- **Frontend** at http://localhost:3000
- **Backend** at http://localhost:8000
- **PostgreSQL** on port 5432

### Option 2: Manual Setup

**Database:**
```bash
# Create the database
createdb chase
# Or with Docker:
docker run -d --name chase-db \
  -e POSTGRES_USER=chase \
  -e POSTGRES_PASSWORD=chase_dev_password \
  -e POSTGRES_DB=chase \
  -p 5432:5432 postgres:16-alpine
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 to start.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) | `postgresql+asyncpg://chase:chase_dev_password@localhost:5432/chase` |
| `ADMIN_SECRET` | Password for admin dashboard access | `chase-research-2026` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_ADMIN_SLUG` | Secret URL slug for admin pages | `r9k4x7m2b8f1n5p3q6w0t4v8` |

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/participants` | Create new participant session |
| `GET` | `/api/participants/{code}` | Get participant by session code |
| `PATCH` | `/api/participants/{code}/demographics` | Update demographics + consent |
| `PATCH` | `/api/participants/{code}/progress` | Update current phase/stage |
| `PATCH` | `/api/participants/{code}/contact` | Update email/phone |
| `POST` | `/api/participants/{code}/swipe` | Record a swipe response |
| `GET` | `/api/participants/{code}/responses` | Get all responses for participant |

### Admin Endpoints (require `X-Admin-Key` header)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/verify` | Verify admin password |
| `GET` | `/api/admin/participants` | List all participants |
| `GET` | `/api/admin/participants/{code}` | Get participant with responses |
| `GET` | `/api/admin/stats` | Aggregated statistics |
| `GET` | `/api/admin/export` | Export all data as JSON |

---

## Admin Dashboard

The researcher dashboard is protected by two layers:

1. **Secret URL slug** - The admin pages live at `/admin/{slug}` where the slug is a long random string. Visiting `/admin` alone redirects to home.
2. **Password gate** - After reaching the correct URL, researchers must enter the admin password. The key is stored in `sessionStorage` (cleared when the browser tab closes).

### Accessing the Dashboard

1. Navigate to `/admin/r9k4x7m2b8f1n5p3q6w0t4v8` (or your custom slug)
2. Enter the admin password (`chase-research-2026` by default)
3. View participant data, stats, individual responses, and charts
4. Export data as CSV for external analysis

### Analytics Charts

The charts page includes 9 research-focused sections:

1. **Participant Demographics** - Gender, phase distribution, universities, states, signups over time
2. **Phase 1 Baseline** - Accept/reject rates per dating history card
3. **AI Comfort Trajectory** - Acceptance rate across escalating AI involvement stages
4. **Ethical Threshold Analysis** - Key boundary cards (consent, safety, autonomy, deception)
5. **Hesitation Analysis** - Response time as uncertainty proxy (accept vs reject)
6. **Gender Comparison** - Male vs female acceptance across stages
7. **Baseline Correlation** - Phase 1 agreement vs Phase 3 AI acceptance
8. **Participant Retention** - Dropoff tracking across stages
9. **Per-Stage Card Breakdown** - All 8 cards for each of 10 stages

---

## Deployment

### Recommended Stack (Free Tier)

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | Next.js hosting with edge network |
| Backend | [Render](https://render.com) | FastAPI web service |
| Database | [Neon](https://neon.tech) | Serverless PostgreSQL |

### Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_ADMIN_SLUG` = your chosen slug

### Render (Backend)

1. Create a new Web Service from your GitHub repo
2. Set root directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `ADMIN_SECRET` = your admin password

### Neon (Database)

1. Create a free project at neon.tech
2. Copy the connection string (use the asyncpg/pooled format)
3. Set it as `DATABASE_URL` in your backend environment

---

## Security Notes

- Change `ADMIN_SECRET` and `NEXT_PUBLIC_ADMIN_SLUG` from their defaults before deploying
- The admin slug should be a long random string (24+ characters)
- Admin key is passed via `X-Admin-Key` header, stored in `sessionStorage` (tab-scoped)
- Participant sessions are anonymous; no PII is required
- Contact info (email/phone) is only collected if the participant voluntarily opts in during debrief

---

## License

This project is for academic research purposes. Contact andrewakuaku@berkeley.edu for inquiries.
