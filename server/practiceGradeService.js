import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured, configurationMessage } from './analyzeService.js';

const COMPONENT_WEIGHTS = {
  meaning: 0.4,
  grammar: 0.3,
  vocabulary: 0.2,
  naturalness: 0.1,
};

const MEANING_GATE_THRESHOLD = 0.6;
const MEANING_GATE_MAX_SCORE = 0.5;

const PRACTICE_GRADE_SYSTEM_PROMPT = `You are Mot-à-Mot's Practice grader for Write in French exercises.

The learner completed a structured practice task — NOT free-form Check mode.

Score each component from 0.00 to 1.00 (two decimal places):
- meaning (40%): Did they communicate the intended idea from the prompt?
- grammar (30%): Correctness — conjugation, agreement, spelling, word order.
- vocabulary (20%): Appropriate words, especially toolbox target words when relevant.
- naturalness (10%): Sounds like real French — smallest weight; do not punish understandable awkward phrasing heavily.

Hierarchical mindset:
1. Can a French speaker understand what they intended?
2. Then grammar, vocabulary, naturalness.

If meaning is seriously wrong (e.g. "tomorrow" rendered as "hier"), meaning should be low (0.10–0.40) even if grammar is perfect.

Examples:
- "Je suis fatigué aujourd'hui" for "I'm tired today" → meaning 1.0, grammar 1.0, vocabulary 1.0, naturalness 1.0
- "Je suis fatigue aujourd'hui" (missing accent) → meaning 1.0, grammar ~0.83, vocabulary 1.0, naturalness 1.0
- "Je vais hier" for "I am going tomorrow" → meaning ~0.10–0.25, grammar 1.0, vocabulary 1.0, naturalness 1.0

Also return:
- suggestedAnswer: one strong model answer in everyday written French for this task
- feedback: 1–3 sentences explaining the score in plain English (the "Why?" note)
- headline: short encouragement like "Great job!", "Nice work!", "Good effort!", or "Keep practicing!"
- acceptedAlternatives: other valid French answers (empty array if none)
- confidence: 0–1 how confident you are in these scores

Do NOT return an overall score — the server computes it from components.
Return ONLY valid JSON.`;

const PRACTICE_GRADE_SCHEMA = {
  type: 'object',
  properties: {
    meaning: { type: 'number' },
    grammar: { type: 'number' },
    vocabulary: { type: 'number' },
    naturalness: { type: 'number' },
    confidence: { type: 'number' },
    feedback: { type: 'string' },
    suggestedAnswer: { type: 'string' },
    headline: { type: 'string' },
    acceptedAlternatives: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['meaning', 'grammar', 'vocabulary', 'naturalness', 'feedback', 'suggestedAnswer'],
};

function clampUnit(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export function computePracticeOverall(components) {
  const meaning = clampUnit(components.meaning);
  const grammar = clampUnit(components.grammar);
  const vocabulary = clampUnit(components.vocabulary);
  const naturalness = clampUnit(components.naturalness);

  let overall =
    meaning * COMPONENT_WEIGHTS.meaning +
    grammar * COMPONENT_WEIGHTS.grammar +
    vocabulary * COMPONENT_WEIGHTS.vocabulary +
    naturalness * COMPONENT_WEIGHTS.naturalness;

  if (meaning < MEANING_GATE_THRESHOLD) {
    overall = Math.min(overall, MEANING_GATE_MAX_SCORE);
  }

  return {
    meaning,
    grammar,
    vocabulary,
    naturalness,
    overall: Math.round(overall * 100) / 100,
  };
}

function buildGradeUserPrompt({ sentence, practicePrompt }) {
  const words = (practicePrompt.targetWords ?? []).join(', ');
  const englishPrompt = practicePrompt.englishPrompt
    ? `\nEnglish prompt: "${practicePrompt.englishPrompt}"`
    : '';

  return `Practice task: ${practicePrompt.title}
Instruction: ${practicePrompt.instruction}${englishPrompt}
Toolbox words to consider: ${words || 'none specified'}

Learner's French answer:
"${sentence}"`;
}

function normalizeGradeResult(raw, sentence) {
  const scores = computePracticeOverall({
    meaning: raw?.meaning,
    grammar: raw?.grammar,
    vocabulary: raw?.vocabulary,
    naturalness: raw?.naturalness,
  });

  const feedback = String(raw?.feedback ?? '').trim();
  const suggestedAnswer = String(raw?.suggestedAnswer ?? '').trim();
  const headline = String(raw?.headline ?? '').trim();

  return {
    meaning: scores.meaning,
    grammar: scores.grammar,
    vocabulary: scores.vocabulary,
    naturalness: scores.naturalness,
    overall: scores.overall,
    confidence: clampUnit(raw?.confidence ?? 0.85),
    feedback: feedback || 'Compare your answer with the suggested answer and notice any differences.',
    suggestedAnswer: suggestedAnswer || sentence,
    headline:
      headline ||
      (scores.overall >= 0.95
        ? 'Great job!'
        : scores.overall >= 0.8
          ? 'Nice work!'
          : scores.overall >= 0.6
            ? 'Good effort!'
            : 'Keep practicing!'),
    acceptedAlternatives: Array.isArray(raw?.acceptedAlternatives)
      ? raw.acceptedAlternatives.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

export async function gradePracticeExercise(body) {
  const sentence = String(body?.sentence ?? '').trim();
  const practicePrompt = body?.practicePrompt;

  if (!sentence) {
    return { status: 400, body: { message: 'Please enter a French sentence.' } };
  }

  if (!practicePrompt?.instruction) {
    return { status: 400, body: { message: 'Practice prompt is required.' } };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();

  try {
    const result = await generateStructured(config, {
      systemPrompt: PRACTICE_GRADE_SYSTEM_PROMPT,
      userPrompt: buildGradeUserPrompt({ sentence, practicePrompt }),
      schema: PRACTICE_GRADE_SCHEMA,
      schemaName: 'practice_exercise_grade',
      ollamaSchemaHint:
        'Keys: meaning, grammar, vocabulary, naturalness (0-1), feedback, suggestedAnswer, headline, acceptedAlternatives, confidence.',
      temperature: 0.2,
    });

    return {
      status: 200,
      body: normalizeGradeResult(result, sentence),
    };
  } catch (error) {
    console.error('Practice grading error:', error);
    const envHint = isVercel()
      ? 'Add it in Vercel → Project → Settings → Environment Variables, then redeploy.'
      : 'Add it to your .env file and restart the server.';
    return {
      status: 500,
      body: {
        message: error?.message?.includes('API key')
          ? `AI is not configured. ${envHint}`
          : "We couldn't grade your answer right now. Please try again.",
      },
    };
  }
}
