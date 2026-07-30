import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { sanitizeVocabulary } from './vocabularySanitizer.js';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CORRECTION_SYSTEM_PROMPT = `You are Mot-à-Mot, an AI messaging assistant for French learners (A1–C2).

Your ONLY job in this task is sentence correction and explanation — NOT vocabulary extraction or CEFR-level formal versions (those come in a separate step).

Rules:
- Provide ONE informal version (friends, family, texts) — natural spoken/texting French
- suggestions.informal.english: a natural English translation of the informal French sentence (small, clear, not word-for-word if unnatural)
- For "understood": a clear natural English explanation confirming what the learner intended to say
- explanations.informal: 3–5 lines on conversational shortcuts, spoken French, texting conventions
- Do NOT return a changes array — changes are generated in a separate step
- Ratings are 0–100 integers for grammar and naturalness of the learner's French sentence ONLY
- If the learner clarified in ENGLISH (not French), set both grammar and naturalness ratings to 0
- If the learner clarified in French, rate that French clarification text
- Never say "that's just how French works" — explain the underlying rule or pattern
- Return ONLY valid JSON matching the schema

Tone: friendly, calm, encouraging — like a patient French friend, never judgmental.`;

const FORMAL_LEVELS_SYSTEM_PROMPT = `You generate polite/formal French versions of a message at SIX distinct CEFR levels (A1, A2, B1, B2, C1, C2), calibrated to DELF/DALF exam production standards.

GOAL: Each version must be good enough to PASS the written/production tasks at that diploma level — using the full grammar and vocabulary repertoire that examiners credit at that level, without exceeding it.

DELF A1–B2 and DALF C1–C2 descriptors (production écrite / written expression):

DELF A1 — basic user, survival French:
- Very short connected phrases; present tense (indicative); basic interrogatives
- High-frequency concrete vocabulary: identity, family, numbers, time, shopping, places, immediate needs
- Simple politeness formulas (Bonjour, s'il vous plaît, merci, excusez-moi)
- One or two simple clauses; no subjunctive, no complex tenses, no relative clauses
- A pass-quality A1 answer is short but correct, polite, and clearly communicates the core message

DELF A2 — elementary:
- Routine exchanges; passé composé; futur proche (aller + infinitif); reflexive verbs
- Describe background, environment, immediate needs; simple linking (et, mais, parce que)
- Comparatives, common adverbs, everyday transactional vocabulary
- A pass-quality A2 answer shows controlled past/future reference and slightly longer but still simple syntax

DELF B1 — threshold / independent user:
- Imparfait vs passé composé used appropriately; futur simple; conditionnel présent
- Express opinions, plans, experiences; justify briefly (parce que, donc, cependant)
- Relative pronouns qui/que; si + présent/futur; structured short text with clear connectors
- A pass-quality B1 answer handles connected ideas and common tenses examiners expect at B1

DELF B2 — upper intermediate:
- Subjunctive in high-frequency triggers (il faut que, bien que, pour que); passive voice; pronouns y/en
- Relative pronouns dont/où/lequel; complex sentences with subordinate clauses
- Professional and academic register; nuanced vocabulary; argue a point with supporting detail
- A pass-quality B2 answer demonstrates range, cohesion, and register control expected at B2

DALF C1 — advanced:
- Fluent, well-structured formal text; advanced subjunctive; stylistic and idiomatic choices
- Subtle register control; complex argumentation; precise vocabulary
- A pass-quality C1 answer reads as controlled, sophisticated formal French with few errors

DALF C2 — mastery:
- Near-native formal polish; rhetorical finesse; full nuance of the intended meaning
- Minimal simplification; natural idiomatic formal phrasing
- A pass-quality C2 answer would satisfy the highest production criteria

CRITICAL RULES:
- Return exactly 6 entries — one per level: A1, A2, B1, B2, C1, C2
- Each level MUST have a DIFFERENT sentence — never copy the same text across levels
- Use the MAXIMUM competent production standard for that diploma level (what would earn a pass), not an under-powered stub
- Do NOT use grammar or vocabulary above the level being tested — that fails calibration
- All versions stay polite/formal (teachers, professionals, exams)
- If the full meaning cannot fit a lower level, simplify honestly — describe the scope in limitation using neutral language

Each entry MUST include:
- level: exactly one of A1, A2, B1, B2, C1, C2
- sentence: formal/polite French that would pass DELF/DALF production at this level
- english: natural English translation of this level's French sentence (concise, learner-friendly)
- limitation: neutral scope note for this diploma level — use phrasing like "Out of scope at this level", "Limited to…", "Focuses on…". Do NOT use "cannot" or "unable"
- explanation: 2–3 lines on which DELF/DALF production criteria this version meets and key grammar choices

Do NOT return a changes array — changes are extracted in a separate step from your sentences.

Return ONLY valid JSON matching the schema.`;

const LEVEL_CHANGES_SYSTEM_PROMPT = `You build an accurate, aligned "what changed" breakdown across French sentence versions — and explain each fix in English like a warm native French speaker helping a new student.

INPUTS: learner's ORIGINAL text (may contain errors), informal correction, and six formal sentences (A1–C2) already written.

METHOD — follow in order:
1. Compare the learner's ORIGINAL to the informal correction. Identify ONLY specific spans that were wrong, missing, unnatural, or misspelled — not parts the learner got right.
2. For each issue, create ONE change row tied to a single meaning slot (e.g. verb choice, gender agreement, politeness, word order, vocabulary).
3. youWrote MUST be an exact verbatim substring copied from the learner's ORIGINAL (same spelling, accents, punctuation as they wrote). If you cannot find it in the original, do not invent it.
4. informalFrench MUST be the replacement phrase at the same meaning slot — a contiguous substring of the informal sentence.
5. byLevel: for each level, the replacement at that same meaning slot — a contiguous substring copied from THAT level's formal sentence. When levels restructure grammar, pick the phrase in that sentence that carries the same idea (not the same word position).
6. Verify every byLevel and informalFrench value actually appears inside its target sentence before returning.

Each row fields:
- youWrote: verbatim from learner original (French)
- informalFrench: matching fix phrase from informal sentence (French)
- informalExplanation: 2–4 sentences IN ENGLISH — buddy tone, why this informal fix works
- byLevel: A1–C2 fix phrases (French), each from that level's sentence
- explanationsByLevel: A1–C2, 2–4 sentences IN ENGLISH each — why that level's phrasing fits DELF/DALF scope

QUALITY RULES:
- Prefer several precise rows over one vague row that dumps half the sentence
- Do NOT use the full corrected sentence as youWrote unless the entire original was unusable
- Do NOT use the full sentence as informalFrench/byLevel unless the entire clause was replaced
- When formal sentences differ by level, byLevel phrases MUST differ when the underlying wording differs
- ALL explanation text must be ENGLISH (French may be quoted inline)

Return ONLY valid JSON matching the schema.`;

const BY_LEVEL_STRINGS_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(CEFR_LEVELS.map((level) => [level, { type: 'string' }])),
  required: CEFR_LEVELS,
};

const FORMAL_LEVELS_SCHEMA = {
  type: 'object',
  properties: {
    levels: {
      type: 'array',
      description: 'Exactly six entries, one per CEFR level A1 through C2',
      items: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: CEFR_LEVELS },
          sentence: {
            type: 'string',
            description:
              'Polite formal French that would pass DELF/DALF written production at this level',
          },
          english: {
            type: 'string',
            description: 'Natural English translation of this formal sentence',
          },
          limitation: {
            type: 'string',
            description:
              'Neutral scope note: use "Out of scope", "Limited to", "Focuses on" — not "cannot" or "unable"',
          },
          explanation: {
            type: 'string',
            description: '2–3 lines on DELF/DALF production criteria met and key grammar used',
          },
        },
        required: ['level', 'sentence', 'english', 'limitation', 'explanation'],
      },
    },
  },
  required: ['levels'],
};

const LEVEL_CHANGES_SCHEMA = {
  type: 'object',
  properties: {
    changes: {
      type: 'array',
      description: 'Per-segment phrasing extracted from each provided sentence',
      items: {
        type: 'object',
        properties: {
          youWrote: { type: 'string' },
          informalFrench: { type: 'string' },
          informalExplanation: {
            type: 'string',
            description: 'English only — buddy-style 2–4 sentence explanation for the informal phrasing',
          },
          byLevel: BY_LEVEL_STRINGS_SCHEMA,
          explanationsByLevel: {
            type: 'object',
            description: 'English only — per-level buddy explanations (A1 through C2)',
            properties: Object.fromEntries(
              CEFR_LEVELS.map((level) => [
                level,
                { type: 'string', description: `English explanation for ${level}` },
              ]),
            ),
            required: CEFR_LEVELS,
          },
        },
        required: ['youWrote', 'informalFrench', 'informalExplanation', 'byLevel', 'explanationsByLevel'],
      },
    },
  },
  required: ['changes'],
};

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
            english: { type: 'string', description: 'Natural English translation of informal sentence' },
          },
          required: ['sentence', 'english'],
        },
      },
      required: ['informal'],
    },
    explanations: {
      type: 'object',
      properties: {
        informal: { type: 'string' },
      },
      required: ['informal'],
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
  required: ['understood', 'suggestions', 'explanations', 'ratings'],
};

const VOCABULARY_ITEM_PROPERTIES = {
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
};

const VOCABULARY_LIST_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: VOCABULARY_ITEM_PROPERTIES,
    required: ['lemma', 'surface', 'meaning', 'partOfSpeech', 'example'],
  },
};

const COMBINED_VOCABULARY_SYSTEM_PROMPT = `You are a French linguistics assistant for learners at all levels (A1–C2).

Return TWO vocabulary lists in one JSON response:

1. userVocabulary — extract ALL meaningful vocabulary from the learner's French sentence ONLY (lemma form, include function words). If no learner French is provided, return an empty array.

2. suggestedAdditions — words NEWLY INTRODUCED in ANY corrected French version provided: the informal correction AND every formal level (A1, A2, B1, B2, C1, C2). Compare against what the learner already used — not spelling fixes. Include words that appear only at higher levels (e.g. advanced verbs or connectors in B2/C1). Merge duplicates by lemma + part of speech. Multi-word expressions stay together. Lemma form for verbs/adjectives.

Part of speech: Noun, Verb, Adjective, Adverb, Pronoun, Article / Determiner, Preposition, Conjunction, Expression, Negation Particle, Reflexive Pronoun

"ne" and "pas" are separate entries. Never combine negation with a verb.
Return ONLY valid JSON.`;

const COMBINED_VOCABULARY_SCHEMA = {
  type: 'object',
  properties: {
    userVocabulary: VOCABULARY_LIST_SCHEMA,
    suggestedAdditions: VOCABULARY_LIST_SCHEMA,
  },
  required: ['userVocabulary', 'suggestedAdditions'],
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
      return 'Your Google account has no free Gemini quota left. Wait an hour, or create a new API key at https://aistudio.google.com/apikey';
    }
    return 'Gemini rate limit reached. Wait a minute and try again.';
  }

  if (error?.provider === 'gemini' && String(error.message).includes('quota')) {
    return 'Gemini free quota exceeded. Wait a few minutes and try again, or use a new API key from https://aistudio.google.com/apikey';
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

function buildCombinedVocabularyPrompt(
  userFrench,
  learnerFrench,
  informalSentence,
  formalByLevel,
) {
  const userSection = userFrench
    ? `Learner's French (extract userVocabulary from this):\n"${userFrench}"`
    : 'No learner French provided — return an empty userVocabulary array.';

  const formalSections = CEFR_LEVELS.map(
    (level) => `Corrected (formal ${level}): "${formalByLevel[level].sentence}"`,
  ).join('\n');

  return `${userSection}

Learner's French baseline for comparing new words:
"${learnerFrench}"

Corrected (informal):
"${informalSentence}"

${formalSections}

Extract userVocabulary from the learner French above (if any).
Extract suggestedAdditions from the UNION of all corrected versions above — informal plus every formal level A1 through C2. Include words introduced at any level that the learner did not already use.`;
}

function getFrenchBaseline(originalSentence, clarification) {
  if (clarification?.mode === 'french' && clarification.text?.trim()) {
    return clarification.text.trim();
  }
  return originalSentence;
}

function getUserFrenchForVocabulary(originalSentence, clarification) {
  if (clarification?.mode === 'english') return null;
  if (clarification?.mode === 'french' && clarification.text?.trim()) {
    return clarification.text.trim();
  }
  return originalSentence;
}

function buildFormalLevelsPrompt(sentence, understood, informalSentence, clarification, retry = false) {
  let prompt = `Generate six DISTINCT polite/formal French versions (A1 through C2) for this message.
Each version must be calibrated to pass the DELF (A1–B2) or DALF (C1–C2) written production exam at that level — use the full grammar and vocabulary credited at that diploma, without exceeding it.

Original learner message: "${sentence}"
Intended meaning: ${understood}
Informal French reference: "${informalSentence}"`;

  const clarificationText = clarification?.text?.trim();
  if (clarificationText) {
    if (clarification.mode === 'english') {
      prompt += `\n\nLearner clarified in English: "${clarificationText}"`;
    } else {
      prompt += `\n\nLearner clarified in French: "${clarificationText}"`;
    }
  }

  if (retry) {
    prompt +=
      '\n\nIMPORTANT: Your previous attempt repeated sentences across levels or exceeded diploma boundaries. Each level MUST use pass-quality grammar for that DELF/DALF level only. All six sentences must differ.';
  }

  return prompt;
}

function buildLevelChangesPrompt(originalSentence, informalSentence, byLevel, retry = false) {
  const levelLines = CEFR_LEVELS.map(
    (level) => `${level}: "${byLevel[level].sentence}"`,
  ).join('\n');

  let prompt = `Compare the learner's ORIGINAL against each corrected sentence below. Build precise change rows — one per specific error or fix, not whole-sentence dumps.

Learner's ORIGINAL (youWrote must be copied verbatim from here only):
"${originalSentence}"

Informal correction:
"${informalSentence}"

Formal sentences (byLevel phrases must be copied from the matching line only):
${levelLines}

For each specific issue: youWrote from original → informalFrench from informal → byLevel A1–C2 from each formal line. English buddy explanations for informal and each level.`;

  if (retry) {
    prompt +=
      '\n\nIMPORTANT: Previous attempt failed alignment checks. youWrote must appear verbatim in the learner ORIGINAL. informalFrench must appear in the informal sentence. Each byLevel value must appear in that level\'s formal sentence. Use smaller, precise spans — not whole sentences. Re-read each target sentence word by word.';
  }

  return prompt;
}

function mapFormalLevelsArray(levels) {
  const byLevel = {};
  const explanationsByLevel = {};

  for (const item of levels ?? []) {
    const level = String(item?.level ?? '')
      .trim()
      .toUpperCase();
    if (!CEFR_LEVELS.includes(level)) continue;
    if (!item?.sentence?.trim()) continue;

    byLevel[level] = {
      sentence: item.sentence.trim(),
      english: item.english?.trim() || '',
      limitation: item.limitation?.trim() || 'Limited to the core meaning at this diploma level.',
    };
    explanationsByLevel[level] = item.explanation?.trim() || '';
  }

  return { byLevel, explanationsByLevel };
}

function hasCompleteByLevel(byLevel) {
  return CEFR_LEVELS.every((level) => byLevel[level]?.sentence?.trim());
}

function countUniqueFormalSentences(byLevel) {
  const sentences = CEFR_LEVELS.map((level) => byLevel[level]?.sentence?.trim().toLowerCase()).filter(
    Boolean,
  );
  return new Set(sentences).size;
}

function mapLevelStrings(source) {
  const mapped = {};
  for (const level of CEFR_LEVELS) {
    const value = source?.[level]?.trim();
    if (value) mapped[level] = value;
  }
  return mapped;
}

function mapFormalLevelsChanges(changes) {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => {
      const byLevel = mapLevelStrings(change?.byLevel);
      const explanationsByLevel = mapLevelStrings(change?.explanationsByLevel);

      if (!change?.youWrote?.trim() || !change?.informalFrench?.trim()) return null;
      if (CEFR_LEVELS.some((level) => !byLevel[level])) return null;

      return {
        youWrote: change.youWrote.trim(),
        informalFrench: change.informalFrench.trim(),
        informalExplanation: change.informalExplanation?.trim() || undefined,
        byLevel,
        explanationsByLevel:
          CEFR_LEVELS.every((level) => explanationsByLevel[level]) ? explanationsByLevel : undefined,
      };
    })
    .filter(Boolean);
}

function normalizeForMatch(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phraseAppearsInSentence(phrase, sentence) {
  const normalizedPhrase = normalizeForMatch(phrase);
  const normalizedSentence = normalizeForMatch(sentence);
  if (!normalizedPhrase || !normalizedSentence) return false;
  return normalizedSentence.includes(normalizedPhrase);
}

function levelChangeSignaturesDiffer(changes) {
  const signatures = CEFR_LEVELS.map((level) =>
    changes
      .map((change) => change.byLevel[level]?.trim().toLowerCase() ?? '')
      .join('|'),
  );
  return new Set(signatures).size >= 2;
}

function changesArePersonalized(changes, byLevel, informalSentence, originalSentence) {
  if (!changes.length) return false;

  const sentencesDiffer = countUniqueFormalSentences(byLevel) >= 2;

  for (const change of changes) {
    if (!phraseAppearsInSentence(change.youWrote, originalSentence)) {
      return false;
    }
    if (!phraseAppearsInSentence(change.informalFrench, informalSentence)) {
      return false;
    }

    for (const level of CEFR_LEVELS) {
      if (!phraseAppearsInSentence(change.byLevel[level], byLevel[level].sentence)) {
        return false;
      }
    }
  }

  if (sentencesDiffer && !levelChangeSignaturesDiffer(changes)) {
    return false;
  }

  return true;
}

function mergeCorrectionWithFormalLevels(correction, byLevel, explanationsByLevel, changes) {
  if (!hasCompleteByLevel(byLevel)) {
    throw new Error('Formal level generation returned incomplete levels.');
  }

  return {
    understood: correction.understood,
    suggestions: {
      informal: correction.suggestions.informal,
      byLevel,
    },
    changes,
    explanations: {
      informal: correction.explanations.informal,
      byLevel: explanationsByLevel,
    },
    ratings: correction.ratings,
  };
}

async function runCorrection(config, sentence, clarification) {
  return generateStructured(config, {
    systemPrompt: CORRECTION_SYSTEM_PROMPT,
    userPrompt: buildCorrectionPrompt(sentence, clarification),
    schema: CORRECTION_SCHEMA,
    schemaName: 'french_correction',
    ollamaSchemaHint:
      'Keys: understood, suggestions ({informal: {sentence, english}}), explanations ({informal}), ratings ({grammar, naturalness}).',
  });
}

async function runFormalLevels(config, sentence, understood, informalSentence, clarification, retry = false) {
  return generateStructured(config, {
    systemPrompt: FORMAL_LEVELS_SYSTEM_PROMPT,
    userPrompt: buildFormalLevelsPrompt(sentence, understood, informalSentence, clarification, retry),
    schema: FORMAL_LEVELS_SCHEMA,
    schemaName: 'french_formal_levels',
    ollamaSchemaHint:
      'Keys: levels (array of 6: {level, sentence, english, limitation, explanation}). Each sentence must differ by level.',
  });
}

async function runLevelChanges(config, originalSentence, informalSentence, byLevel, retry = false) {
  return generateStructured(config, {
    systemPrompt: LEVEL_CHANGES_SYSTEM_PROMPT,
    userPrompt: buildLevelChangesPrompt(originalSentence, informalSentence, byLevel, retry),
    schema: LEVEL_CHANGES_SCHEMA,
    schemaName: 'french_level_changes',
    ollamaSchemaHint:
      'Keys: changes (array of {youWrote, informalFrench, informalExplanation (English), byLevel, explanationsByLevel (English A1..C2)}).',
  });
}

async function runLevelChangesWithRetry(config, originalSentence, informalSentence, byLevel) {
  let changesResult = await runLevelChanges(
    config,
    originalSentence,
    informalSentence,
    byLevel,
  );
  let changes = mapFormalLevelsChanges(changesResult?.changes);

  if (!changesArePersonalized(changes, byLevel, informalSentence, originalSentence)) {
    console.warn('Level changes were not personalized — retrying once.');
    changesResult = await runLevelChanges(
      config,
      originalSentence,
      informalSentence,
      byLevel,
      true,
    );
    changes = mapFormalLevelsChanges(changesResult?.changes);
  }

  if (!changesArePersonalized(changes, byLevel, informalSentence, originalSentence)) {
    throw new Error('Could not generate level-specific changes.');
  }

  return changes;
}

async function runFormalLevelsWithRetry(
  config,
  sentence,
  understood,
  informalSentence,
  clarification,
) {
  let formalLevelsResult = await runFormalLevels(
    config,
    sentence,
    understood,
    informalSentence,
    clarification,
  );
  let { byLevel } = mapFormalLevelsArray(formalLevelsResult?.levels);

  if (countUniqueFormalSentences(byLevel) < 3 || !hasCompleteByLevel(byLevel)) {
    console.warn('Formal levels lacked distinct sentences or completeness — retrying once.');
    formalLevelsResult = await runFormalLevels(
      config,
      sentence,
      understood,
      informalSentence,
      clarification,
      true,
    );
    ({ byLevel } = mapFormalLevelsArray(formalLevelsResult?.levels));
  }

  if (!hasCompleteByLevel(byLevel)) {
    throw new Error('Could not generate all six CEFR formal levels.');
  }

  if (countUniqueFormalSentences(byLevel) < 2) {
    throw new Error('Formal levels were too similar across CEFR levels.');
  }

  return formalLevelsResult;
}

async function runCombinedVocabularyExtraction(
  config,
  userFrench,
  learnerFrench,
  informalSentence,
  formalByLevel,
) {
  return generateStructured(config, {
    systemPrompt: COMBINED_VOCABULARY_SYSTEM_PROMPT,
    userPrompt: buildCombinedVocabularyPrompt(
      userFrench,
      learnerFrench,
      informalSentence,
      formalByLevel,
    ),
    schema: COMBINED_VOCABULARY_SCHEMA,
    schemaName: 'french_vocabulary_combined',
    ollamaSchemaHint:
      'Keys: userVocabulary (array), suggestedAdditions (array) — suggestedAdditions from informal + formal A1–C2. Each item {lemma, surface, meaning, partOfSpeech, example}.',
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
    const correction = await runCorrection(config, trimmed, clarification);

    if (clarification?.mode === 'english') {
      correction.ratings = { grammar: 0, naturalness: 0 };
    }

    const formalLevelsResult = await runFormalLevelsWithRetry(
      config,
      trimmed,
      correction.understood,
      correction.suggestions.informal.sentence,
      clarification,
    );
    const { byLevel, explanationsByLevel } = mapFormalLevelsArray(formalLevelsResult?.levels);
    const changes = await runLevelChangesWithRetry(
      config,
      trimmed,
      correction.suggestions.informal.sentence,
      byLevel,
    );
    const merged = mergeCorrectionWithFormalLevels(
      correction,
      byLevel,
      explanationsByLevel,
      changes,
    );

    const frenchBaseline = getFrenchBaseline(trimmed, clarification);
    const userFrench = getUserFrenchForVocabulary(trimmed, clarification);

    let userVocabulary = [];
    let suggestedAdditions = [];

    try {
      const vocabResult = await runCombinedVocabularyExtraction(
        config,
        userFrench,
        frenchBaseline,
        merged.suggestions.informal.sentence,
        merged.suggestions.byLevel,
      );
      userVocabulary = sanitizeVocabulary(vocabResult.userVocabulary ?? []);
      suggestedAdditions = sanitizeVocabulary(vocabResult.suggestedAdditions ?? []);
    } catch (vocabError) {
      console.warn('Vocabulary extraction failed (correction still returned):', vocabError.message);
    }

    return {
      status: 200,
      body: {
        ...merged,
        userVocabulary,
        suggestedAdditions,
      },
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return { status: 500, body: { message: mapAnalysisError(error) } };
  }
}
