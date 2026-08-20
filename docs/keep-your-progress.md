# Keep your progress after redeploys

Mot-à-Mot now saves your toolbox, sentence history, and practice progress to the cloud automatically. **No login required.**

## What you need to do (one time, about 2 minutes)

### Step 1 — Open your Vercel project
Go to [vercel.com](https://vercel.com) → your **mot-a-mot** project.

### Step 2 — Add Upstash Redis (free)
1. Click **Integrations** (or **Marketplace**).
2. Search for **Upstash Redis**.
3. Click **Add integration** and connect it to your project.
4. Vercel will add the storage keys for you automatically.

### Step 3 — Redeploy
1. Go to **Deployments**.
2. Click the **⋯** menu on the latest deployment → **Redeploy**.

That’s it. After redeploy, user progress is backed up to the cloud and restored when they return — even after app updates.

## What users experience

- No account or password
- Progress saves quietly in the background
- Same browser keeps working as before; cloud backup protects against data loss and redeploys

## If you skip Step 2

The app still works, but progress stays in the browser only (same as before). Adding Upstash is what makes it survive redeploys.

## Optional: Supabase login (not required)

The older login setup in `docs/supabase-setup.md` is optional. You can ignore it unless you want email/password accounts later.
