# Swipe to Decide

A vignette research instrument exploring Gen Z attitudes toward AI involvement in dating and romantic relationships. Part of the study *"The AI Response: Gen Z Dating App Fatigue, Artificial Intelligence, and the Future of Romantic Connection Among College Students"* (UC Berkeley School of Information).

Participants complete a short warmup about their own dating app history, then swipe through twelve scenario vignettes organized into three base scenarios with counter-pressure branching: each base prompt is followed by three variants that either add friction (if the participant accepted) or offer reassurance (if they rejected). The instrument surfaces the specific conditions under which stances on AI involvement shift.

Built as a full-stack web application with a swipe-card interface and a researcher dashboard.

## Table of Contents

- [Research Design](#research-design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Admin Dashboard](#admin-dashboard)
- [Security Notes](#security-notes)

---

## Research Design

### Participant Journey (~10 minutes, 12 swipes)

| Phase | Name | Description |
|-------|------|-------------|
| 0 | **About You** | Optional demographics (age, gender, university, state) + informed consent |
| 1 | **Onboarding** | Brief orientation to the swipe mechanic |
| 2 | **Pre-Swipe Warmup** | Four short questions about the participant's own dating app history |
| 3 | **Swipe to Decide** | 3 base scenarios, each followed by 3 counter-pressure variants (12 swipes total) |
| 4 | **Debrief** | Reflection prompts covering each scenario + optional researcher discussion signup |

### The Three Base Scenarios

Each scenario targets one of the three exit factors identified in the literature. Scenarios are presented in randomized order to control for order effects.

| Code | Scenario | Targeted Exit Factor |
|------|----------|----------------------|
| A | **AI Curated Matching** | Swipe fatigue and the paradox of choice |
| B | **AI Conversation Coaching** | Perceived inauthenticity and commodification |
| C | **AI Group Meetup** | Desire for organic connection |

### Two-Pass, Counter-Pressure Branching

- **Pass 1 (Baseline, 3 swipes):** One swipe on each scenario's base prompt.
- **Pass 2 (Counter-pressure, 9 swipes):** Each base prompt branches into one of two paths based on the participant's direction:
  - **Right-swipe path** adds three escalating friction variants (R1 → R3) to test whether initial acceptance is conditional.
  - **Left-swipe path** offers three softening variants (L1 → L3) to test whether initial rejection is absolute.
- **Flip points** (direction changes within a branch) are flagged as primary analytic anchors for follow-up interviews.

### Data Collected

- **Swipe direction** (right = would use, left = would not)
- **Response time** in milliseconds (hesitation proxy)
- **Variant code** (e.g. `A-base`, `B-R2`, `C-L3`) identifying scenario + variant
- **Position in sequence** (stage index in the randomized order)
- **Scenario order** per participant (stored to support within-session effects analysis)
- **Warmup answers** (W1 prior use, W2 frequency, W3 exit behavior, W4 open reflection)
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
| `ADMIN_SECRET` | Password for admin dashboard access | *(set your own)* |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_ADMIN_SLUG` | Secret URL slug for admin pages | *(set your own)* |

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
| `PATCH` | `/api/participants/{code}/warmup` | Save warmup answers (W1-W4) |
| `PATCH` | `/api/participants/{code}/scenario-order` | Persist randomized scenario order (e.g. `"B,A,C"`) |
| `POST` | `/api/participants/{code}/swipe` | Record a swipe response (includes `variant_code`) |
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

1. Navigate to `/admin/{your-slug}` (set via `NEXT_PUBLIC_ADMIN_SLUG`)
2. Enter the admin password (set via `ADMIN_SECRET`)
3. View participant data, stats, individual responses, and charts
4. Export data as CSV for external analysis

### Analytics Charts

The charts page is being rebuilt against the new scenario + variant data model. Until the rewrite lands, the dashboard table view, per-participant response timeline, and CSV export are the primary analysis surfaces.

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
