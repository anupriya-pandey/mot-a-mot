# Supabase setup for saved user progress

Mot-à-Mot stores toolbox, sentence history, practice completions, and ratings in Supabase when auth is enabled. Without these env vars, the app runs in local-only mode (browser storage only).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API**.
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Create the database table

In **SQL Editor**, run the script in [`supabase/schema.sql`](../supabase/schema.sql).

This creates `user_progress` with row-level security so each user can only read/write their own data.

## 3. Configure auth

In **Authentication → Providers**, enable **Email**.

Optional: under **Authentication → Email**, disable “Confirm email” for faster testing. For production, keep confirmation enabled.

## 4. Add environment variables

### Local dev (`.env`)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Restart `npm run dev` after adding env vars.

### Vercel

Add the same two variables in **Project Settings → Environment Variables** for Production (and Preview if desired), then redeploy.

## 5. How sync works

- On **sign in**, server data is merged with any local browser data (toolbox entries, history, practice progress).
- On every **save**, changes sync to Supabase within ~2 seconds.
- On **sign out**, a final sync runs before logout.

Users can create an account on any device and their progress follows them across redeploys and browser sessions.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login screen says “not configured” | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then rebuild |
| “Could not sync your progress” | Confirm `user_progress` table exists and RLS policies were applied |
| Sign-up asks to confirm email | Check inbox, or disable email confirmation in Supabase for testing |
| Old local data missing after login | Sign in on the same browser first — local data merges into the account on first login |
