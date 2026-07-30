# Changelog

All notable changes to Mot-à-Mot are documented here.

## [1.2.0] — V1.2 — 2026-07-30

### Added

- **Swipe carousel** for Formal French by DELF/DALF level (A1 → C2) — one level visible; swipe or tap → for next
- Swipe carousel for **What Changed** formal breakdown per change (informal stays visible; formal levels swipe)
- **Why These Changes?** formal overview by level (informal static + swipeable formal A1–C2)
- Reusable `SwipeCarousel` component with dots, arrows, and “Swipe for next level” hint
- **Listening chime** when the mic is ready — two-tone sound plus updated voice hints

---

## [1.1.0] — V1.1 — 2026-07-30

Everything after V1.0 is included in this release.

### Added

- **Meaning Clarification:** "That's Not What I Meant" on Results — clarify in English or rewrite in French; re-analysis without returning to Landing; English clarification sets grammar/naturalness scores to 0
- **Suggested Messages:** Informal French plus **Formal French by DELF/DALF level** (A1, A2, B1, B2, C1, C2) with independent copy buttons
- **English translations** under informal and every formal level sentence
- **What Changed:** level-by-level breakdown (A1–C2) with aligned cards, English buddy-style explanations per change and per level
- **In-scope notes** at each formal level (neutral DELF/DALF scope wording)
- **Grammar intros** on every French Toolbox category page (Nouns, Verbs, Adverbs, etc.)
- **My French Toolbox:** dashboard on Landing, category browser, lemma + surface storage, adjective forms grid, localStorage (`mot-a-mot-toolbox-v3`)
- **Add to your French toolkit?** opt-in section on Results; scans new vocab from informal + all formal levels A1–C2; hides words already saved
- **Top-of-page vocab hint** on Results when new words are detected
- **Search History:** Check / History tabs; last 50 checks in localStorage; reopen past results
- New screens: Vocabulary, History — new components: ClarificationPanel, SuggestedMessageCard, LevelFormalSuggestions, SuggestedToolkitAdditions, FrenchToolboxDashboard, VocabularyListItem, AppTabs
- **`server/aiClient.js`** — Gemini model fallback chain and high-demand retries
- **`server/vocabularySanitizer.js`** — dedupe, filter bad entries, merge meanings
- **`src/lib/normalizeAnalysisResult.ts`** — backward-compatible API response shaping
- Docs: `docs/V1.1.md`, updated deploy and design references

### Changed

- Replaced single "Ready to Send" with informal + multi-level formal suggestions
- **Multi-step AI pipeline:** correction → formal levels (A1–C2) → level-aligned changes → combined vocabulary extraction
- AI schema: `suggestions.byLevel`, `explanations.byLevel`, `userVocabulary`, `suggestedAdditions`; informal includes `english`; each level includes `english`, `limitation`, `sentence`
- Changes validation: `youWrote` must match learner original; level phrases must match each target sentence; retry on failed alignment
- Vocabulary extraction compares learner baseline against informal + all six formal sentences
- `POST /api/analyze` accepts optional `clarification` object
- Results layout: Suggested Messages → What Changed → Why These Changes (informal overview) → scores → toolkit additions
- Default Gemini models: `gemini-2.5-flash-lite` first with expanded fallback chain

### Fixed

- Gemini quota, rate-limit, and high-demand error handling
- Server crash / ECONNRESET on analyze errors (`server/index.js` try/catch)
- Toolbox duplicates and bad entries (e.g. negation merged with verbs)
- Suggested vocab no longer listed when already in toolbox
- Formal level changes no longer duplicated across A1–C2 when sentences differ

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

Future modifications. See [VERSIONING.md](./VERSIONING.md).
