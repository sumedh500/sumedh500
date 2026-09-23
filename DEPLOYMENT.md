# Deployment Guide

Backend → **Render** (free tier), Frontend → **Vercel** (free tier). Both
free, both GitHub-connected (push to deploy), no CLI required for either.

Deploy the **backend first** — the frontend needs its live URL.

## 1. Backend on Render

1. Push this repo to GitHub if you haven't already (it already is, if
   you're reading this from the repo).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New →
   Blueprint** → connect this GitHub repo.
3. Render reads `render.yaml` at the repo root automatically and proposes
   a web service named `chat-agent-backend`, rooted at `backend/`, with
   `npm install && npm run build` as the build command and `npm start` as
   the start command. Accept it.
4. Render will prompt you to fill in the env vars marked `sync: false` in
   `render.yaml` — **use the exact same values from your local
   `backend/.env`** (the ones you already got working for Phases 2–6):
   - `GROQ_API_KEY`
   - `ZOHO_DC`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`
   - `REDIS_URL` (your hosted Upstash `rediss://...` string — Render's
     servers can't reach `localhost`, so this **must** be a hosted Redis
     URL, not `redis://localhost:6379`)
   - `CORS_ORIGIN` — leave this as `*` for now; you'll come back and set
     it to your real Vercel URL after step 2
5. Deploy. Render builds and starts the service, then gives you a URL
   like `https://chat-agent-backend.onrender.com`.
6. Verify it's alive: `curl https://chat-agent-backend.onrender.com/health`
   should return `{"status":"ok"}`.

**Free tier note:** the service spins down after ~15 minutes idle. The
first request after a gap takes 30-60s to wake it back up — expected
behavior, not a bug. Worth mentioning if you demo this live.

## 2. Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. Vercel auto-detects it as a Vite project. Before deploying, set:
   - **Root Directory:** `frontend` (this is a monorepo — Vercel needs to
     know the frontend isn't at the repo root)
   - **Environment Variable:** `VITE_API_URL` = your Render backend URL
     from step 1 (e.g. `https://chat-agent-backend.onrender.com`)
3. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.

## 3. Close the loop: restrict CORS

Now that you have the real Vercel URL, go back to the Render dashboard →
your service → **Environment** → set `CORS_ORIGIN` to your exact Vercel
URL (e.g. `https://your-app.vercel.app`, no trailing slash) instead of
`*`. Save — Render redeploys automatically.

This matters: `*` (any origin) is fine for local dev, but a public
deployment should only accept requests from your actual frontend, not
literally any website on the internet that decides to call your `/chat`
endpoint.

## 4. Test the deployed app

Open your Vercel URL and run through the same 4-scenario test from
`docs/DEMO_VIDEO_CHECKLIST.md`, using the same seeded phone numbers/IDs.
If a chat message fails immediately, check the Render service's **Logs**
tab first — the same diagnostic logging that helped during local
development (stage classifier decisions, Zoho Contact/Deal lookups, Redis
connection status) is right there in Render's log stream.

## Updating the deployment

Both Render and Vercel redeploy automatically on every push to the branch
they're connected to (`main` by default — check each platform's project
settings if you're deploying from a different branch, e.g.
`claude/tender-gauss-434rtt`).

## Notes / things that are different from local dev

- **Redis must be hosted**, not `localhost` — see step 1.
- **`GROQ_MODEL`/model deprecations**: if Groq deprecates the model this
  project defaults to (`openai/gpt-oss-120b`) after this was written,
  update `GROQ_MODEL` in Render's dashboard — no code or redeploy-from-git
  needed, env var changes alone trigger a restart.
- **Zoho refresh tokens don't expire from being used on a new server** —
  the same `ZOHO_REFRESH_TOKEN` from local dev works in production; no
  need to regenerate it for deployment.
- **Session data won't survive a backend redeploy differently than it
  does locally** — sessions live in Redis (external to the backend
  process either way), so a Render redeploy doesn't lose in-progress
  conversations the way restarting a local dev server with the old
  in-memory session store (pre-Phase-6) would have.
