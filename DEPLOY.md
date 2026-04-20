# Deploying to Heroku

This repo is a monorepo with two deployable services. On Heroku each is its own app:

- **`ai-and-dating-api`** — FastAPI backend (Python) + Heroku Postgres
- **`ai-and-dating`** — Next.js frontend (Node)

Recurring cost at the lowest paid tiers (Heroku no longer has a free tier):
- 2× `basic` dyno — ~$5/month each
- 1× Postgres `essential-0` — ~$5/month
- **≈ $15/month total**

---

## 0. Prerequisites

- Heroku CLI installed and logged in (`heroku login`).
- Git working tree clean (`git status` shows no uncommitted changes).
- All edits committed on the branch you plan to deploy from (typically `main`).

Verify:

```bash
heroku auth:whoami
git status
```

---

## 1. Create both apps

```bash
heroku apps:create ai-and-dating-api --region us
heroku apps:create ai-and-dating --region us
```

Each command prints the app's URL. Copy them — you'll need both:

- **API URL** (backend): e.g. `https://ai-and-dating-api-<suffix>.herokuapp.com`
- **Web URL** (frontend): e.g. `https://ai-and-dating-<suffix>.herokuapp.com`

---

## 2. Provision Postgres on the API app

```bash
heroku addons:create heroku-postgresql:essential-0 --app ai-and-dating-api
```

This sets `DATABASE_URL` automatically. The backend normalizes the scheme from
`postgres://…` to `postgresql+asyncpg://…` at boot (see `backend/app/config.py`).

---

## 3. Configure backend environment

Generate a strong admin secret or reuse the local one:

```bash
heroku config:set \
  ADMIN_SECRET='Vignette-AI-2026!lnd7C3ft5ly2dPdvBZAjg27FX1oGLukAUwU8hJNI5ig=' \
  CORS_ORIGINS='https://ai-and-dating-<suffix>.herokuapp.com' \
  --app ai-and-dating-api
```

Replace the `CORS_ORIGINS` host with the frontend URL from step 1.

---

## 4. Push the backend

The backend is in `backend/`. Push just that subtree:

```bash
git remote add heroku-api https://git.heroku.com/ai-and-dating-api.git
git subtree push --prefix=backend heroku-api main
```

First boot runs the Procfile `release` command (`alembic upgrade head`) which
creates all tables. Watch the log:

```bash
heroku logs --tail --app ai-and-dating-api
```

Health check:

```bash
curl https://ai-and-dating-api-<suffix>.herokuapp.com/api/health
# {"status":"ok"}
```

---

## 5. Configure frontend environment

Next.js reads `NEXT_PUBLIC_*` vars at **build** time, so these must be set
before pushing:

```bash
heroku config:set \
  NEXT_PUBLIC_API_URL='https://ai-and-dating-api-<suffix>.herokuapp.com' \
  NEXT_PUBLIC_ADMIN_SLUG='r9k4x7m2b8f1n5p3q6w0t4v8' \
  --app ai-and-dating
```

Replace `NEXT_PUBLIC_API_URL` with the API URL from step 1. If you want to
rotate the URL slug that gates `/admin/<slug>`, set a new value here.

---

## 6. Push the frontend

```bash
git remote add heroku-web https://git.heroku.com/ai-and-dating.git
git subtree push --prefix=frontend heroku-web main
```

The Node buildpack will run `npm install` + `npm run build`, then the Procfile
starts `next start -p $PORT`.

---

## 7. Verify end to end

Open the web URL in a browser. You should see the landing page with the
"Dashboard" pill bottom-right. Walk through a session; swipes should land in
Postgres:

```bash
heroku pg:psql --app ai-and-dating-api
# chase::DATABASE=> SELECT COUNT(*) FROM responses;
```

---

## Common follow-ups

**Re-deploy after code changes:**

```bash
git add . && git commit -m "…"
git subtree push --prefix=backend heroku-api main
git subtree push --prefix=frontend heroku-web main
```

`--prefix` must match the subtree exactly; pushing the frontend after changing
backend code is fine but a no-op for the backend app (and vice versa).

**Force-push when subtree push is rejected:**

```bash
git push heroku-api `git subtree split --prefix=backend main`:main --force
```

Use sparingly — it rewrites the remote's history.

**New migration:**

1. Edit `backend/app/models/models.py`.
2. Locally: `alembic revision --autogenerate -m "…"` then `alembic upgrade head`.
3. Commit and push; the `release` phase runs `alembic upgrade head` on Heroku.

**Rotate the admin password:**

```bash
heroku config:set ADMIN_SECRET='…new…' --app ai-and-dating-api
```

No frontend rebuild needed — the password is POSTed to `/api/admin/verify`.

**Change the admin URL slug:**

```bash
heroku config:set NEXT_PUBLIC_ADMIN_SLUG='…new…' --app ai-and-dating
```

Then re-push the frontend (needed because NEXT_PUBLIC_* is embedded at build
time).

**Teardown:**

```bash
heroku apps:destroy ai-and-dating-api --confirm ai-and-dating-api
heroku apps:destroy ai-and-dating --confirm ai-and-dating
```
