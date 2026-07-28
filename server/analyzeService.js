import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { sanitizeVocabulary } from './vocabularySanitizer.js';

const CORRECTION_SYSTEM_PROMPT = `You are Mot-à-Mot, an AI messaging assistant for beginner French learners (A1–B1).

Your ONLY job in this task is sentence correction and explanation — NOT vocabulary extraction.

Rules:
- Provide TWO corrected French versions: informal (friends, family, texts) and formal (teachers, professional, exams)
- Both versions must be natural and correct — neither is "wrong"; they differ by communication context
- For "understood": a clear natural English explanation confirming what the learner intended to say
- explanations.informal: 3–5 lines on conversational shortcuts, spoken French, texting conventions
- explanations.formal: 3–5 lines on complete grammar, standard written conventions, professional use
- changes: show how the original sentence evolves in informal vs formal French (one row per meaningful change)
- Ratings are 0–100 integers for grammar and naturalness of the ORIGINAL user sentence
- If the learner provides a clarification of their intent, prioritize that meaning over a literal reading
- Never say "that's just how French works" — explain the underlying rule or pattern
- Return ONLY valid JSON matching the schema

Tone: friendly, calm, encouraging — like a patient French friend, never judgmental.`;

const CORRECTION_SCHEMA = {
  type: 'object',
  properties: {
    understood: {
      type: 'string',
      description: 'Natural English explanation confirming the learner intended message',
    },
    suggestions: {
      type: 'object',
      properties: {
        informal: {
          type: 'object',
          properties: {
            sentence: { type: 'string' },
          },
          required: ['sentence'],
        },
        formal: {
          type: 'object',
          properties: {
            sentence: { type: 'string' },
          },
          required: ['sentence'],
        },
      },
      required: ['informal', 'formal'],
    },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          youWrote: { type: 'string' },
          informalFrench: { type: 'string' },
          formalFrench: { type: 'string' },
        },
        required: ['youWrote', 'informalFrench', 'formalFrench'],
      },
    },
    explanations: {
      type: 'object',
      properties: {
        informal: { type: 'string' },
        formal: { type: 'string' },
      },
      required: ['informal', 'formal'],
    },
    ratings: {
      type: 'object',
      properties: {
        grammar: { type: 'integer' },
        naturalness: { type: 'integer' },
      },
      required: ['grammar', 'naturalness'],
    },
  },
  required: ['understood', 'suggestions', 'changes', 'explanations', 'ratings'],
};

const VOCABULARY_SYSTEM_PROMPT = `You are a French linguistics assistant for beginner learners (A1–B1).

Your ONLY job is complete vocabulary extraction — NOT sentence correction.

Perform a full linguistic analysis of every French sentence provided. Extract ALL meaningful vocabulary items, including:
- unchanged words
- corrected words
- function words learners need (je, ne, pas, me, etc.)
- multi-word expressions (keep as single items)

Lemma rules (dictionary form):
- Verbs: infinitive (laver, not lave; être, not suis)
- Adjectives: masculine singular lemma (fatigué, not fatiguée unless lemma differs)
- Nouns: singular form
- For multi-word expressions, lemma = the full expression (parce que, est-ce que, il y a, tout de suite, avoir besoin de, prendre soin de)

Surface form:
- The exact form as it appeared in the sentences (suis, lave, parce que, etc.)

Multi-word expressions must NEVER be split (never separate "parce" and "que").

CRITICAL negation rules:
- "ne" and "pas" are ALWAYS separate Negation Particle entries — never combine them
- NEVER create a verb entry for negated phrases (wrong: lemma "ne ... pas", surface "n'assiste pas")
- The verb in "Je n'assiste pas" is assister (lemma: assister, surface: assiste or n'assiste) — NOT a negation wrapper

Uniqueness:
- Exactly ONE entry per lemma + part of speech (never duplicate pouvoir or cours with different meanings)
- Meaning: concise dictionary-style (e.g. "to be able to" for pouvoir, "course; class" for cours)

Adjectives — REQUIRED four forms in adjectiveForms:
- masculineSingular, feminineSingular, masculinePlural, femininePlural
- Example: fatigué / fatiguée / fatigués / fatiguées

Part of speech — use one of:
Noun, Verb, Adjective, Adverb, Pronoun, Article / Determiner, Preposition, Conjunction, Expression, Negation Particle, Reflexive Pronoun

Example field: a short French example using the word (from the sentences when possible).

Extract comprehensively from ALL sentences provided. Return ONLY valid JSON matching the schema.`;

const VOCABULARY_SCHEMA = {
  type: 'object',
  properties: {
    vocabulary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lemma: { type: 'string', description: 'Dictionary form' },
          surface: { type: 'string', description: 'Form as it appeared in the text' },
          meaning: { type: 'string', description: 'English meaning' },
          partOfSpeech: { type: 'string' },
          example: { type: 'string', description: 'Short French example sentence' },
          adjectiveForms: {
            type: 'object',
            properties: {
              masculineSingular: { type: 'string' },
              feminineSingular: { type: 'string' },
              masculinePlural: { type: 'string' },
              femininePlural: { type: 'string' },
            },
          },
        },
        required: ['lemma', 'surface', 'meaning', 'partOfSpeech', 'example'],
      },
    },
  },
  required: ['vocabulary'],
};

export function isConfigured() {
  const { configuredProvider, hasGeminiKey, hasOpenAiKey } = getRuntimeConfig();
  if (configuredProvider === 'ollama') return !isVercel();
  if (configuredProvider === 'gemini') return hasGeminiKey;
  if (configuredProvider === 'openai') return hasOpenAiKey;
  return false;
}

export function getHealthStatus() {
  const { configuredProvider } = getRuntimeConfig();
  return {
    ok: true,
    provider: configuredProvider,
    configured: isConfigured(),
  };
}

function configurationMessage() {
  const { configuredProvider } = getRuntimeConfig();
  const envHint = isVercel()
    ? 'Add it in Vercel → Project → Settings → Environment Variables, then redeploy.'
    : 'Add it to your .env file and restart the server.';

  if (process.env.AI_PROVIDER?.trim().toLowerCase() === 'ollama' && isVercel()) {
    return 'Ollama only works on your local computer. On Vercel, set AI_PROVIDER=gemini and GEMINI_API_KEY in Environment Variables.';
  }

  if (configuredProvider === 'ollama') {
    return 'Ollama is not running. Install from https://ollama.com, run "ollama pull llama3.2", then restart.';
  }
  if (configuredProvider === 'gemini') {
    return `Gemini API key is missing. Get a free key at https://aistudio.google.com/apikey and ${envHint}`;
  }
  return `OpenAI API key is missing. ${envHint}`;
}

function mapAnalysisError(error) {
  const { configuredProvider } = getRuntimeConfig();
  const envHint = isVercel()
    ? 'Check GEMINI_API_KEY in Vercel Environment Variables and redeploy.'
    : 'Check GEMINI_API_KEY in .env and restart the server.';

  if (error?.provider === 'gemini' && error?.status === 429) {
    if (String(error.message).includes('limit: 0')) {
      return 'Your Google account has no free Gemini quota for this model. Create a new API key at https://aistudio.google.com/apikey';
    }
    return 'Gemini rate limit reached. Wait a minute and try again.';
  }

  if (error?.provider === 'gemini' && error.message?.includes('high demand')) {
    return "Google's AI servers are busy right now. Wait 30 seconds and try again.";
  }

  if (error?.provider === 'ollama') {
    return 'Ollama is not running. Install it from https://ollama.com, run "ollama pull llama3.2", keep Ollama open, then restart the app.';
  }

  if (error?.status === 401 || error?.code === 'invalid_api_key') {
    return configuredProvider === 'gemini'
      ? `Invalid Gemini API key. ${envHint}`
      : 'Invalid OpenAI API key. Check OPENAI_API_KEY and restart the server.';
  }

  if (
    configuredProvider === 'openai' &&
    (error?.status === 429 ||
      error?.code === 'insufficient_quota' ||
      error?.type === 'insufficient_quota')
  ) {
    return 'Your OpenAI account has no remaining credits. Switch to AI_PROVIDER=gemini for a free option.';
  }

  if (error?.isNetworkError || String(error?.message).includes('fetch failed')) {
    return 'Could not reach Gemini. Check your internet connection and try again in a moment.';
  }

  return error?.message ?? "We couldn't check your sentence right now. Please try again.";
}

function buildCorrectionPrompt(sentence, clarification) {
  let prompt = `Correct this French message and return structured feedback:\n\n"${sentence}"`;

  const clarificationText = clarification?.text?.trim();
  if (clarificationText) {
    if (clarification.mode === 'english') {
      prompt += `\n\nThe learner clarified their intended meaning in English:\n"${clarificationText}"\n\nUse this to interpret what they meant.`;
    } else {
      prompt += `\n\nThe learner rewrote what they meant in French:\n"${clarificationText}"\n\nUse this to interpret their intent.`;
    }
  }

  return prompt;
}

function buildVocabularyPrompt(originalSentence, informalSentence, formalSentence) {
  return `Extract ALL meaningful vocabulary from these French sentences.

Original (learner wrote):
"${originalSentence}"

Corrected (informal):
"${informalSentence}"

Corrected (formal):
"${formalSentence}"

Include every meaningful item from all three sentences. Use lemma (dictionary) form for storage. Preserve surface forms. Keep multi-word expressions together.`;
}

async function runCorrection(config, sentence, clarification) {
  return generateStructured(config, {
    systemPrompt: CORRECTION_SYSTEM_PROMPT,
    userPrompt: buildCorrectionPrompt(sentence, clarification),
    schema: CORRECTION_SCHEMA,
    schemaName: 'french_correction',
    ollamaSchemaHint:
      'Keys: understood, suggestions ({informal: {sentence}, formal: {sentence}}), changes (array of {youWrote, informalFrench, formalFrench}), explanations ({informal, formal}), ratings ({grammar, naturalness}).',
  });
}

async function runVocabularyExtraction(config, originalSentence, informalSentence, formalSentence) {
  return generateStructured(config, {
    systemPrompt: VOCABULARY_SYSTEM_PROMPT,
    userPrompt: buildVocabularyPrompt(originalSentence, informalSentence, formalSentence),
    schema: VOCABULARY_SCHEMA,
    schemaName: 'french_vocabulary',
    ollamaSchemaHint:
      'Keys: vocabulary (array of {lemma, surface, meaning, partOfSpeech, example}).',
  });
}

export async function analyzeSentence(input) {
  const sentence = typeof input === 'string' ? input : input?.sentence;
  const clarification = typeof input === 'object' ? input?.clarification : undefined;
  const trimmed = typeof sentence === 'string' ? sentence.trim() : '';

  if (!trimmed) {
    return { status: 400, body: { message: 'Please enter a French sentence.' } };
  }

  if (clarification && !clarification.text?.trim()) {
    return { status: 400, body: { message: 'Please tell us what you intended to say.' } };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();

  try {
    // Task 1: Sentence correction (informal + formal + explanations)
    const correction = await runCorrection(config, trimmed, clarification);

    // Task 2: Linguistic vocabulary extraction (both original + corrected sentences)
    let vocabulary = [];
    try {
      const vocabResult = await runVocabularyExtraction(
        config,
        trimmed,
        correction.suggestions.informal.sentence,
        correction.suggestions.formal.sentence,
      );
      vocabulary = sanitizeVocabulary(vocabResult.vocabulary ?? []);
    } catch (vocabError) {
      console.warn('Vocabulary extraction failed (correction still returned):', vocabError);
    }

    return {
      status: 200,
      body: {
        ...correction,
        vocabulary,
      },
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return { status: 500, body: { message: mapAnalysisError(error) } };
  }
}
