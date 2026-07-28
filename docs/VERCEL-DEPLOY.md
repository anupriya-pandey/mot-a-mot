# Deploy Mot-à-Mot on Vercel (free)

Host the app on the internet at no cost using [Vercel](https://vercel.com) and a free [Google Gemini API key](https://aistudio.google.com/apikey).

**What you get:** a public URL like `https://mot-a-mot.vercel.app` — no server to manage.

**What does not work on Vercel:** Ollama (local AI only). Use **Gemini** for free cloud hosting.

---

## Before you start

1. Push your code to **GitHub** (see [GITHUB-PUBLISH.md](GITHUB-PUBLISH.md)).
2. Get a **Gemini API key** from https://aistudio.google.com/apikey
3. Create a free account at https://vercel.com (sign in with GitHub).

---

## Step 1 — Import the project

1. Open https://vercel.com/new
2. Click **Import** next to your `mot-a-mot` GitHub repository
3. Vercel auto-detects Vite — leave defaults:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Do **not** deploy yet — add environment variables first (Step 2)

---

## Step 2 — Environment variables

Under **Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `AI_PROVIDER` | `gemini` | Required |
| `GEMINI_API_KEY` | your key | From Google AI Studio |

Optional:

| Name | Value |
|------|--------|
| `GEMINI_MODEL` | `gemini-3.5-flash` |

Apply to **Production**, **Preview**, and **Development**.

---

## Step 3 — Deploy

Click **Deploy**. Vercel will:

1. Install dependencies
2. Run `npm run build` (React frontend → `dist/`)
3. Deploy `/api/analyze` and `/api/health` as serverless functions

When finished, open your **Visit** link.

---

## Verify it works

1. Open `https://your-app.vercel.app`
2. Enter a French sentence and tap **Check my sentence**
3. Optional: open `https://your-app.vercel.app/api/health` — should show:

```json
{ "ok": true, "provider": "gemini", "configured": true }
```

If `configured` is `false`, check `GEMINI_API_KEY` in Vercel → Settings → Environment Variables, then **Redeploy**.

---

## How it works

```
Browser  →  Vercel CDN (React app in dist/)
         →  /api/analyze  →  serverless function  →  Gemini API
```

- `vercel.json` serves the SPA and routes `/api/*` to functions in `api/`
- Shared AI logic lives in `server/analyzeService.js` (same prompts as local dev)
- Local dev still uses Express (`server/index.js`) on port 3001

---

## Updating after changes

Push to GitHub — Vercel redeploys automatically if connected.

Or: Vercel dashboard → **Deployments** → **Redeploy**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Gemini API key is missing" | Add `GEMINI_API_KEY` in Vercel env vars, redeploy |
| 404 on refresh | Already handled by `vercel.json` SPA rewrite |
| Ollama errors | Set `AI_PROVIDER=gemini` on Vercel — Ollama is local-only |
| Build fails | Run `npm run build` locally first to see the error |
| Quota / rate limit | Wait a minute or create a new Gemini key |

---

## Cost

- **Vercel Hobby plan:** free for personal projects
- **Gemini API:** free tier with usage limits (see Google AI Studio)

No credit card required for basic Vercel hosting.
