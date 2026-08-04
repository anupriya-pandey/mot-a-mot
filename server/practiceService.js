import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured } from './analyzeService.js';

const READINESS_MIN_ENTRIES = 25;
const READINESS_MIN_CATEGORIES = 5;
const CORE_CATEGORIES = ['Verbs', 'Nouns', 'Adjectives', 'Pronouns', 'Prepositions', 'Adverbs'];

const STAGE_CONFIG = {
  quick: {
    minEntries: 15,
    types: ['fill_blank', 'match_meaning', 'find_error', 'multiple_choice'],
    intro: 'Quick Practice',
  },
  sentence: {
    minEntries: 40,
    types: ['translation', 'question_answer', 'build_sentence'],
    intro: 'Sentence Builder',
  },
};

const QUICK_SYSTEM_PROMPT = `You are Mot-à-Mot's Quick Practice engine. Create structured French exercises ONLY from the learner's toolbox.

RULES:
- Every target word MUST come from the toolbox list.
- Mix exercise types: fill_blank, match_meaning, find_error, multiple_choice.
- Spread questions across grammatical categories (verbs, nouns, adjectives, pronouns, prepositions, etc.).
- When focusing on Verbs: vary subject forms (je, tu, il/elle, nous, vous, ils/elles) across questions.
- When focusing on Adjectives: vary agreement (masculine/feminine, singular/plural) across questions.
- formFocus: note the form tested, e.g. "je — present" or "feminine plural".
- Use English for instructions. correctAnswer must match one option id or exact expected text.
- id: stable slug like "fill-verb-aller-je" — unique per question.
- NEVER repeat a question whose id appears in the avoid list.
- Randomize order and word selection each session.

Exercise types:
- fill_blank: sentenceWithBlank uses "___" for the blank; correctAnswer is the French word/phrase.
- match_meaning: instruction asks to pick the English meaning; options are English; correctAnswer is option id.
- find_error: flawedSentence has one error using toolbox words; options describe the fix; correctAnswer is option id.
- multiple_choice: French question with 4 options; correctAnswer is option id.

Return exactly 5 exercises. Return ONLY valid JSON.`;

const SENTENCE_SYSTEM_PROMPT = `You are Mot-à-Mot's Sentence Builder engine. Create production exercises ONLY from the learner's toolbox.

RULES:
- Every target word MUST come from the toolbox list.
- Mix types: translation, question_answer, build_sentence.
- Spread across grammatical categories; vary verb persons and adjective agreements.
- translation: englishPrompt in English; learner writes French using target words.
- question_answer: instruction sets a scenario; learner answers in French.
- build_sentence: instruction asks to build a sentence using target words.
- formFocus: note verb/adjective form when relevant.
- id: stable unique slug. NEVER repeat ids from the avoid list.
- Use English for instructions.

Return exactly 5 exercises. Return ONLY valid JSON.`;

const EXERCISE_SCHEMA = {
  type: 'object',
  properties: {
    estimatedMinutes: { type: 'string' },
    prompts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          index: { type: 'integer' },
          type: {
            type: 'string',
            enum: [
              'fill_blank',
              'match_meaning',
              'find_error',
              'multiple_choice',
              'translation',
              'question_answer',
              'build_sentence',
            ],
          },
          title: { type: 'string' },
          instruction: { type: 'string' },
          targetWords: { type: 'array', items: { type: 'string' } },
          focusCategory: { type: 'string' },
          formFocus: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
              required: ['id', 'text'],
            },
          },
          correctAnswer: { type: 'string' },
          explanation: { type: 'string' },
          sentenceWithBlank: { type: 'string' },
          flawedSentence: { type: 'string' },
          englishPrompt: { type: 'string' },
        },
        required: ['id', 'index', 'type', 'title', 'instruction', 'targetWords', 'correctAnswer'],
      },
    },
  },
  required: ['estimatedMinutes', 'prompts'],
};

function configurationMessage() {
  const { configuredProvider } = getRuntimeConfig();
  const envHint = isVercel()
    ? 'Add it in Vercel → Project → Settings → Environment Variables, then redeploy.'
    : 'Add it to your .env file and restart the server.';

  if (configuredProvider === 'gemini') {
    return `Gemini API key is missing. Get a free key at https://aistudio.google.com/apikey and ${envHint}`;
  }
  if (configuredProvider === 'openai') {
    return `OpenAI API key is missing. ${envHint}`;
  }
  return 'AI provider is not configured.';
}

function countCoreCategories(entries) {
  const present = new Set();
  for (const entry of entries) {
    const category = entry.partOfSpeech ?? '';
    if (CORE_CATEGORIES.includes(category) && category) {
      present.add(category);
    }
  }
  return present.size;
}

function filterEntries(entries, focusCategory) {
  if (!focusCategory || focusCategory === 'all') return entries;
  return entries.filter((entry) => entry.partOfSpeech === focusCategory);
}

function groupToolboxByCategory(entries) {
  const grouped = {};

  for (const entry of entries) {
    const category = entry.partOfSpeech ?? 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({
      lemma: entry.lemma,
      meaning: entry.meaning,
    });
  }

  return grouped;
}

function buildUserPrompt({ entries, stage, focusCategory, completedQuestionIds }) {
  const grouped = groupToolboxByCategory(entries);
  const stageConfig = STAGE_CONFIG[stage];

  const lines = Object.entries(grouped)
    .map(([category, items]) => {
      const wordList = items.map((item) => `${item.lemma} (${item.meaning})`).join(', ');
      return `${category}: ${wordList}`;
    })
    .join('\n');

  const focusLine =
    focusCategory && focusCategory !== 'all'
      ? `\nFOCUS: Emphasize ${focusCategory} in every question. Still use supporting words from other categories when natural.`
      : '\nFOCUS: Spread questions evenly across all grammatical categories in the toolbox.';

  const avoidLine =
    completedQuestionIds.length > 0
      ? `\nAVOID these question ids (already completed):\n${completedQuestionIds.slice(0, 100).join(', ')}`
      : '';

  return `Stage: ${stageConfig.intro}
Toolbox size: ${entries.length} entries
Allowed exercise types: ${stageConfig.types.join(', ')}
${focusLine}
${avoidLine}

${lines}

Generate 5 randomized exercises using ONLY words from this toolbox.`;
}

function buildQuestionFingerprint(type, focusCategory, targetWords, title) {
  const words = [...(targetWords ?? [])]
    .map((word) => String(word).trim().toLowerCase())
    .sort()
    .join('|');
  const category = (focusCategory ?? 'mixed').trim().toLowerCase();
  const label = String(title ?? '').trim().toLowerCase();
  return `${type}::${category}::${words}::${label}`;
}

function normalizePrompts(rawPrompts, stage) {
  if (!Array.isArray(rawPrompts)) return [];

  const allowedTypes = STAGE_CONFIG[stage]?.types ?? [];

  return rawPrompts
    .map((prompt, index) => {
      const type = String(prompt.type ?? '').trim();
      const targetWords = (Array.isArray(prompt.targetWords) ? prompt.targetWords : [])
        .map((word) => String(word).trim())
        .filter(Boolean);
      const title = String(prompt.title ?? 'Practice').trim();
      const id =
        String(prompt.id ?? '').trim() ||
        buildQuestionFingerprint(type, prompt.focusCategory, targetWords, title);

      return {
        id,
        index: typeof prompt.index === 'number' ? prompt.index : index + 1,
        stage,
        type,
        title,
        instruction: String(prompt.instruction ?? '').trim(),
        targetWords,
        focusCategory: prompt.focusCategory ? String(prompt.focusCategory).trim() : undefined,
        formFocus: prompt.formFocus ? String(prompt.formFocus).trim() : undefined,
        options: Array.isArray(prompt.options)
          ? prompt.options
              .map((option) => ({
                id: String(option.id ?? '').trim(),
                text: String(option.text ?? '').trim(),
              }))
              .filter((option) => option.id && option.text)
          : undefined,
        correctAnswer: String(prompt.correctAnswer ?? '').trim(),
        explanation: prompt.explanation ? String(prompt.explanation).trim() : undefined,
        sentenceWithBlank: prompt.sentenceWithBlank
          ? String(prompt.sentenceWithBlank).trim()
          : undefined,
        flawedSentence: prompt.flawedSentence ? String(prompt.flawedSentence).trim() : undefined,
        englishPrompt: prompt.englishPrompt ? String(prompt.englishPrompt).trim() : undefined,
      };
    })
    .filter(
      (prompt) =>
        prompt.targetWords.length > 0 &&
        prompt.correctAnswer &&
        prompt.instruction &&
        allowedTypes.includes(prompt.type),
    )
    .slice(0, 5);
}

function dedupePrompts(prompts, completedQuestionIds) {
  const completed = new Set(completedQuestionIds ?? []);
  const seen = new Set();
  return prompts.filter((prompt) => {
    if (completed.has(prompt.id) || seen.has(prompt.id)) return false;
    seen.add(prompt.id);
    return true;
  });
}

export async function generatePracticeSession(body) {
  const allEntries = Array.isArray(body?.toolboxEntries) ? body.toolboxEntries : [];
  const stage = body?.stage === 'sentence' ? 'sentence' : body?.stage === 'quick' ? 'quick' : null;
  const focusCategory = body?.focusCategory ?? 'all';
  const completedQuestionIds = Array.isArray(body?.completedQuestionIds)
    ? body.completedQuestionIds.map(String)
    : [];

  if (!stage) {
    return { status: 400, body: { message: 'Please choose a practice stage.' } };
  }

  const coreCategories = countCoreCategories(allEntries);
  if (allEntries.length < READINESS_MIN_ENTRIES || coreCategories < READINESS_MIN_CATEGORIES) {
    return {
      status: 400,
      body: {
        message:
          'Keep building your toolbox — Practice unlocks with enough entries and grammatical variety.',
      },
    };
  }

  const stageMin = STAGE_CONFIG[stage].minEntries;
  if (allEntries.length < stageMin) {
    return {
      status: 400,
      body: {
        message: `This stage unlocks at ${stageMin} toolbox entries. Keep collecting French first.`,
      },
    };
  }

  const entries = filterEntries(allEntries, focusCategory);
  if (entries.length < 3) {
    return {
      status: 400,
      body: {
        message:
          focusCategory && focusCategory !== 'all'
            ? `Not enough ${focusCategory} in your toolbox for a focused session. Try "All categories" or add more words.`
            : 'Add more entries to your toolbox before starting practice.',
      },
    };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();
  const systemPrompt = stage === 'quick' ? QUICK_SYSTEM_PROMPT : SENTENCE_SYSTEM_PROMPT;

  try {
    const result = await generateStructured(config, {
      systemPrompt,
      userPrompt: buildUserPrompt({ entries, stage, focusCategory, completedQuestionIds }),
      schema: EXERCISE_SCHEMA,
      schemaName: 'practice_session',
      ollamaSchemaHint:
        'Keys: estimatedMinutes, prompts (array of 5 exercises with id, type, instruction, targetWords, correctAnswer, options?).',
      temperature: 0.5,
    });

    let prompts = dedupePrompts(
      normalizePrompts(result?.prompts, stage),
      completedQuestionIds,
    );

    if (prompts.length < 5) {
      console.warn('Practice session returned fewer than 5 unique prompts — retrying once.');
      const retry = await generateStructured(config, {
        systemPrompt,
        userPrompt: `${buildUserPrompt({ entries, stage, focusCategory, completedQuestionIds })}\n\nIMPORTANT: Previous batch had duplicates. Generate 5 entirely NEW question ids.`,
        schema: EXERCISE_SCHEMA,
        schemaName: 'practice_session_retry',
        ollamaSchemaHint: 'Same as practice_session.',
        temperature: 0.6,
      });

      prompts = dedupePrompts(
        [...prompts, ...normalizePrompts(retry?.prompts, stage)],
        completedQuestionIds,
      ).slice(0, 5);
    }

    if (prompts.length < 3) {
      return {
        status: 500,
        body: {
          message:
            "We couldn't build enough new questions. Try a different focus or add more toolbox words.",
        },
      };
    }

    return {
      status: 200,
      body: {
        stage,
        focusCategory,
        estimatedMinutes: String(result?.estimatedMinutes ?? '4–5').trim(),
        prompts,
      },
    };
  } catch (error) {
    console.error('Practice session generation failed:', error);
    return {
      status: 500,
      body: { message: "We couldn't create your practice session right now. Please try again." },
    };
  }
}
