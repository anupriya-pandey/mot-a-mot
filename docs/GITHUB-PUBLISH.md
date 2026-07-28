# Publish Mot-à-Mot V1.0 to GitHub

Follow these steps once on your computer.

## Step 1 — Install Git (if needed)

Download: https://git-scm.com/download/win  
Install with default options, then **open a new Terminal**.

Verify:

```powershell
git --version
```

## Step 2 — Save V1.0 locally (commit + tag)

In Terminal, from the project folder:

```powershell
cd "C:\Users\anupr\OneDrive\Desktop\MOt -aMot"

git init
git add -A
git status
```

**Confirm `.env` is NOT listed** (it must stay private). Only `.env.example` should appear.

```powershell
git commit -m "$(cat <<'EOF'
Release Mot-à-Mot V1.0 — first public iteration.

Includes full app, AI prompts, voice input, Gemini/Ollama/OpenAI support, and docs.
EOF
)"

git tag -a v1.0.0 -m "Mot-à-Mot V1.0"
git branch -M main
```

## Step 3 — Create a public GitHub repository

1. Go to https://github.com/new
2. **Repository name:** `mot-a-mot` (or your preferred name)
3. **Description:** AI French messaging assistant for beginner learners
4. Choose **Public**
5. **Do NOT** add README, .gitignore, or license (we already have them)
6. Click **Create repository**

## Step 4 — Push to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/mot-a-mot.git
git push -u origin main
git push origin v1.0.0
```

## Step 5 — Verify

- Open `https://github.com/YOUR_USERNAME/mot-a-mot`
- Check **Releases** or **Tags** for `v1.0.0`
- README should display on the repo homepage

## Future versions (V1.2, etc.)

After making changes:

```powershell
git add -A
git commit -m "Release V1.2: describe your changes"
git tag -a v1.2.0 -m "Mot-à-Mot V1.2"
git push origin main --tags
```

Update `package.json` version to `1.2.0` and add `docs/V1.2.md` + CHANGELOG entry.

See [VERSIONING.md](./VERSIONING.md).

## Security reminder

- Never commit `.env` or API keys
- If a key was ever exposed, revoke it at https://aistudio.google.com/apikey or OpenAI dashboard
