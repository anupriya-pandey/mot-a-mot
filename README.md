# Mot-à-Mot V1.1

An AI messaging assistant for beginner French learners (A1–B1). Check your French sentences before you send them — get corrections, explanations, and confidence.

**Run locally:** frontend at `http://localhost:5173/` · API at `http://localhost:3001/`  
**Host free online:** [Deploy on Vercel](docs/VERCEL-DEPLOY.md) (Gemini API key required)

## Features (V1.1)

- French sentence analysis with structured feedback
- **Informal & Formal French** suggestions for different communication contexts
- **That's Not What I Meant** — clarify intent without restarting
- **My French Toolbox** — auto-built personal vocabulary from your corrections
- Side-by-side change comparison across informal and formal versions
- Grammar & naturalness scores for **your original sentence**
- Voice input (Chrome/Edge, French `fr-FR`)
- Multiple AI providers: **Gemini** (free tier), **Ollama** (local/free), **OpenAI** (paid)

## Quick start

### 1. Install dependencies

```powershell
cd "path\to\MOt -aMot"
npm install
```

### 2. Configure environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` — recommended free setup:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_from_https://aistudio.google.com/apikey
PORT=3001
```

See [docs/SETUP.md](docs/SETUP.md) for OpenAI, Ollama, and troubleshooting.

### 3. Run the app

**Windows (recommended):**

```powershell
.\start-dev.cmd
```

**Or manually:**

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Open **http://localhost:5173/**

## Project structure

```
MOt -aMot/
├── src/                 # React frontend (Vite + TypeScript + Tailwind)
├── api/                 # Vercel serverless routes (/api/analyze, /api/health)
├── server/              # Express (local dev) + shared analyzeService.js
├── docs/                # Version docs, prompts, changelog
├── start-dev.cmd        # Windows dev launcher (frees ports 3001/5173)
├── .env.example         # Environment template (never commit .env)
└── package.json
```

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/V1.0.md](docs/V1.0.md) | V1.0 iteration snapshot — scope, features, decisions |
| [docs/V1.1.md](docs/V1.1.md) | **V1.1 features** — clarification, dual suggestions, toolbox |
| [docs/design/](docs/design/) | **PRD, UX spec, style guide, component library** + PDF originals |
| [docs/PROMPTS.md](docs/PROMPTS.md) | Full AI system prompt & JSON schema |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [docs/VERSIONING.md](docs/VERSIONING.md) | How we tag releases (V1.0, V1.2, …) |
| [docs/SETUP.md](docs/SETUP.md) | Detailed setup & troubleshooting |
| [docs/GITHUB-PUBLISH.md](docs/GITHUB-PUBLISH.md) | Step-by-step GitHub publish guide |
| [docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md) | **Free hosting on Vercel** |

## Versioning

- **V1.0** — first public iteration (this release)
- **V1.2+** — future modifications tagged incrementally (see [docs/VERSIONING.md](docs/VERSIONING.md))

## License

MIT — see [LICENSE](LICENSE)

## Security

Never commit `.env` or API keys. For Vercel, add keys only in the dashboard (Environment Variables).
