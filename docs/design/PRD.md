# Mot-à-Mot — Product Requirements Document (V1)

> **Original PDF:** [originals/Mot-A-Mot PRD.pdf](./originals/Mot-A-Mot%20PRD.pdf)

## 1. Product Overview

### Vision

Help beginner French learners confidently express everyday thoughts in French by providing instant, beginner-friendly corrections and explanations before they send a message.

Mot-à-Mot shortens the learning loop between thinking, writing, correcting, understanding, and communicating.

Unlike general-purpose AI assistants, Mot-à-Mot is optimized for one specific job: help learners quickly verify and improve a French message before sending it.

The product should feel like a lightweight assistant that sits between the learner's thought and the final message they send.

## 2. Problem Statement

Beginner French learners often practice by translating everyday thoughts into French using the vocabulary and grammar they already know.

Many use ChatGPT to verify their messages before sending them. While ChatGPT can provide corrections, the experience is optimized for conversation rather than language learning.

As a result, learners spend more time prompting, reading long explanations, and finding corrections than actually practicing and communicating.

### Current workflow pain

Think of message → Open ChatGPT → Paste → Ask if correct → Read long explanation → Find correction → Copy → Return to WhatsApp → Paste → Send

Average interaction requires multiple prompts, context switching, and manual copying, creating a slow feedback loop.

### Pain points

1. **High interaction cost** — too many steps discourage frequent practice
2. **Inconsistent feedback** — AI responses vary in format and length
3. **Explanations not beginner-friendly** — heavy grammar jargon
4. **Slow communication loop** — tools interrupt conversation flow

## 3. Target User

**Primary user:** French learners A1–B1

**Characteristics:** basic vocabulary/grammar, learns independently, frequently translates thoughts, wants immediate feedback, uses French in texting

**Goals:** express everyday thoughts confidently, think in French, learn from mistakes, send messages faster

## 4. User Stories

1. As a beginner, I want to type or speak a French sentence and instantly receive structured corrections so I can confidently send my message.
2. As a beginner, I want to understand why my sentence is incorrect so I can avoid repeating the mistake.

## 5. Success Metrics

**North star:** Time to Understanding < 20 seconds (submit → understand → review → copy)

**Secondary:** copy rate, sentences per session, response time, confidence before sending

## 6. MVP Scope

### Included

- Type and speak French sentences
- AI interprets meaning, identifies mistakes, explains in beginner-friendly language
- Natural French correction
- Grammar and naturalness ratings
- Copy corrected sentence

### Excluded (V1)

- User accounts, login, progress, streaks, flashcards, quizzes, conversation mode, personalized plans, community
- Meaning correction ("This is not what I meant") — planned V2

## 7. User Flow

Open App → Type or Speak → Press Check → AI Analyzes → Results → Copy → Paste in messaging app → Send

## 8. Functional Requirements

### FR1 — Sentence Input

Type, edit, and submit French text.

### FR2 — Voice Input

Tap mic, speak, convert to text, review/edit before submission.

### FR3 — AI Analysis

Structured response:

1. **What I Understood** — English meaning inferred
2. **Correct Sentence** — most natural French version
3. **Changes Made** — table: You Wrote / Better French / Why
4. **Grammar Notes** — 2–3 lines max, simple language
5. **Quality Ratings** — grammar and naturalness of the **original** sentence

### FR4 — Copy Correction

One-tap copy to clipboard for messaging apps.

## 9. Non-Functional Requirements

- Results in under 5 seconds
- Desktop and mobile
- No onboarding or accounts
- Minimal clicks and context switching

## 10. Product Principles

1. **Optimize for communication** — not perfect grammar
2. **Every correction should teach something**
3. **Explain, don't overwhelm**
4. **Natural French first**
5. **Speed matters**

## 11. Competitive Positioning

| Product | Strength | Gap |
|---------|----------|-----|
| ChatGPT | Flexible | Too conversational for quick correction |
| Duolingo | Structured lessons | Not for real message writing |
| DeepL | Translations | Limited educational feedback |
| LanguageTool | Grammar | Not for beginner French messaging |

**Positioning:** Mot-à-Mot is designed for the moment right before a learner presses Send.
