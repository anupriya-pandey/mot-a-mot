# UI Style Guide (V1)

> **Original PDF:** [originals/UI Style Guide Mot-a-Mot.pdf](./originals/UI%20Style%20Guide%20Mot-a-Mot.pdf)

**Product:** Mot-à-Mot

## Design Intent

Mot-à-Mot is an **AI messaging assistant** for beginner French learners — not a comprehensive language-learning platform. Prioritize speed, clarity, and minimal interruption to conversation flow.

---

## 1. Brand Identity

### Brand personality

Like a patient French friend who helps you express thoughts in natural, confident French — never an exam or grammar test.

### Brand characteristics

Friendly · Intelligent · Calm · Helpful · Credible · Minimal · Straightforward · Gentle

| We Are | We Are Not |
|--------|------------|
| Encouraging | Judgmental |
| Modern | Corporate |
| Educational | Academic |
| Minimal | Cluttered |
| Friendly | Harsh |
| Fast | Feature-heavy |
| Subtle | Flashy |

## 2. Design Philosophy

Function over decoration. Minimal, functional, calm, uncluttered.

**Principles:** generous whitespace · one clear action per screen · calm hierarchy · minimal decoration · information before visuals

## 3. Color System

| Token | Hex (implemented) | Purpose |
|-------|-------------------|---------|
| Primary | `#1E4ED8` | Primary actions, links |
| Primary hover | `#1A44C2` | Button hover |
| Primary light | `#EEF2FF` | Subtle backgrounds |
| Accent red | `#C0392B` | Brand accent (sparingly) |
| Success | `#16A34A` | Corrected message, positive feedback |
| Warning | `#EA580C` | User-correctable issues |
| Error | `#DC2626` | System/technical failures |
| Background | `#F8F9FA` | Page background |
| Surface | `#FFFFFF` | Cards |
| Text primary | `#111827` | Body headings |
| Text secondary | `#6B7280` | Helper text |
| Border | `#E5E7EB` | Dividers |

**Source of truth in code:** `tailwind.config.js`

## 4. Typography

**Font:** Inter (system fallback: system-ui, sans-serif)

| Element | Size | Weight |
|---------|------|--------|
| App title | 36px | Bold |
| Page heading | 28px | Semibold |
| Section heading | 24px | Semibold |
| Card title | 18px | Semibold |
| Body | 16px | Regular |
| Caption | 14px | Regular |
| Button | 16px | Medium |

## 5. Buttons

### Primary (C-01)

- Filled primary blue, white text
- Border radius 12px (`rounded-button`)
- Full-width on mobile
- States: default, hover, disabled, loading, success ("✓ Copied!")

### Secondary (C-02)

- White background, blue outline, blue text

## 6. Input Fields (C-03)

- Multi-line textarea, white bg, 12px radius
- Placeholder: *Je ne peux pas venir aujourd'hui.*
- States: default, focus (blue outline), warning (orange), error (red)

## 7. Cards (C-05)

- White background, 16px radius (`rounded-card`)
- Soft shadow (`shadow-card`)
- Comfortable padding (`p-l`)

## 8. Icons & Branding

**Library:** Lucide Icons (outline, rounded)

**Logo:** Speech bubble motif behind wordmark — see `src/components/AppLogo.tsx`

## 9. Spacing System (8pt)

| Token | Value | Tailwind |
|-------|-------|----------|
| XS | 4px | `xs` |
| S | 8px | `s` |
| M | 16px | `m` |
| L | 24px | `l` |
| XL | 32px | `xl` |
| XXL | 48px | `xxl` |

**Max content width:** 720px (`max-w-content`)

## 10. Motion & Animation

- Interaction duration: 150–250ms (`duration-interaction`: 200ms)
- Loading: gentle spinner + rotating messages
- Copy success: button → "✓ Copied!" → revert after ~2s

## 11. Responsive Design

- **Mobile-first:** single column, full-width cards/buttons
- **Desktop:** centered, max 720px, generous whitespace

## 12. Voice & Microcopy

Friendly, clear, encouraging, concise.

| Avoid | Prefer |
|-------|--------|
| Your sentence is wrong. | Here's a more natural way to say it. |
| Incorrect grammar. | This small change makes it sound more natural. |
| Error | Let's try that again. |
| Submit | Check My French |
| Correct Sentence | Ready to Send |

**Implemented copy:** `src/constants/microcopy.ts`

## 13. Design Constraints

- One primary action per screen
- Corrected message visible without scrolling (when possible)
- Grammar supports — never overshadows — corrected message
- Colour communicates meaning
- Animations reinforce progress, not decoration
- Minimize effort to return to conversation
