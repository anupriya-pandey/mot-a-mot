# UX Design Specification (V1)

> **Original PDF:** [originals/ux design specification mot-a-mot.pdf](./originals/ux%20design%20specification%20mot-a-mot.pdf)

**Product:** Mot-à-Mot

## Design Intent

Mot-à-Mot is designed as an **AI messaging assistant** for beginner French learners, not a comprehensive language-learning platform.

The experience should help users quickly verify, improve, and confidently send everyday French messages while learning naturally through concise, beginner-friendly feedback.

Every design decision should prioritize **speed, clarity, and minimal interruption** to the user's conversation flow.

---

## 1. UX Goals & Design Principles

### UX Goals

- **Fast** — verify and improve a message in under 20 seconds
- **Intuitive** — no onboarding required
- **Supportive** — build confidence, not discourage
- **Educational** — every correction teaches the underlying rule
- **Low friction** — return to messaging app quickly

### UX Principles

1. **One Screen, One Goal** — Landing → Write · Loading → Wait · Results → Review & Copy
2. **Communicate Before You Teach** — show corrected message first; grammar supports sending
3. **Reduce Cognitive Load** — cards, tables, concise sections
4. **Teach Through Corrections** — simple explanation per change
5. **Never Break the Conversation Flow** — help users return to chat quickly

## 2. Screen Architecture

```
Landing → Loading → Results
```

No menus, nav bars, profiles, or settings in MVP.

## 3. Interaction Patterns

| Pattern | Guideline |
|---------|-----------|
| Primary action | One primary CTA per screen |
| Layout | Card-based hierarchy |
| Workflow | Linear: Write → Review → Copy |
| Copy action | One tap |
| Feedback | Immediate visual confirmation |
| Mobile | Mobile-first, responsive |
| Information density | Essential info only; avoid long paragraphs |

## 4. Landing Screen

**Purpose:** Begin writing or speaking immediately.

| Component | Behaviour |
|-----------|-----------|
| App Title | "Mot-à-Mot" |
| Tagline | "Write confidently. Learn naturally." |
| Prompt | "What do you want to say in French?" |
| French Input | Multi-line textarea |
| Placeholder | "Je ne peux pas venir aujourd'hui." |
| Microphone | Voice input (optional) |
| Check My French | Primary button; enabled when input not empty |

## 5. Loading Screen

**Purpose:** Feedback during AI processing.

- Loading animation
- Rotating status messages every 1–2 seconds:
  - ✨ Looking for the most natural way to say it...
  - 📝 Checking grammar...
  - ✨ Polishing your message...
  - 📚 Every correction is one step closer to fluency.
  - 🇫🇷 Almost ready...

## 6. Results Screen

**Purpose:** Prioritize communication while supporting learning.

| Component | Behaviour |
|-----------|-----------|
| What I Understood | AI's interpretation |
| Ready to Send | Corrected French message |
| Copy Message | Primary action — clipboard |
| Changes Made | Comparison table |
| Why These Changes? | Grammar concepts in simple language |
| Grammar Rating | Original sentence accuracy |
| Naturalness Rating | Original sentence naturalness |

**Hierarchy:** Corrected message + Copy button most prominent.

## 7. Error States

| Screen | Scenario | Message |
|--------|----------|---------|
| Landing | Empty input | "Please enter or speak a sentence in French." |
| Landing | Voice failed | "We couldn't hear that clearly..." |
| Loading | AI failed | "We couldn't check your sentence right now..." |
| Results | Copy failed | "Unable to copy. Please try again." |

## 8. Feedback Principles

- Focus on improvement, not mistakes
- Avoid judgmental or academic tone
- Concise, beginner-friendly explanations
- Positive microcopy

## 9. Accessibility

- Responsive desktop/mobile
- Sufficient colour contrast
- Keyboard navigation
- Large touch targets
- Clear hierarchy; don't rely on colour alone

## 10. UX Success Metrics

Users should be able to:

- Complete first correction without assistance
- Understand corrected message within 3 seconds
- Find Copy Message without scrolling
- Complete Write → Check → Copy in ≤3 taps
- Return to messaging app within 20 seconds
