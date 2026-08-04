import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured } from './analyzeService.js';

const READINESS_TARGETS = {
  entries: 25,
  categories: 5,
  verbs: 5,
};

const READINESS_WEIGHTS = {
  entries: 0.45,
  categories: 0.35,
  verbs: 0.2,
};

const CORE_CATEGORIES = ['Verbs', 'Nouns', 'Adjectives', 'Pronouns', 'Prepositions', 'Adverbs'];

const STAGE_CONFIG = {
  quick: {
    minEntries: 15,
    types: ['fill_blank', 'match_meaning', 'find_error', 'multiple_choice'],
    intro: 'Spot & Match',
  },
  sentence: {
    minEntries: 40,
    types: ['translation', 'question_answer', 'build_sentence'],
    intro: 'Write in French',
  },
};

const QUICK_SYSTEM_PROMPT = `You are Mot-à-Mot's Spot & Match engine. Create structured French exercises ONLY from the learner's toolbox.

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
- For match_meaning, find_error, and multiple_choice: provide exactly 4 options with UNIQUE text — no duplicates, no near-duplicates.

Exercise types:
- fill_blank: sentenceWithBlank uses "___" for the blank; correctAnswer is the French word/phrase.
- match_meaning: instruction asks to pick the English meaning; options are English; correctAnswer is option id.
- find_error: flawedSentence has one error using toolbox words; options describe the fix; correctAnswer is option id.
- multiple_choice: French question with 4 distinct options; correctAnswer is option id.

Return exactly 5 exercises. Return ONLY valid JSON.`;

const SENTENCE_SYSTEM_PROMPT = `You are Mot-à-Mot's Write in French engine. Create production exercises ONLY from the learner's toolbox.

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

function factorScore(current, target) {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

function countVerbs(entries) {
  return entries.filter((entry) => entry.partOfSpeech === 'Verbs').length;
}

function computeReadinessScore(entries) {
  const totalEntries = entries.length;
  const coreCategoryCount = countCoreCategories(entries);
  const verbCount = countVerbs(entries);

  const entriesScore = factorScore(totalEntries, READINESS_TARGETS.entries);
  const categoriesScore = factorScore(coreCategoryCount, READINESS_TARGETS.categories);
  const verbsScore = factorScore(verbCount, READINESS_TARGETS.verbs);

  const score = Math.round(
    entriesScore * READINESS_WEIGHTS.entries +
      categoriesScore * READINESS_WEIGHTS.categories +
      verbsScore * READINESS_WEIGHTS.verbs,
  );

  return { score, unlocked: score >= 100 };
}

function dedupeOptions(options) {
  if (!Array.isArray(options)) return undefined;

  const seen = new Set();
  const deduped = [];

  for (const option of options) {
    const id = String(option?.id ?? '').trim();
    const text = String(option?.text ?? '').trim();
    const key = text.toLowerCase();
    if (!id || !text || seen.has(key)) continue;
    seen.add(key);
    deduped.push({ id, text });
  }

  return deduped.length > 0 ? deduped : undefined;
}

function isValidChoicePrompt(prompt) {
  const choiceTypes = ['multiple_choice', 'match_meaning', 'find_error'];
  if (!choiceTypes.includes(prompt.type)) return true;
  if (!prompt.options || prompt.options.length < 2) return false;

  const optionIds = new Set(prompt.options.map((option) => option.id));
  return optionIds.has(prompt.correctAnswer);
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

  return `Mode: ${stageConfig.intro}
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
        options: dedupeOptions(prompt.options),
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
        allowedTypes.includes(prompt.type) &&
        isValidChoicePrompt(prompt),
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
    return { status: 400, body: { message: 'Please choose a practice mode.' } };
  }

  const readiness = computeReadinessScore(allEntries);
  if (!readiness.unlocked) {
    return {
      status: 400,
      body: {
        message:
          'Practice unlocks at 100% readiness — keep building your toolbox and checking sentences.',
      },
    };
  }

  const stageMin = STAGE_CONFIG[stage].minEntries;
  if (allEntries.length < stageMin) {
    return {
      status: 400,
      body: {
        message: `This mode unlocks at ${stageMin} toolbox entries. Keep collecting French first.`,
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
