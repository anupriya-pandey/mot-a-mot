import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured } from './analyzeService.js';

const SESSION_QUESTION_COUNT = 10;
const SESSION_MIN_QUESTIONS = 10;

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
- Across 10 exercises include at least 2 of each type when the toolbox allows — never make every question fill_blank or match_meaning.
- NEVER use proper nouns or personal names (e.g. Anupriya, John) as French prompts or answers — only real French vocabulary from the toolbox.
- hints must be specific grammar/meaning clues — NEVER "already in your toolbox" or "This noun is already in your toolbox".
- CRITICAL: Every question MUST show French text the learner responds to. Never ask about a French word without displaying it. Never ask to complete a sentence without showing the French sentence.
- Spread questions across grammatical categories; vary verb persons and adjective agreements.
- Use English for instructions only. correctAnswer must match one option id or exact expected text.
- id: stable unique slug. NEVER repeat ids from the avoid list.
- For choice-based types: exactly 4 UNIQUE options — no duplicate text.

Exercise types:
- fill_blank: sentenceWithBlank REQUIRED — French sentence with "___" for the blank; correctAnswer is the French word/phrase; hints in English only. If multiple toolbox conjunctions/phrases fit (e.g. car and parce que for "because"), set acceptableAnswers with all valid options. sentenceWithBlank must be French only — no English translation in parentheses.

FILL_BLANK rules (strict):
- sentenceWithBlank = ONE French sentence with a single "___" blank — nothing else. No English, no grammar notes in parentheses, no "Hint:", no "Explanation:", no second ___, no text after the sentence explaining the answer.
- hints: 1–3 specific English clues about tense/person/meaning — NEVER the conjugated French form, NEVER "ends in -e", NEVER duplicate generic filler.
- explanation: goes in the explanation field only — never inside sentenceWithBlank.
- Bad sentenceWithBlank: "Je ___ à Paris. (habiter: je form.) ___ is the correct form..."
- Good sentenceWithBlank: "Je ___ à Paris pour mes études."
- match_meaning: frenchPrompt REQUIRED — the French toolbox word displayed large (e.g. "aujourd'hui"); options are English meanings only; correctAnswer is option id.
- match_following: matchRows = 3–4 {id, french} pairs from toolbox; options = shuffled English meanings; correctAnswer = JSON mapping row id → option id.
- find_error: flawedSentence REQUIRED — full French sentence with one error; options describe fixes in English; correctAnswer is option id.
- multiple_choice: sentenceWithBlank REQUIRED — French sentence with "___" where the answer goes; options are French words/forms (e.g. je, tu, nous); correctAnswer is option id. NEVER use English-only options without a visible French sentence.

FIND_ERROR rules (strict):
- flawedSentence must be French ONLY — no English, no notes in parentheses, no "Wait" or "check the toolbox" meta-text.
- Include exactly one deliberate mistake (e.g. wrong adjective agreement: "Mon oncle est occupée").
- hints: specific English grammar clue (e.g. "Does the adjective agree with a masculine or feminine subject?").
- explanation: name the rule and give the correct form (e.g. "Oncle is masculine, so use occupé not occupée.").
- Options describe fixes in English like "Change 'occupée' to 'occupé'". The correct option must fix a real error in flawedSentence.

Return exactly 10 exercises. Return ONLY valid JSON.`;

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

Return exactly 10 exercises. Return ONLY valid JSON.`;

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
          acceptableAnswers: { type: 'array', items: { type: 'string' } },
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

const POS_LABEL = {
  Verbs: 'verb',
  Nouns: 'noun',
  Adjectives: 'adjective',
  Pronouns: 'pronoun',
  Prepositions: 'preposition',
  Adverbs: 'adverb',
  Conjunctions: 'conjunction',
};

function posLabel(entry) {
  return POS_LABEL[entry.partOfSpeech] ?? 'word';
}

function looksLikeProperNoun(entry) {
  const lemma = String(entry.lemma ?? '').trim();
  const meaning = primaryMeaning(entry);
  if (!lemma) return true;

  if (/^(name|proper noun|person|first name|given name)/i.test(meaning)) return true;

  if (meaning.toLowerCase() === lemma.toLowerCase()) {
    if (/^[A-Z][a-zA-Z'-]+$/.test(lemma) && !looksLikeFrench(lemma, [lemma])) {
      return true;
    }
  }

  if (/^[A-Z][a-z]+$/.test(lemma) && !/[àâäéèêëïîôùûüçœæ]/.test(lemma)) {
    if (!looksLikeFrench(lemma, []) && !looksLikeFrench(meaning, [])) {
      return true;
    }
  }

  return false;
}

function isPracticeEligibleEntry(entry) {
  if (!entry?.lemma?.trim() || !entry?.meaning?.trim()) return false;
  if (looksLikeProperNoun(entry)) return false;
  return true;
}

function filterPracticeEntries(entries) {
  return entries.filter(isPracticeEligibleEntry);
}

function buildPracticeHints(entry, exerciseType) {
  const meaning = primaryMeaning(entry);
  const label = posLabel(entry);
  const lemma = entry.lemma;

  const hintsByType = {
    match_meaning: [
      `Which English option matches this ${label} meaning "${meaning}"?`,
      `Recall the everyday meaning of « ${lemma} » — ignore look-alike distractors.`,
      `Think about when you would use this ${label} in a French sentence.`,
    ],
    fill_blank:
      entry.partOfSpeech === 'Verbs'
        ? [
            `Conjugate « ${lemma} » (${meaning}) for je in the present tense.`,
            `The blank needs the je form of the ${label} meaning "${meaning}".`,
          ]
        : [
            `Fill in the ${label} that means "${meaning}".`,
            `The missing word expresses "${meaning}" in French.`,
          ],
    multiple_choice: [
      `Pick the French form that fits the sentence — it relates to "${meaning}".`,
      `One option is the correct ${label} for this context.`,
    ],
    find_error: [
      `Check agreement or verb form — one word does not fit the sentence.`,
      `Look at how « ${lemma} » (${meaning}) is used in this sentence.`,
    ],
    match_following: [
      `Match each French word to its English meaning carefully.`,
      `Pair each ${label} with the English idea it expresses.`,
    ],
  };

  return [shuffle(hintsByType[exerciseType] ?? hintsByType.match_meaning)[0]];
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
    focusCategory: entry.partOfSpeech,
    hints: buildPracticeHints(entry, 'match_meaning'),
    frenchPrompt: entry.lemma,
    options,
    correctAnswer,
    explanation: `"${entry.lemma}" means ${primaryMeaning(entry)}.`,
  });
}

function buildFallbackFillBlank(entry, poolEntries, index, stage) {
  if (entry.partOfSpeech === 'Verbs') {
    const conjugated = conjugateJePresent(entry.lemma);
    const lemmaKey = entry.lemma.trim().toLowerCase().normalize('NFC');

    if (!conjugated || conjugated === lemmaKey) {
      return buildFallbackMatchMeaning(entry, poolEntries, index, stage);
    }

    const IRREGULAR_HINT_VERBS = new Set([
      'être',
      'etre',
      'avoir',
      'aller',
      'faire',
      'venir',
      'prendre',
      'pouvoir',
      'vouloir',
      'savoir',
      'voir',
      'dire',
      'devoir',
    ]);
    const isIrregular = IRREGULAR_HINT_VERBS.has(lemmaKey);

    return enrichPrompt({
      id: `fallback-fill-${entry.lemma}-${index}`,
      index,
      stage,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: `Complete the sentence with the correct present-tense form of « ${entry.lemma} ».`,
      targetWords: [entry.lemma],
      focusCategory: entry.partOfSpeech,
      hints: isIrregular
        ? [
            `« ${entry.lemma} » is irregular — recall the je form for "${primaryMeaning(entry)}".`,
            'This verb does not follow the regular -er pattern.',
          ]
        : buildPracticeHints(entry, 'fill_blank').concat([
            'Use the regular present-tense ending for this verb group.',
          ]).slice(0, 2),
      sentenceWithBlank: `Chaque jour, je ___ près de la gare.`,
      correctAnswer: conjugated,
      explanation: `For je in the present tense, « ${entry.lemma} » becomes « ${conjugated} ».`,
    });
  }

  if (entry.partOfSpeech === 'Nouns') {
    return enrichPrompt({
      id: `fallback-fill-${entry.lemma}-${index}`,
      index,
      stage,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Complete the sentence with the correct French word from your toolbox.',
      targetWords: [entry.lemma],
      focusCategory: entry.partOfSpeech,
      hints: buildPracticeHints(entry, 'fill_blank'),
      sentenceWithBlank: 'Hier, j\'ai visité le ___.',
      correctAnswer: entry.lemma,
      explanation: `The missing word is « ${entry.lemma} », which means ${primaryMeaning(entry)}.`,
    });
  }

  if (entry.partOfSpeech === 'Adjectives') {
    return enrichPrompt({
      id: `fallback-fill-${entry.lemma}-${index}`,
      index,
      stage,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Complete the sentence with the correct French adjective from your toolbox.',
      targetWords: [entry.lemma],
      focusCategory: entry.partOfSpeech,
      hints: buildPracticeHints(entry, 'fill_blank'),
      sentenceWithBlank: 'Ce tableau est vraiment ___.',
      correctAnswer: entry.lemma,
      explanation: `« ${entry.lemma} » means ${primaryMeaning(entry)} and fits this sentence naturally.`,
    });
  }

  if (entry.partOfSpeech === 'Adverbs' || entry.partOfSpeech === 'Prepositions') {
    return enrichPrompt({
      id: `fallback-fill-${entry.lemma}-${index}`,
      index,
      stage,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Complete the sentence with the correct French word from your toolbox.',
      targetWords: [entry.lemma],
      focusCategory: entry.partOfSpeech,
      hints: buildPracticeHints(entry, 'fill_blank'),
      sentenceWithBlank:
        entry.partOfSpeech === 'Prepositions'
          ? 'Je vais ___ Paris demain matin.'
          : 'Il parle ___ bien français.',
      correctAnswer: entry.lemma,
      explanation: `« ${entry.lemma} » means ${primaryMeaning(entry)}.`,
    });
  }

  return buildFallbackMatchMeaning(entry, poolEntries, index, stage);
}

function buildFallbackFindError(entry, poolEntries, index, stage) {
  const adjectiveResult = buildFallbackFindErrorAdjective(entry, poolEntries, index, stage);
  if (adjectiveResult) return adjectiveResult;
  return buildFallbackFindErrorVerb(entry, poolEntries, index, stage);
}

function buildFallbackFindErrorAdjective(entry, poolEntries, index, stage) {
  const forms = entry.adjectiveForms;
  const masculine = String(forms?.masculineSingular ?? '').trim();
  const feminine = String(forms?.feminineSingular ?? '').trim();

  if (entry.partOfSpeech !== 'Adjectives' || !masculine || !feminine) {
    return null;
  }
  if (masculine.toLowerCase() === feminine.toLowerCase()) {
    return null;
  }

  const useFeminineSubject = index % 2 === 0;
  const subject = useFeminineSubject ? 'Ma tante' : 'Mon oncle';
  const wrongForm = useFeminineSubject ? masculine : feminine;
  const correctForm = useFeminineSubject ? feminine : masculine;
  const subjectLabel = useFeminineSubject ? 'feminine' : 'masculine';
  const flawedSentence = `${subject} est très ${wrongForm}.`;
  const correctFix = `Change '${wrongForm}' to '${correctForm}'`;

  const optionTexts = shuffle([
    correctFix,
    `Change '${correctForm}' to '${wrongForm}'`,
    `Change 'est' to 'sont'`,
    `Change 'très' to 'beaucoup'`,
  ]).slice(0, 4);

  const options = optionTexts.map((text, optionIndex) => ({
    id: String.fromCharCode(97 + optionIndex),
    text,
  }));

  const correctOption = options.find((option) => option.text === correctFix);

  return enrichPrompt({
    id: `fallback-find-error-${entry.lemma}-${index}`,
    index,
    stage,
    type: 'find_error',
    title: 'Find the error',
    instruction: 'Read the French sentence and choose the fix that corrects the grammar mistake.',
    targetWords: [entry.lemma],
    focusCategory: entry.partOfSpeech,
    hints: buildPracticeHints(entry, 'find_error'),
    flawedSentence,
    options,
    correctAnswer: correctOption?.id ?? 'a',
    explanation: `${subject} is ${subjectLabel}, so the adjective needs the ${subjectLabel} form "${correctForm}", not "${wrongForm}".`,
  });
}

function buildFallbackFindErrorVerb(entry, poolEntries, index, stage) {
  if (entry.partOfSpeech !== 'Verbs') return null;

  const conjugated = conjugateJePresent(entry.lemma);
  if (!conjugated || conjugated === entry.lemma.trim().toLowerCase()) return null;

  const flawedSentence = `Chaque jour, je ${entry.lemma} à l'école.`;
  const correctFix = `Change '${entry.lemma}' to '${conjugated}'`;

  const optionTexts = shuffle([
    correctFix,
    `Change '${conjugated}' to '${entry.lemma}'`,
    `Change 'je' to 'nous'`,
    `Change 'à' to 'de'`,
  ]).slice(0, 4);

  const options = optionTexts.map((text, optionIndex) => ({
    id: String.fromCharCode(97 + optionIndex),
    text,
  }));

  const correctOption = options.find((option) => option.text === correctFix);

  return enrichPrompt({
    id: `fallback-find-error-verb-${entry.lemma}-${index}`,
    index,
    stage,
    type: 'find_error',
    title: 'Find the error',
    instruction: 'Read the French sentence and choose the fix that corrects the grammar mistake.',
    targetWords: [entry.lemma],
    focusCategory: entry.partOfSpeech,
    hints: [
      `After "je", you need a conjugated verb — not the infinitive « ${entry.lemma} ».`,
      `Recall the je present-tense form for "${primaryMeaning(entry)}".`,
    ],
    flawedSentence,
    options,
    correctAnswer: correctOption?.id ?? 'a',
    explanation: `After "je", use the conjugated form « ${conjugated} », not the infinitive « ${entry.lemma} ».`,
  });
}

function buildFallbackMultipleChoice(entry, poolEntries, index, stage) {
  const meaning = primaryMeaning(entry);
  let sentenceWithBlank;
  let correctText;

  if (entry.partOfSpeech === 'Verbs') {
    const conjugated = conjugateJePresent(entry.lemma);
    if (!conjugated || conjugated === entry.lemma.trim().toLowerCase()) return null;
    sentenceWithBlank = 'Ce matin, je ___ avec mes collègues.';
    correctText = conjugated;
  } else if (entry.partOfSpeech === 'Pronouns') {
    sentenceWithBlank = '___ habite dans un petit village.';
    correctText = entry.lemma;
  } else {
    sentenceWithBlank = 'Pour le déjeuner, j\'ai choisi ___.';
    correctText = entry.lemma;
  }

  const sameCategory = poolEntries.filter(
    (item) => item.lemma !== entry.lemma && item.partOfSpeech === entry.partOfSpeech,
  );
  const distractorPool = shuffle(sameCategory.length >= 3 ? sameCategory : poolEntries.filter((item) => item.lemma !== entry.lemma));

  const distractorTexts = [];
  for (const item of distractorPool) {
    if (distractorTexts.length >= 3) break;
    const text =
      item.partOfSpeech === 'Verbs'
        ? conjugateJePresent(item.lemma) ?? item.lemma
        : item.lemma;
    if (!text || text.toLowerCase() === correctText.toLowerCase()) continue;
    if (distractorTexts.some((value) => value.toLowerCase() === text.toLowerCase())) continue;
    distractorTexts.push(text);
  }

  if (distractorTexts.length < 3) return null;

  const options = shuffle([
    { id: 'a', text: correctText },
    ...distractorTexts.map((text, optionIndex) => ({
      id: String.fromCharCode(98 + optionIndex),
      text,
    })),
  ]).slice(0, 4);

  const correctOption = options.find((option) => option.text.toLowerCase() === correctText.toLowerCase());

  return enrichPrompt({
    id: `fallback-mcq-${entry.lemma}-${index}`,
    index,
    stage,
    type: 'multiple_choice',
    title: 'Choose the correct form',
    instruction: 'Read the French sentence and select the word that completes it correctly.',
    targetWords: [entry.lemma],
    focusCategory: entry.partOfSpeech,
    hints: buildPracticeHints(entry, 'multiple_choice'),
    sentenceWithBlank,
    options,
    correctAnswer: correctOption?.id ?? 'a',
    explanation: `« ${correctText} » fits here — it relates to "${meaning}".`,
  });
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
    focusCategory: entries[0]?.partOfSpeech,
    hints: buildPracticeHints(entries[0] ?? { partOfSpeech: 'word' }, 'match_following'),
    matchRows: rows,
    options,
    correctAnswer: JSON.stringify(answerMap),
    explanation: 'Each French word should pair with its English meaning from your toolbox.',
  });
}

const QUICK_TYPE_ROTATION = [
  'match_meaning',
  'fill_blank',
  'multiple_choice',
  'find_error',
  'match_following',
];

function tryBuildFallbackByType(type, entry, pool, index, stage) {
  switch (type) {
    case 'match_meaning':
      return buildFallbackMatchMeaning(entry, pool, index, stage);
    case 'fill_blank':
      return buildFallbackFillBlank(entry, pool, index, stage);
    case 'multiple_choice':
      return buildFallbackMultipleChoice(entry, pool, index, stage);
    case 'find_error':
      return buildFallbackFindError(entry, pool, index, stage);
    case 'match_following':
      if (pool.length >= 3) {
        return buildFallbackMatchFollowing(pool, index, stage);
      }
      return null;
    default:
      return null;
  }
}

function canAddFallbackPrompt(candidate, prompts, completed) {
  if (!candidate) return false;
  if (completed.has(candidate.id)) return false;
  if (prompts.some((prompt) => prompt.id === candidate.id)) return false;
  return true;
}

function buildFallbackQuickPrompts(entries, count, completedQuestionIds = []) {
  const completed = new Set(completedQuestionIds);
  const pool = shuffle(filterPracticeEntries(entries));
  const prompts = [];
  let index = 1;
  let entryCursor = 0;

  const nextEntry = () => {
    if (pool.length === 0) return null;
    const entry = pool[entryCursor % pool.length];
    entryCursor += 1;
    return entry;
  };

  for (const type of QUICK_TYPE_ROTATION) {
    if (prompts.length >= count) break;

    if (type === 'match_following') {
      const candidate = tryBuildFallbackByType(type, null, pool, index, 'quick');
      if (canAddFallbackPrompt(candidate, prompts, completed)) {
        prompts.push({ ...candidate, index: index++ });
      }
      continue;
    }

    for (let attempt = 0; attempt < pool.length; attempt += 1) {
      const entry = nextEntry();
      if (!entry) break;
      const candidate = tryBuildFallbackByType(type, entry, pool, index, 'quick');
      if (!canAddFallbackPrompt(candidate, prompts, completed)) continue;
      prompts.push({ ...candidate, index: index++ });
      break;
    }
  }

  let typeRound = 0;
  while (prompts.length < count && pool.length > 0) {
    const type = QUICK_TYPE_ROTATION[typeRound % QUICK_TYPE_ROTATION.length];
    typeRound += 1;

    if (type === 'match_following') {
      const candidate = tryBuildFallbackByType(type, null, pool, index, 'quick');
      if (canAddFallbackPrompt(candidate, prompts, completed)) {
        candidate.id = `${candidate.id}-round-${typeRound}`;
        prompts.push({ ...candidate, index: index++ });
      }
      continue;
    }

    let added = false;
    for (let attempt = 0; attempt < pool.length; attempt += 1) {
      const entry = nextEntry();
      if (!entry) break;
      const candidate = tryBuildFallbackByType(type, entry, pool, index, 'quick');
      if (!canAddFallbackPrompt(candidate, prompts, completed)) continue;
      candidate.id = `${candidate.id}-round-${typeRound}-${prompts.length}`;
      prompts.push({ ...candidate, index: index++ });
      added = true;
      break;
    }

    if (!added && typeRound > QUICK_TYPE_ROTATION.length * pool.length) break;
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
        focusCategory: entry.partOfSpeech,
        hints: [
          `Include "${primaryMeaning(entry)}" as your theme — the word is a ${String(entry.partOfSpeech ?? 'word').toLowerCase()}.`,
        ],
        englishPrompt: `Write a sentence using the French word for "${primaryMeaning(entry)}".`,
        correctAnswer: entry.lemma,
        explanation: `A strong answer uses "${entry.lemma}" naturally in a complete French sentence.`,
      }),
    );
  }

  let repeatRound = 0;
  while (prompts.length < count && pool.length > 0) {
    const entry = pool[prompts.length % pool.length];
    prompts.push(
      enrichPrompt({
        id: `fallback-translate-${entry.lemma}-extra-${repeatRound}-${prompts.length}`,
        index: index++,
        stage: 'sentence',
        type: 'translation',
        title: 'Write in French',
        instruction: 'Write a short French sentence using this word naturally.',
        targetWords: [entry.lemma],
        focusCategory: entry.partOfSpeech,
        hints: [
          `Include "${primaryMeaning(entry)}" as your theme — the word is a ${String(entry.partOfSpeech ?? 'word').toLowerCase()}.`,
        ],
        englishPrompt: `Write a sentence using the French word for "${primaryMeaning(entry)}".`,
        correctAnswer: entry.lemma,
        explanation: `A strong answer uses "${entry.lemma}" naturally in a complete French sentence.`,
      }),
    );
    repeatRound += 1;
  }

  return prompts.slice(0, count);
}

function ensureQuickTypeMix(prompts, fallback, targetCount) {
  const types = STAGE_CONFIG.quick.types;
  const pool = dedupePrompts([...prompts, ...fallback], []);
  const result = [];
  const usedIds = new Set();

  const takeNext = (type) => {
    const candidate = pool.find((prompt) => prompt.type === type && !usedIds.has(prompt.id));
    if (!candidate) return false;
    result.push(candidate);
    usedIds.add(candidate.id);
    return true;
  };

  for (const type of types) {
    takeNext(type);
  }

  while (result.length < targetCount) {
    const counts = Object.fromEntries(types.map((type) => [type, 0]));
    result.forEach((prompt) => {
      counts[prompt.type] = (counts[prompt.type] ?? 0) + 1;
    });
    const minCount = Math.min(...types.map((type) => counts[type] ?? 0));
    const preferredTypes = types.filter((type) => (counts[type] ?? 0) === minCount);
    const next = pool.find((prompt) => preferredTypes.includes(prompt.type) && !usedIds.has(prompt.id));
    if (!next) break;
    result.push(next);
    usedIds.add(next.id);
  }

  return result.slice(0, targetCount).map((prompt, index) => ({ ...prompt, index: index + 1 }));
}

function mergePromptLists(primary, fallback, completedQuestionIds, targetCount = SESSION_QUESTION_COUNT, stage = 'quick') {
  const merged = dedupePrompts([...primary, ...fallback], completedQuestionIds);
  if (stage === 'quick') {
    return ensureQuickTypeMix(merged, fallback, targetCount);
  }
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

  if (prompts.length < SESSION_QUESTION_COUNT) {
    console.warn(`Practice session returned fewer than ${SESSION_QUESTION_COUNT} unique prompts — retrying once.`);
    const retry = await generateStructured(config, {
      systemPrompt,
      userPrompt: `${userPrompt}

IMPORTANT: Generate ${SESSION_QUESTION_COUNT} valid exercises. Each MUST include:
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

const GENERIC_PRACTICE_HINT =
  'Think about meaning and grammar — hints describe the idea, not the exact French word.';
const GENERIC_PRACTICE_EXPLANATION =
  'Compare your answer with the correct one and notice the meaning or grammatical difference.';

const META_COMMENTARY_RE = /\([^)]*\b(?:wait|check|toolbox|hint|note|error|agreement|form)\b[^)]*\)/i;
const FEMININE_SUBJECT_RE =
  /\b(tante|mère|soeur|fille|femme|elle|cette)\b|(?:\b(?:ma|la|une|sa|ta|cette)\s+\w+e\b)/i;
const MASCULINE_SUBJECT_RE =
  /\b(oncle|père|frère|fils|homme|il|lui)\b|(?:\b(?:mon|le|un|son)\s+\w+\b)/i;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeFrenchDisplayText(text) {
  if (!text || typeof text !== 'string') return '';

  let value = text.trim().split(/\n+/)[0].trim();
  value = value.replace(META_COMMENTARY_RE, '');
  value = value.replace(/\s*\([A-Za-z][^)]*\)/g, (match) => {
    if (/[àâäéèêëïîôùûüçœæ]/i.test(match)) return match;
    return '';
  });

  const duplicate = value.match(/^(.+?\.\s*)\1/);
  if (duplicate) {
    value = duplicate[1].trim();
  }

  return value.replace(/\s+/g, ' ').trim();
}

const FILL_BLANK_LEAK_RE =
  /\b(correct form|first[- ]person|present tense|indicative|conjugat|ends in an? -e\b|no apostrophe|hint\s*:|explanation\s*:|the verb is\s+|___\s+is the)/i;
const GRAMMAR_PAREN_RE =
  /\s*\([^)]*(?:form|tense|person|indicative|conjugat|present|singular|plural|je form|tu form|habiter|verb)[^)]*\)/gi;

function sanitizeFillBlankSentence(text) {
  let value = sanitizeFrenchDisplayText(text);

  const leakIndex = value.search(
    /\s+(?:___\s+is the|Hint\s*:|Explanation\s*:|The verb is|The correct form|first person singular)/i,
  );
  if (leakIndex > 0) {
    value = value.slice(0, leakIndex).trim();
  }

  value = value.replace(GRAMMAR_PAREN_RE, '');

  const blankSentence = value.match(/[^.!?]*___[^.!?]*[.!?]?/);
  if (blankSentence) {
    value = blankSentence[0].trim();
  }

  return value.replace(/\s+/g, ' ').trim();
}

function expandAnswerForms(answer) {
  const base = String(answer ?? '').trim();
  if (!base) return [];

  const forms = [base];
  if (/^[a-zàâäéèêëïîôùûüç]/i.test(base) && !base.includes("'")) {
    forms.push(`j'${base}`);
  }
  if (base.startsWith("j'")) {
    forms.push(base.slice(2));
  }

  return forms;
}

function revealsAnswerInText(text, correctAnswer, acceptableAnswers = []) {
  const withoutBlank = String(text ?? '')
    .replace(/___/g, ' ')
    .toLowerCase();
  const answers = [correctAnswer, ...(acceptableAnswers ?? [])].filter(Boolean);

  for (const answer of answers) {
    for (const form of expandAnswerForms(answer)) {
      const normalized = form.toLowerCase().trim();
      if (normalized.length < 3) continue;
      if (withoutBlank.includes(normalized)) return true;
    }
  }

  return false;
}

function hasFillBlankAnswerLeak(text) {
  return FILL_BLANK_LEAK_RE.test(String(text ?? ''));
}

function isSingleGenericHint(hint) {
  return (
    hint === GENERIC_PRACTICE_HINT ||
    /hints describe the idea/i.test(hint) ||
    /already in your toolbox/i.test(hint) ||
    hint.length < 12
  );
}

function hasUsableHints(hints) {
  if (!Array.isArray(hints) || hints.length === 0) return false;
  return hints.some((hint) => !isSingleGenericHint(hint));
}

function hintsRevealAnswer(hints, correctAnswer, acceptableAnswers = []) {
  const hintText = (hints ?? []).join(' ').toLowerCase();
  const answers = [correctAnswer, ...(acceptableAnswers ?? [])].filter(Boolean);

  for (const answer of answers) {
    for (const form of expandAnswerForms(answer)) {
      const normalized = form.toLowerCase().trim();
      if (normalized.length >= 3 && hintText.includes(normalized)) return true;
    }
  }

  return (
    /\bends in an? -e\b/i.test(hintText) ||
    /\bno apostrophe needed\b/i.test(hintText) ||
    /\bfirst person singular present\b/i.test(hintText)
  );
}

function conjugateJePresent(lemma) {
  const verb = String(lemma ?? '').trim().toLowerCase().normalize('NFC');

  const IRREGULAR_JE_PRESENT = {
    être: 'suis',
    etre: 'suis',
    avoir: 'ai',
    aller: 'vais',
    faire: 'fais',
    venir: 'viens',
    prendre: 'prends',
    pouvoir: 'peux',
    vouloir: 'veux',
    savoir: 'sais',
    voir: 'vois',
    dire: 'dis',
    devoir: 'dois',
    mettre: 'mets',
    tenir: 'tiens',
    partir: 'pars',
    sortir: 'sors',
    dormir: 'dors',
    ouvrir: 'ouvre',
    écrire: 'écris',
    ecrire: 'écris',
    lire: 'lis',
    boire: 'bois',
    connaître: 'connais',
    connaitre: 'connais',
  };

  if (IRREGULAR_JE_PRESENT[verb]) {
    return IRREGULAR_JE_PRESENT[verb];
  }

  if (verb.endsWith('er')) return `${verb.slice(0, -2)}e`;
  if (verb.endsWith('ir')) return `${verb.slice(0, -2)}is`;
  if (verb.endsWith('re')) return `${verb.slice(0, -2)}s`;
  return null;
}

function isValidFillBlank(prompt) {
  if (prompt.type !== 'fill_blank') return true;

  const sentence = prompt.sentenceWithBlank ?? '';
  if (!sentence.includes('___')) return false;
  if (hasFillBlankAnswerLeak(sentence)) return false;
  if (revealsAnswerInText(sentence, prompt.correctAnswer, prompt.acceptableAnswers)) return false;
  if (!hasUsableHints(prompt.hints)) return false;
  if (hintsRevealAnswer(prompt.hints, prompt.correctAnswer, prompt.acceptableAnswers)) return false;
  if (isGenericPracticeExplanation(prompt.explanation)) return false;

  const instruction = String(prompt.instruction ?? '').toLowerCase();
  if (/present-tense|conjugat/.test(instruction)) {
    for (const word of prompt.targetWords ?? []) {
      const lemma = String(word).trim().toLowerCase().normalize('NFC');
      const answer = String(prompt.correctAnswer ?? '').trim().toLowerCase();
      if (
        (lemma === 'être' ||
          lemma === 'etre' ||
          lemma.endsWith('er') ||
          lemma.endsWith('re') ||
          lemma.endsWith('ir')) &&
        answer === lemma
      ) {
        return false;
      }
    }
  }

  return true;
}

function hasMetaCommentary(text) {
  return META_COMMENTARY_RE.test(String(text ?? ''));
}

function isGenericPracticeHint(hints) {
  if (!Array.isArray(hints) || hints.length === 0) return true;
  return hints.every(
    (hint) =>
      hint === GENERIC_PRACTICE_HINT ||
      /hints describe the idea/i.test(hint) ||
      /already in your toolbox/i.test(hint) ||
      hint.length < 12,
  );
}

function isGenericPracticeExplanation(explanation) {
  const value = String(explanation ?? '').trim();
  return !value || value === GENERIC_PRACTICE_EXPLANATION || /notice the meaning or grammatical difference/i.test(value);
}

function parseChangeFix(text) {
  const match = String(text ?? '').match(/change\s+'([^']+)'\s+to\s+'([^']+)'/i);
  return match ? { from: match[1], to: match[2] } : null;
}

function adjectiveAgreementMatchesSubject(sentence, adjective) {
  const lower = sentence.toLowerCase();
  const adj = String(adjective ?? '').toLowerCase().trim();
  const feminineSubject = FEMININE_SUBJECT_RE.test(lower);
  const masculineSubject = MASCULINE_SUBJECT_RE.test(lower);

  if (!feminineSubject && !masculineSubject) return null;

  const endsFeminine = /ée$|euse$|ive$/.test(adj) || (adj.endsWith('e') && !adj.endsWith('é'));
  const endsMasculine =
    /[^e]é$|eux$|if$|el$/.test(adj) || (adj.endsWith('é') && !adj.endsWith('ée'));

  if (feminineSubject && endsFeminine) return true;
  if (masculineSubject && endsMasculine) return true;
  if (feminineSubject && endsMasculine) return false;
  if (masculineSubject && endsFeminine) return false;
  return null;
}

function isValidFindError(prompt) {
  if (prompt.type !== 'find_error') return true;

  if (hasMetaCommentary(prompt.flawedSentence)) return false;

  const sentence = sanitizeFrenchDisplayText(prompt.flawedSentence);
  if (!sentence || !looksLikeFrench(sentence, prompt.targetWords ?? [])) return false;

  const correctOption = prompt.options?.find((option) => option.id === prompt.correctAnswer);
  if (!correctOption?.text) return false;

  const fix = parseChangeFix(correctOption.text);
  if (!fix) return false;

  if (!sentence.toLowerCase().includes(fix.from.toLowerCase())) return false;

  const corrected = sentence.replace(new RegExp(escapeRegex(fix.from), 'i'), fix.to);
  if (corrected.toLowerCase() === sentence.toLowerCase()) return false;

  const wrongFormAgreement = adjectiveAgreementMatchesSubject(sentence, fix.from);
  if (wrongFormAgreement === true) return false;

  const fixedFormAgreement = adjectiveAgreementMatchesSubject(corrected, fix.to);
  if (fixedFormAgreement === false) return false;

  if (!hasUsableHints(prompt.hints)) return false;
  if (isGenericPracticeExplanation(prompt.explanation)) return false;

  return true;
}

function inferAcceptableAnswers(prompt) {
  if (prompt.type !== 'fill_blank') {
    return Array.isArray(prompt.acceptableAnswers)
      ? prompt.acceptableAnswers.map((value) => String(value).trim()).filter(Boolean)
      : undefined;
  }

  const answers = new Set(
    (Array.isArray(prompt.acceptableAnswers) ? prompt.acceptableAnswers : [])
      .map((value) => String(value).trim())
      .filter(Boolean),
  );

  const correct = String(prompt.correctAnswer ?? '').trim().toLowerCase();
  const becauseForms = ['parce que', "parce qu'", 'car'];
  if (becauseForms.some((form) => correct === form || correct.startsWith('parce qu'))) {
    becauseForms.forEach((form) => answers.add(form));
  }

  const hintText = (Array.isArray(prompt.hints) ? prompt.hints : []).join(' ').toLowerCase();
  if (/\bbecause\b/.test(hintText)) {
    becauseForms.forEach((form) => answers.add(form));
  }

  for (const word of prompt.targetWords ?? []) {
    const lemma = String(word).trim().toLowerCase();
    if (becauseForms.includes(lemma)) {
      becauseForms.forEach((form) => answers.add(form));
    }
  }

  answers.delete(String(prompt.correctAnswer ?? '').trim());
  return answers.size > 0 ? [...answers] : undefined;
}

function enrichPrompt(prompt) {
  const enriched = { ...prompt };

  if (enriched.flawedSentence) {
    enriched.flawedSentence = sanitizeFrenchDisplayText(enriched.flawedSentence);
  }
  if (enriched.frenchPrompt) {
    enriched.frenchPrompt = sanitizeFrenchDisplayText(enriched.frenchPrompt);
  }
  if (enriched.sentenceWithBlank) {
    enriched.sentenceWithBlank =
      enriched.type === 'fill_blank'
        ? sanitizeFillBlankSentence(enriched.sentenceWithBlank)
        : sanitizeFrenchDisplayText(enriched.sentenceWithBlank);
  }

  if (enriched.type === 'match_meaning' && !enriched.frenchPrompt?.trim() && enriched.targetWords[0]) {
    enriched.frenchPrompt = enriched.targetWords[0];
  }

  if (enriched.type === 'multiple_choice' && !enriched.sentenceWithBlank?.trim() && enriched.frenchPrompt?.trim()) {
    enriched.sentenceWithBlank = enriched.frenchPrompt.includes('___')
      ? enriched.frenchPrompt
      : undefined;
  }

  enriched.acceptableAnswers = inferAcceptableAnswers(enriched);

  return enriched;
}

function isValidFrenchContext(prompt) {
  const words = prompt.targetWords ?? [];

  switch (prompt.type) {
    case 'match_meaning':
      return (
        Boolean(prompt.frenchPrompt?.trim()) &&
        looksLikeFrench(prompt.frenchPrompt, words) &&
        !looksLikeProperNoun({ lemma: prompt.frenchPrompt, meaning: prompt.frenchPrompt })
      );
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
      ...(entry.adjectiveForms
        ? {
            adjectiveForms: entry.adjectiveForms,
          }
        : {}),
    });
  }

  return grouped;
}

function buildUserPrompt({ entries, stage, focusCategory, completedQuestionIds }) {
  const grouped = groupToolboxByCategory(entries);
  const stageConfig = STAGE_CONFIG[stage];

  const lines = Object.entries(grouped)
    .map(([category, items]) => {
      const wordList = items
        .map((item) => {
          const forms = item.adjectiveForms;
          if (forms?.masculineSingular && forms?.feminineSingular) {
            return `${item.lemma} (${item.meaning}; m: ${forms.masculineSingular}, f: ${forms.feminineSingular})`;
          }
          return `${item.lemma} (${item.meaning})`;
        })
        .join(', ');
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

Generate ${SESSION_QUESTION_COUNT} randomized exercises using ONLY words from this toolbox.
Use at least 2 of each Spot & Match type (fill_blank, match_meaning, match_following, find_error, multiple_choice) when possible.
Never use proper nouns or personal names. Hints must be specific — never say "already in your toolbox".`;
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
        acceptableAnswers: Array.isArray(prompt.acceptableAnswers)
          ? prompt.acceptableAnswers.map((value) => String(value).trim()).filter(Boolean)
          : undefined,
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
        !isGenericPracticeExplanation(prompt.explanation) &&
        hasUsableHints(prompt.hints) &&
        allowedTypes.includes(prompt.type) &&
        isValidChoicePrompt(prompt) &&
        isValidMatchFollowing(prompt) &&
        isValidFindError(prompt) &&
        isValidFillBlank(prompt) &&
        isValidFrenchContext(prompt),
    )
    .slice(0, SESSION_QUESTION_COUNT);
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

  const entries = filterPracticeEntries(filterEntries(allEntries, focusCategory));
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
      ? buildFallbackQuickPrompts(entries, SESSION_QUESTION_COUNT, completedQuestionIds)
      : buildFallbackSentencePrompts(entries, SESSION_QUESTION_COUNT);

  try {
    let aiPrompts = [];
    let estimatedMinutes = '8–10';

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

    const prompts = mergePromptLists(aiPrompts, fallbackPrompts, completedQuestionIds, SESSION_QUESTION_COUNT, stage);

    if (prompts.length < SESSION_MIN_QUESTIONS) {
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

    const prompts = mergePromptLists([], fallbackPrompts, completedQuestionIds, SESSION_QUESTION_COUNT, stage);

    if (prompts.length >= SESSION_MIN_QUESTIONS) {
      return {
        status: 200,
        body: {
          stage,
          focusCategory,
          estimatedMinutes: '8–10',
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
