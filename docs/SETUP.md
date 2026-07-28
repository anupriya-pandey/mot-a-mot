# Setup & troubleshooting

## Requirements

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Chrome or Edge (for voice input)
- An AI provider key (see below)

## AI provider options

### Gemini (recommended, free tier)

1. Get a key: https://aistudio.google.com/apikey
2. In `.env`:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
PORT=3001
```

Keys may start with `AQ.` (new format) or `AIzaSy` (legacy). Both work with the native Gemini endpoint.

### Ollama (free, local)

1. Install: https://ollama.com
2. Run: `ollama pull llama3.2`
3. In `.env`:

```
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
PORT=3001
```

### OpenAI (paid)

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
PORT=3001
```

## Running on Windows

If `npm` fails in PowerShell:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Or use:

```powershell
.\start-dev.cmd
```

## After changing `.env`

Always restart the server — the API only reads `.env` at startup:

```powershell
.\start-dev.cmd
```

## Common issues

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` | Run `.\start-dev.cmd` (kills old processes) |
| OpenAI quota error | Switch to Gemini or Ollama |
| Gemini quota / model error | Use `GEMINI_MODEL=gemini-3.5-flash`, restart |
| `fetch failed` | Restart server; check internet |
| Mic not working | Use Chrome; allow mic at lock icon in address bar |
| Wrong port | Use **http://localhost:5173/** only |

## Health check

- API: http://localhost:3001/api/health
- Should show: `{ "ok": true, "provider": "gemini", "configured": true }`
