# Changelog

All notable changes to Mot-à-Mot are documented here.

## [1.1.0] — V1.1 — 2026-07-28

### Added

- **Meaning Clarification:** "That's Not What I Meant" with English or French clarification input; re-analysis without returning to Landing
- **Context-Aware Suggestions:** Informal and Formal French messages with independent copy actions
- **Updated comparison table:** Your Sentence | Informal French | Formal French
- **Dual explanations:** Separate informal and formal "Why These Changes?" content
- **My French Toolbox:** Two-step AI — correction then separate linguistic vocabulary extraction; lemma + surface storage
- Vercel serverless + Gemini high-demand retry improvements

### Changed

- AI response schema: `suggestions`, `explanations`; vocabulary uses `lemma`, `surface`, `meaning`, `example`
- Two separate AI prompts: correction task + vocabulary extraction task
- Default Gemini model: `gemini-2.0-flash` with expanded fallback chain

---

## [1.0.0] — V1.0 — 2026-07-21

First public iteration. Tag: `v1.0.0`.

### Added

- React + Vite frontend with landing, loading, and results screens
- Express API with `/api/analyze` and `/api/health`
- AI providers: Gemini, OpenAI, Ollama (configurable via `.env`)
- Structured JSON analysis: understood, everydayMeaning, corrections, grammarNotes, ratings
- Results flow: Your Sentence → What I Understood → Ready to Send → changes → scores
- Literal + everyday meaning in "What I Understood"
- Educational "Why These Changes?" section
- Your Sentence Scores (grammar/naturalness for original input)
- French voice input with Chrome/Edge support
- `start-dev.cmd` for Windows dev
- Documentation: V1.0 snapshot, prompts, setup, versioning
- Design docs: PRD, UX spec, UI style guide, component library (markdown + PDF originals)

### Fixed during V1.0 development

- OpenAI/Gemini quota and API key error messages
- Gemini AQ-format keys and model fallback chain
- PowerShell `npm` execution via `npm.cmd`
- Port conflicts (EADDRINUSE) on restart
- Microphone permission and speech recognition reliability

---

## Planned

### [1.2.0] — V1.2

Future modifications after V1.0. See [VERSIONING.md](./VERSIONING.md).
