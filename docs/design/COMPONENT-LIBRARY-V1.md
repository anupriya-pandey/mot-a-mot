# Component Library & Screen Specification (V1)

> **Original PDF:** [originals/component library mot-a-mot.pdf](./originals/component%20library%20mot-a-mot.pdf)

**Product:** Mot-à-Mot

## Overview

Reusable UI components and screen layouts. Styling follows the [UI Style Guide](./UI-STYLE-GUIDE-V1.md). Behaviour follows the [UX Specification](./UX-DESIGN-SPECIFICATION-V1.md).

**Implementation:** `src/components/` and `src/screens/`

---

## Component Library

| ID | Component | File | Used on |
|----|-----------|------|---------|
| C-01 | Primary Button | `PrimaryButton.tsx` | Landing, Results |
| C-02 | Secondary Button | `SecondaryButton.tsx` | Results |
| C-03 | Multi-line Text Input | `TextInput.tsx` | Landing |
| C-04 | Voice Input Button | `VoiceInputButton.tsx` | Landing |
| C-05 | Information Card | `InformationCard.tsx` | Results |
| C-06 | Comparison Table | `ComparisonTable.tsx` | Results |
| C-07 | Rating Bar | `RatingBar.tsx` | Results |
| C-08 | Status Banner | `StatusBanner.tsx` | Landing, Results |
| C-09 | Loading Indicator | `LoadingIndicator.tsx` | Loading |
| C-10 | Section Header | `SectionHeader.tsx` | (available; cards use inline titles) |

### C-01 Primary Button

Primary screen action. Variants: "Check My French", "Copy Message". States: default, hover, disabled, loading, success.

### C-02 Secondary Button

Secondary action. Variant: "Check Another Sentence" — clears input, returns to Landing, focuses textarea.

### C-03 Multi-line Text Input

French message input. Auto-focus on Landing. Placeholder: *Je ne peux pas venir aujourd'hui.*

### C-04 Voice Input Button

Mic in textarea corner. States: idle, listening (blue), unsupported. French `fr-FR` speech recognition.

### C-05 Information Card

Grouped content with optional icon, title, body, optional action. Used for understood, ready to send, grammar notes.

### C-06 Comparison Table

Columns: You Wrote · Better French · Why. Dynamic rows per correction.

### C-07 Rating Bar

Label + progress bar + percentage. Grammar and Naturalness.

### C-08 Status Banner

Types: success, warning, error. User and system feedback.

### C-09 Loading Indicator

Spinner + rotating messages from `src/constants/loadingMessages.ts`.

### C-10 Section Header

Icon + title + divider (for future use).

---

## Screen Specifications

### S-01 — Landing (`LandingScreen.tsx`)

**Goal:** Start writing or speaking immediately.

**Components:** AppLogo, tagline, prompt, C-03, C-04, C-01, privacy footer

**Primary action:** Check My French (disabled until text present)

**Exit:** → Loading on submit

### S-02 — Loading (`LoadingScreen.tsx`)

**Goal:** Processing feedback.

**Components:** C-09, rotating messages (1.5s interval)

**Exit:** → Results when API returns

### S-03 — Results (`ResultsScreen.tsx`)

**Goal:** Review, copy, learn.

**Primary action:** Copy Message  
**Secondary action:** Check Another Sentence

---

## Screen Navigation

```
Landing → Loading → Results
              ↑           │
              └───────────┘ Check Another Sentence
```

---

## Component Hierarchy

```
Application (App.tsx)
├── LandingScreen
│   ├── AppLogo
│   ├── TextInput (C-03)
│   ├── VoiceInputButton (C-04)
│   └── PrimaryButton (C-01)
├── LoadingScreen
│   └── LoadingIndicator (C-09)
└── ResultsScreen
    ├── InformationCard (C-05) × n
    ├── PrimaryButton (C-01)
    ├── ComparisonTable (C-06)
    ├── RatingBar (C-07) × 2
    └── SecondaryButton (C-02)
```

---

## Reusability Rules

1. Reuse components across screens
2. Styling from UI Style Guide
3. Behaviour from UX Specification
4. New components only when existing ones cannot satisfy the requirement
5. Keep components modular for future expansion
