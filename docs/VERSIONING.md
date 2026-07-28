# Versioning policy

## Naming

| Label | Meaning |
|-------|---------|
| **Mot-à-Mot V1.0** | Product iteration name (first complete release) |
| **`v1.0.0` git tag** | Exact code snapshot on GitHub |
| **`1.0.0` in package.json** | npm/package version |

## Release ladder

- **V1.0 / v1.0.0** — This release. Full app, prompts, docs as shipped.
- **V1.2 / v1.2.0** — Next batch of modifications (your requested increment).
- **V1.3, V1.4, …** — Subsequent iterations.

We skip `v1.1.0` per project convention — the next tagged release after V1.0 is **V1.2**.

## What gets saved each version

Each tagged release should include:

1. All application source code
2. AI prompts (documented in `docs/PROMPTS.md` and `server/index.js`)
3. Updated `docs/CHANGELOG.md` and iteration doc (e.g. `docs/V1.2.md`)
4. `.env.example` (never real keys)

## How to tag a new version

```powershell
git add -A
git commit -m "Release V1.2: describe changes here"
git tag -a v1.2.0 -m "Mot-à-Mot V1.2"
git push origin main --tags
```

Update `package.json` `"version"` to match (e.g. `"1.2.0"`).
