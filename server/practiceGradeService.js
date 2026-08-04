import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured, configurationMessage } from './analyzeService.js';
import { sentenceUsesAllTargetWords, sentenceUsesTargetWord } from './frenchWordForms.js';

const COMPONENT_WEIGHTS = {
  meaning: 0.4,
  grammar: 0.3,
  vocabulary: 0.2,
  naturalness: 0.1,
};

const MEANING_GATE_THRESHOLD = 0.6;
const MEANING_GATE_MAX_SCORE = 0.5;

const TRANSLATION_GRADE_SYSTEM_PROMPT = `You are Mot-à-Mot's grader for English→French translation exercises.

BINARY scoring — the learner gets 1 point or 0:
- Award a PASS (all component scores = 1.0) ONLY if the French translation conveys the English meaning EXACTLY and is fully grammatically correct.
- Any wrong meaning, missing nuance, added information, or grammar/spelling/agreement error → FAIL (all component scores = 0.0).
- Accept valid alternative phrasings ONLY if meaning stays exact and grammar is correct.
- Required toolbox words must appear in the translation where natural — conjugated verb forms count (e.g. « aller » satisfied by allez, vais, va).

Return meaning, grammar, vocabulary, and naturalness each as exactly 1.0 (pass) or 0.0 (fail).
Also return suggestedAnswer (model translation in French), feedback (1–3 sentences in plain ENGLISH explaining pass/fail — never French), headline (English encouragement), acceptedAlternatives, confidence.
Do NOT return overall — the server computes it.
Return ONLY valid JSON.`;

const QUESTION_ANSWER_GRADE_SYSTEM_PROMPT = `You are Mot-à-Mot's grader for French Question & Answer exercises.

The learner read a French prompt and answered in French.

Score each component from 0.00 to 1.00:
- meaning (40%): Does the answer appropriately address the French prompt?
- grammar (30%): Correct French — conjugation, agreement, spelling, word order.
- vocabulary (20%): Required toolbox word(s) must appear in the answer — conjugated forms count (e.g. « manger » satisfied by mange, manges, mangeons).
- naturalness (10%): Coherent, conversational response.

If required toolbox words are missing, vocabulary must be ≤ 0.25.

Return suggestedAnswer (French), feedback (1–3 sentences in plain ENGLISH — the "Why?" note; never write feedback in French), headline (English), acceptedAlternatives, confidence.
Do NOT return overall — the server computes it.
Return ONLY valid JSON.`;

const BUILD_SENTENCE_GRADE_SYSTEM_PROMPT = `You are Mot-à-Mot's grader for Build a Sentence exercises.

The learner wrote ONE cohesive French sentence using multiple required toolbox words.

Score each component from 0.00 to 1.00:
- vocabulary (20%): Every required toolbox word must appear — conjugated forms count; if any lemma is missing, vocabulary ≤ 0.25.
- meaning (40%): The sentence is coherent and reads as one unified idea, not a word list.
- grammar (30%): Correct French.
- naturalness (10%): Sounds like a real sentence a French speaker might say.

Return suggestedAnswer (one model sentence in French), feedback (1–3 sentences in plain ENGLISH explaining the score — the "Why?" note; NEVER write feedback in French), headline (short English encouragement), acceptedAlternatives, confidence.
Do NOT return overall — the server computes it.
Return ONLY valid JSON.`;

const PRACTICE_GRADE_SCHEMA = {
  type: 'object',
  properties: {
    meaning: { type: 'number' },
    grammar: { type: 'number' },
    vocabulary: { type: 'number' },
    naturalness: { type: 'number' },
    confidence: { type: 'number' },
    feedback: { type: 'string', description: 'Plain English explanation for the learner (Why?) — never French' },
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

function getGradeSystemPrompt(exerciseType) {
  if (exerciseType === 'translation') return TRANSLATION_GRADE_SYSTEM_PROMPT;
  if (exerciseType === 'question_answer') return QUESTION_ANSWER_GRADE_SYSTEM_PROMPT;
  if (exerciseType === 'build_sentence') return BUILD_SENTENCE_GRADE_SYSTEM_PROMPT;
  return QUESTION_ANSWER_GRADE_SYSTEM_PROMPT;
}

function buildGradeUserPrompt({ sentence, practicePrompt }) {
  const words = (practicePrompt.targetWords ?? []).join(', ');
  const type = practicePrompt.type ?? 'translation';

  if (type === 'translation') {
    return `Exercise type: Translation (English → French)
English sentence to translate:
"${practicePrompt.englishPrompt ?? ''}"

Toolbox words to use in the translation: ${words || 'none specified'}

Learner's French translation:
"${sentence}"`;
  }

  if (type === 'question_answer') {
    return `Exercise type: Question & answer
French prompt the learner read:
"${practicePrompt.frenchPrompt ?? ''}"

Toolbox words the answer should include: ${words || 'none specified'}

Learner's French answer:
"${sentence}"`;
  }

  return `Exercise type: Build a sentence
Required toolbox words (ALL must appear in one cohesive sentence): ${words || 'none specified'}

Learner's French sentence:
"${sentence}"

Write feedback and headline in plain English only. suggestedAnswer must be in French.`;
}

function answerIncludesTargetWord(sentence, targetWords) {
  return (targetWords ?? []).some((word) => sentenceUsesTargetWord(sentence, word));
}

function answerIncludesAllTargetWords(sentence, targetWords) {
  return sentenceUsesAllTargetWords(sentence, targetWords);
}

function applyTargetWordRequirement(grading, sentence, targetWords, exerciseType) {
  const normalizedSentence = String(sentence ?? '').trim().toLowerCase();
  const normalizedSuggested = String(grading?.suggestedAnswer ?? '').trim().toLowerCase();
  if (normalizedSuggested && normalizedSuggested === normalizedSentence) {
    return grading;
  }

  const wordsPresent =
    exerciseType === 'build_sentence'
      ? answerIncludesAllTargetWords(sentence, targetWords)
      : answerIncludesTargetWord(sentence, targetWords);

  if (!targetWords?.length || wordsPresent) {
    return grading;
  }

  const missing = targetWords.map((word) => `« ${word} »`).join(', ');
  const adjusted = {
    ...grading,
    vocabulary: Math.min(grading.vocabulary, 0.25),
    feedback: `Your answer must include ${missing}. ${grading.feedback}`,
  };

  if (exerciseType === 'translation') {
    return normalizeTranslationGrade(adjusted, sentence);
  }

  const scores = computePracticeOverall(adjusted);
  return {
    ...adjusted,
    meaning: scores.meaning,
    grammar: scores.grammar,
    vocabulary: scores.vocabulary,
    naturalness: scores.naturalness,
    overall: scores.overall,
  };
}

function normalizeTranslationGrade(raw, sentence) {
  const meaning = clampUnit(raw?.meaning);
  const grammar = clampUnit(raw?.grammar);
  const vocabulary = clampUnit(raw?.vocabulary);
  const naturalness = clampUnit(raw?.naturalness);
  const pass = meaning >= 0.99 && grammar >= 0.99 && vocabulary >= 0.99 && naturalness >= 0.99;
  const score = pass ? 1 : 0;

  const feedback = String(raw?.feedback ?? '').trim();
  const suggestedAnswer = String(raw?.suggestedAnswer ?? '').trim();
  const headline = String(raw?.headline ?? '').trim();

  return {
    meaning: score,
    grammar: score,
    vocabulary: score,
    naturalness: score,
    overall: score,
    confidence: clampUnit(raw?.confidence ?? 0.85),
    feedback:
      feedback ||
      (pass
        ? 'Exact meaning and correct grammar — full credit.'
        : 'The translation must convey the English meaning exactly and be grammatically correct.'),
    suggestedAnswer: suggestedAnswer || sentence,
    headline: headline || (pass ? 'Perfect translation!' : 'Not quite — compare with the model answer.'),
    acceptedAlternatives: Array.isArray(raw?.acceptedAlternatives)
      ? raw.acceptedAlternatives.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

function normalizeRubricGradeResult(raw, sentence) {
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

function normalizeGradeResult(raw, sentence, exerciseType) {
  if (exerciseType === 'translation') {
    return normalizeTranslationGrade(raw, sentence);
  }
  return normalizeRubricGradeResult(raw, sentence);
}

export async function gradePracticeExercise(body) {
  const sentence = String(body?.sentence ?? '').trim();
  const practicePrompt = body?.practicePrompt;
  const exerciseType = practicePrompt?.type ?? 'translation';

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
      systemPrompt: getGradeSystemPrompt(exerciseType),
      userPrompt: buildGradeUserPrompt({ sentence, practicePrompt }),
      schema: PRACTICE_GRADE_SCHEMA,
      schemaName: 'practice_exercise_grade',
      ollamaSchemaHint:
        'Keys: meaning, grammar, vocabulary, naturalness (0-1), feedback (English only), suggestedAnswer (French), headline (English), acceptedAlternatives, confidence.',
      temperature: 0.2,
    });

    return {
      status: 200,
      body: applyTargetWordRequirement(
        normalizeGradeResult(result, sentence, exerciseType),
        sentence,
        practicePrompt.targetWords,
        exerciseType,
      ),
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
