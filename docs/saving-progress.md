# How to keep user progress saved (simple guide)

Mot-à-Mot saves each learner's **toolbox**, **sentence history**, and **practice progress** automatically. Learners do **not** need to create an account or sign in.

## What you do once (about 2 minutes)

This is a **one-time setup for you** as the app owner — not for your users.

1. Open [vercel.com](https://vercel.com) and go to your **Mot-à-Mot** project.
2. Click the **Storage** tab.
3. Click **Create Database** → choose **KV** (Redis).
4. Name it something like `mot-a-mot-progress` and click **Create**.
5. When asked, **connect it to your Mot-à-Mot project**. Vercel adds the secret keys automatically — you do not copy anything.
6. Go to **Deployments** → open the latest deployment → click **Redeploy**.

That's it. After this, progress is stored in the cloud and survives redeploys.

## What learners experience

- Open the app and start practicing — no login screen.
- Their toolbox and history save automatically in the background.
- If they use the **same browser**, progress also stays on the device.
- After you complete the setup above, progress is backed up to the cloud too.

## If you skip the Vercel KV step

The app still works. Progress is kept in the browser only (same as before). It can be lost if the browser clears site data or storage fills up — which is likely what your user was seeing after many sentences.

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Progress still disappears | Make sure you finished all 6 steps above, including **Redeploy** |
| Works on your phone but not laptop | Normal — each browser has its own save until cloud backup is enabled |
| Preview link vs live link | Use one main URL (your custom domain or main `.vercel.app` link) so storage stays consistent |

## Technical note (optional)

Cloud saves use Vercel KV with env vars `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which Vercel injects when you connect the database. No SQL, no Supabase, no manual keys.
