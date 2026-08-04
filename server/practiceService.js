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
    types: ['fill_blank', 'match_meaning', 'match_following', 'find_error', 'multiple_choice'],
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
- Every targetWords entry MUST come from the toolbox list (internal use — NOT shown to learner).
- hints: 1–3 ENGLISH strings that guide the learner WITHOUT revealing the French answer.
  - Good: "Use the verb meaning 'to go', je form, present tense", "Think of a word for 'market'", "Watch adjective agreement — feminine singular"
  - Bad: showing the French lemma, conjugated form, or exact word that fills the blank
- explanation: REQUIRED for every exercise — a short English note shown when the learner gets it wrong (and on success when helpful).
- Mix exercise types: fill_blank, match_meaning, match_following, find_error, multiple_choice.
- CRITICAL: Every question MUST show French text the learner responds to. Never ask about a French word without displaying it. Never ask to complete a sentence without showing the French sentence.
- Spread questions across grammatical categories; vary verb persons and adjective agreements.
- Use English for instructions only. correctAnswer must match one option id or exact expected text.
- id: stable unique slug. NEVER repeat ids from the avoid list.
- For choice-based types: exactly 4 UNIQUE options — no duplicate text.

Exercise types:
- fill_blank: sentenceWithBlank REQUIRED — French sentence with "___" for the blank; correctAnswer is the French word/phrase; hints in English only.
- match_meaning: frenchPrompt REQUIRED — the French toolbox word displayed large (e.g. "aujourd'hui"); options are English meanings only; correctAnswer is option id.
- match_following: matchRows = 3–4 {id, french} pairs from toolbox; options = shuffled English meanings; correctAnswer = JSON mapping row id → option id.
- find_error: flawedSentence REQUIRED — full French sentence with one error; options describe fixes in English; correctAnswer is option id.
- multiple_choice: sentenceWithBlank REQUIRED — French sentence with "___" where the answer goes; options are French words/forms (e.g. je, tu, nous); correctAnswer is option id. NEVER use English-only options without a visible French sentence.

Return exactly 5 exercises. Return ONLY valid JSON.`;

const SENTENCE_SYSTEM_PROMPT = `You are Mot-à-Mot's Write in French engine. Create production exercises ONLY from the learner's toolbox.

RULES:
- Every targetWords entry MUST come from the toolbox list (internal — NOT shown to learner).
- hints: 1–3 ENGLISH strings guiding what to include WITHOUT giving away full French sentences.
  - Good: "Include a verb about movement", "Use past tense", "Mention where you went"
  - Bad: listing the exact French phrases to write
- explanation: REQUIRED — brief English note on what a strong answer should do (shown when checking).
- Mix types: translation, question_answer, build_sentence.
- translation: englishPrompt in English; learner writes French.
- question_answer: scenario in English; learner answers in French.
- build_sentence: instruction to build a sentence using toolbox themes from hints.
- id: stable unique slug. NEVER repeat ids from the avoid list.

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
              'match_following',
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
          hints: { type: 'array', items: { type: 'string' } },
          focusCategory: { type: 'string' },
          formFocus: { type: 'string' },
          matchRows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                french: { type: 'string' },
              },
              required: ['id', 'french'],
            },
          },
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
          frenchPrompt: { type: 'string' },
        },
        required: ['id', 'index', 'type', 'title', 'instruction', 'targetWords', 'correctAnswer'],
      },
    },
  },
  required: ['estimatedMinutes', 'prompts'],
};

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function primaryMeaning(entry) {
  return String(entry.meaning ?? '')
    .split(/[;,/]|(\s+or\s+)/i)[0]
    .trim();
}

function normalizeCorrectAnswer(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
}

const FALLBACK_MEANING_DISTRACTORS = [
  'to go',
  'to eat',
  'to see',
  'a house',
  'happy',
  'quickly',
  'yesterday',
  'with friends',
];

function buildMeaningOptions(correctEntry, poolEntries) {
  const correctText = primaryMeaning(correctEntry);
  const usedMeanings = new Set([correctText.toLowerCase()]);
  const distractorTexts = [];

  for (const entry of shuffle(poolEntries)) {
    if (entry.lemma === correctEntry.lemma) continue;
    const meaning = primaryMeaning(entry);
    const key = meaning.toLowerCase();
    if (!meaning || usedMeanings.has(key)) continue;
    usedMeanings.add(key);
    distractorTexts.push(meaning);
    if (distractorTexts.length >= 3) break;
  }

  for (const meaning of shuffle(FALLBACK_MEANING_DISTRACTORS)) {
    if (distractorTexts.length >= 3) break;
    const key = meaning.toLowerCase();
    if (usedMeanings.has(key)) continue;
    usedMeanings.add(key);
    distractorTexts.push(meaning);
  }

  const options = shuffle([
    { id: 'a', text: correctText },
    ...distractorTexts.slice(0, 3).map((text, index) => ({
      id: String.fromCharCode(98 + index),
      text,
    })),
  ]);

  const correctOption = options.find((option) => option.text === correctText);
  return { options, correctAnswer: correctOption?.id ?? 'a' };
}

function buildFallbackMatchMeaning(entry, poolEntries, index, stage) {
  const { options, correctAnswer } = buildMeaningOptions(entry, poolEntries);

  return enrichPrompt({
    id: `fallback-match-${entry.lemma}-${index}`,
    index,
    stage,
    type: 'match_meaning',
    title: 'Match the meaning',
    instruction: 'Select the correct English meaning for this French word from your toolbox.',
    targetWords: [entry.lemma],
    hints: [`This ${String(entry.partOfSpeech ?? 'word').toLowerCase()} is already in your toolbox.`],
    frenchPrompt: entry.lemma,
    options,
    correctAnswer,
    explanation: `"${entry.lemma}" means ${primaryMeaning(entry)}.`,
  });
}

function buildFallbackFillBlank(entry, poolEntries, index, stage) {
  if (entry.partOfSpeech === 'Verbs') {
    return enrichPrompt({
      id: `fallback-fill-${entry.lemma}-${index}`,
      index,
      stage,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Complete the sentence with the correct form of the verb from your toolbox.',
      targetWords: [entry.lemma],
      hints: [`Use "${entry.lemma}" (${primaryMeaning(entry)}) in the present tense with je.`],
      sentenceWithBlank: `Aujourd'hui, je ___ au marché.`,
      correctAnswer: entry.lemma,
      explanation: `The sentence needs a conjugated form related to "${entry.lemma}" (${primaryMeaning(entry)}).`,
    });
  }

  return buildFallbackMatchMeaning(entry, poolEntries, index, stage);
}

function buildFallbackMatchFollowing(entries, index, stage) {
  const rows = shuffle(entries)
    .slice(0, Math.min(3, entries.length))
    .map((entry, rowIndex) => ({
      id: `r${rowIndex + 1}`,
      french: entry.lemma,
    }));

  const options = shuffle(
    rows.map((row, optionIndex) => {
      const entry = entries.find((item) => item.lemma === row.french);
      return {
        id: `o${optionIndex + 1}`,
        text: primaryMeaning(entry ?? { meaning: row.french }),
      };
    }),
  );

  const answerMap = {};
  rows.forEach((row) => {
    const entry = entries.find((item) => item.lemma === row.french);
    const meaning = primaryMeaning(entry ?? { meaning: row.french });
    const option = options.find((item) => item.text === meaning);
    if (option) answerMap[row.id] = option.id;
  });

  return enrichPrompt({
    id: `fallback-following-${index}-${rows.map((row) => row.french).join('-')}`,
    index,
    stage,
    type: 'match_following',
    title: 'Match the following',
    instruction: 'Match each French word to its English meaning.',
    targetWords: rows.map((row) => row.french),
    hints: ['These words all come from your toolbox — think about each meaning carefully.'],
    matchRows: rows,
    options,
    correctAnswer: JSON.stringify(answerMap),
    explanation: 'Each French word should pair with its English meaning from your toolbox.',
  });
}

function buildFallbackQuickPrompts(entries, count, completedQuestionIds = []) {
  const completed = new Set(completedQuestionIds);
  const pool = shuffle(entries);
  const prompts = [];
  let index = 1;

  for (const entry of pool) {
    if (prompts.length >= count) break;

    const candidates = [
      buildFallbackMatchMeaning(entry, pool, index, 'quick'),
      buildFallbackFillBlank(entry, pool, index, 'quick'),
    ];

    for (const candidate of candidates) {
      if (prompts.length >= count) break;
      if (completed.has(candidate.id)) continue;
      if (prompts.some((prompt) => prompt.id === candidate.id)) continue;
      prompts.push({ ...candidate, index: index++ });
    }
  }

  if (pool.length >= 3 && prompts.length < count) {
    const following = buildFallbackMatchFollowing(pool, index, 'quick');
    if (!completed.has(following.id) && !prompts.some((prompt) => prompt.id === following.id)) {
      prompts.push({ ...following, index: index++ });
    }
  }

  return prompts.slice(0, count);
}

function buildFallbackSentencePrompts(entries, count) {
  const pool = shuffle(entries);
  const prompts = [];
  let index = 1;

  for (const entry of pool) {
    if (prompts.length >= count) break;
    prompts.push(
      enrichPrompt({
        id: `fallback-translate-${entry.lemma}-${index}`,
        index: index++,
        stage: 'sentence',
        type: 'translation',
        title: 'Write in French',
        instruction: 'Write a short French sentence using this word naturally.',
        targetWords: [entry.lemma],
        hints: [
          `Include "${primaryMeaning(entry)}" as your theme — the word is a ${String(entry.partOfSpeech ?? 'word').toLowerCase()}.`,
        ],
        englishPrompt: `Write a sentence using the French word for "${primaryMeaning(entry)}".`,
        correctAnswer: entry.lemma,
        explanation: `A strong answer uses "${entry.lemma}" naturally in a complete French sentence.`,
      }),
    );
  }

  return prompts.slice(0, count);
}

function mergePromptLists(primary, fallback, completedQuestionIds, targetCount = 5) {
  const merged = dedupePrompts([...primary, ...fallback], completedQuestionIds);
  return merged.slice(0, targetCount).map((prompt, index) => ({ ...prompt, index: index + 1 }));
}

async function tryGenerateAiPrompts(config, { systemPrompt, userPrompt, stage, completedQuestionIds }) {
  const result = await generateStructured(config, {
    systemPrompt,
    userPrompt,
    schema: EXERCISE_SCHEMA,
    schemaName: 'practice_session',
    ollamaSchemaHint:
      'Keys: estimatedMinutes, prompts (array of exercises with id, type, instruction, targetWords, correctAnswer, hints, explanation, frenchPrompt, sentenceWithBlank, options, matchRows).',
    temperature: 0.5,
  });

  let prompts = dedupePrompts(normalizePrompts(result?.prompts, stage), completedQuestionIds);

  if (prompts.length < 5) {
    console.warn('Practice session returned fewer than 5 unique prompts — retrying once.');
    const retry = await generateStructured(config, {
      systemPrompt,
      userPrompt: `${userPrompt}

IMPORTANT: Generate 5 valid exercises. Each MUST include:
- targetWords from the toolbox
- hints (English, do not reveal the answer)
- explanation (English)
- frenchPrompt OR sentenceWithBlank with "___" showing French text (match_meaning MUST show the French word)
- For multiple_choice: French sentence with blank + French options
All question ids must be new.`,
      schema: EXERCISE_SCHEMA,
      schemaName: 'practice_session_retry',
      ollamaSchemaHint: 'Same as practice_session.',
      temperature: 0.6,
    });

    prompts = dedupePrompts(
      [...prompts, ...normalizePrompts(retry?.prompts, stage)],
      completedQuestionIds,
    );
  }

  return { prompts, estimatedMinutes: result?.estimatedMinutes };
}

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

function looksLikeFrench(text, targetWords = []) {
  if (!text || typeof text !== 'string') return false;
  const value = text.trim();
  if (!value) return false;

  const lower = value.toLowerCase();
  if (targetWords.some((word) => word.trim() && lower.includes(word.trim().toLowerCase()))) {
    return true;
  }
  if (/[àâäéèêëïîôùûüçœæ]/.test(value)) return true;
  if (/l'|d'|j'|n'|m'|t'|s'|c'|qu'|aujourd'hui/i.test(value)) return true;
  if (
    /\b(hier|demain|bonjour|merci|oui|non|chez|avec|sans|pour|dans|sur|sous|maison|chat|chien|aller|être|avoir|faire|très|bien|mal|toujours|jamais|souvent|maintenant)\b/i.test(
      value,
    )
  ) {
    return true;
  }
  return /\b(je|tu|il|elle|on|nous|vous|ils|elles|le|la|les|un|une|des|du|de|au|aux|est|suis|es|sommes|êtes|sont|ai|as|a|avons|avez|ont)\b/i.test(
    value,
  );
}

function enrichPrompt(prompt) {
  const enriched = { ...prompt };

  if (enriched.type === 'match_meaning' && !enriched.frenchPrompt?.trim() && enriched.targetWords[0]) {
    enriched.frenchPrompt = enriched.targetWords[0];
  }

  if (enriched.type === 'multiple_choice' && !enriched.sentenceWithBlank?.trim() && enriched.frenchPrompt?.trim()) {
    enriched.sentenceWithBlank = enriched.frenchPrompt.includes('___')
      ? enriched.frenchPrompt
      : undefined;
  }

  if (!Array.isArray(enriched.hints) || enriched.hints.length === 0) {
    enriched.hints = ['Think about meaning and grammar — hints describe the idea, not the exact French word.'];
  }

  if (!enriched.explanation?.trim()) {
    enriched.explanation =
      'Compare your answer with the correct one and notice the meaning or grammatical difference.';
  }

  return enriched;
}

function isValidFrenchContext(prompt) {
  const words = prompt.targetWords ?? [];

  switch (prompt.type) {
    case 'match_meaning':
      return Boolean(prompt.frenchPrompt?.trim()) && looksLikeFrench(prompt.frenchPrompt, words);
    case 'fill_blank':
      return (
        Boolean(prompt.sentenceWithBlank?.trim()) &&
        prompt.sentenceWithBlank.includes('___') &&
        looksLikeFrench(prompt.sentenceWithBlank, words)
      );
    case 'multiple_choice': {
      const sentence = prompt.sentenceWithBlank?.trim() || prompt.frenchPrompt?.trim();
      return Boolean(sentence) && looksLikeFrench(sentence, words);
    }
    case 'find_error':
      return Boolean(prompt.flawedSentence?.trim()) && looksLikeFrench(prompt.flawedSentence, words);
    default:
      return true;
  }
}

function isValidMatchFollowing(prompt) {
  if (prompt.type !== 'match_following') return true;
  if (!Array.isArray(prompt.matchRows) || prompt.matchRows.length < 2) return false;
  if (!prompt.options || prompt.options.length < prompt.matchRows.length) return false;

  try {
    const map = JSON.parse(prompt.correctAnswer);
    return prompt.matchRows.every(
      (row) => row.id && row.french && map[row.id] && prompt.options.some((o) => o.id === map[row.id]),
    );
  } catch {
    return false;
  }
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

      const hints = (Array.isArray(prompt.hints) ? prompt.hints : [])
        .map((hint) => String(hint).trim())
        .filter(Boolean);

      return enrichPrompt({
        id,
        index: typeof prompt.index === 'number' ? prompt.index : index + 1,
        stage,
        type,
        title,
        instruction: String(prompt.instruction ?? '').trim(),
        targetWords,
        hints,
        focusCategory: prompt.focusCategory ? String(prompt.focusCategory).trim() : undefined,
        formFocus: prompt.formFocus ? String(prompt.formFocus).trim() : undefined,
        options: dedupeOptions(prompt.options),
        matchRows: Array.isArray(prompt.matchRows)
          ? prompt.matchRows
              .map((row) => ({
                id: String(row.id ?? '').trim(),
                french: String(row.french ?? '').trim(),
              }))
              .filter((row) => row.id && row.french)
          : undefined,
        correctAnswer: normalizeCorrectAnswer(prompt.correctAnswer),
        explanation: String(prompt.explanation ?? '').trim(),
        sentenceWithBlank: prompt.sentenceWithBlank
          ? String(prompt.sentenceWithBlank).trim()
          : undefined,
        flawedSentence: prompt.flawedSentence ? String(prompt.flawedSentence).trim() : undefined,
        englishPrompt: prompt.englishPrompt ? String(prompt.englishPrompt).trim() : undefined,
        frenchPrompt: prompt.frenchPrompt ? String(prompt.frenchPrompt).trim() : undefined,
      });
    })
    .filter(
      (prompt) =>
        prompt.targetWords.length > 0 &&
        prompt.hints.length > 0 &&
        prompt.correctAnswer &&
        prompt.instruction &&
        prompt.explanation &&
        allowedTypes.includes(prompt.type) &&
        isValidChoicePrompt(prompt) &&
        isValidMatchFollowing(prompt) &&
        isValidFrenchContext(prompt),
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
    console.warn('AI not configured — using toolbox fallback for practice session.');
  }

  const config = getRuntimeConfig();
  const systemPrompt = stage === 'quick' ? QUICK_SYSTEM_PROMPT : SENTENCE_SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt({ entries, stage, focusCategory, completedQuestionIds });

  const fallbackPrompts =
    stage === 'quick'
      ? buildFallbackQuickPrompts(entries, 5, completedQuestionIds)
      : buildFallbackSentencePrompts(entries, 5);

  try {
    let aiPrompts = [];
    let estimatedMinutes = '4–5';

    if (isConfigured()) {
      const aiResult = await tryGenerateAiPrompts(config, {
        systemPrompt,
        userPrompt,
        stage,
        completedQuestionIds,
      });
      aiPrompts = aiResult.prompts;
      estimatedMinutes = String(aiResult.estimatedMinutes ?? estimatedMinutes).trim();
    }

    const prompts = mergePromptLists(aiPrompts, fallbackPrompts, completedQuestionIds, 5);

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
        estimatedMinutes,
        prompts,
      },
    };
  } catch (error) {
    console.error('Practice session generation failed:', error);

    const prompts = mergePromptLists([], fallbackPrompts, completedQuestionIds, 5);

    if (prompts.length >= 3) {
      return {
        status: 200,
        body: {
          stage,
          focusCategory,
          estimatedMinutes: '4–5',
          prompts,
        },
      };
    }

    const detail =
      error instanceof Error && error.message && !/api key|unauthorized|401|403/i.test(error.message)
        ? error.message.slice(0, 120)
        : null;

    return {
      status: 500,
      body: {
        message: detail
          ? `We couldn't create your practice session: ${detail}`
          : "We couldn't create your practice session right now. Please try again.",
      },
    };
  }
}
