import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { sanitizeVocabulary } from './vocabularySanitizer.js';

const WRITING_STYLES = ['simple', 'natural', 'refined'];

const CORRECTION_SYSTEM_PROMPT = `You are Mot-à-Mot, a French practice buddy — not a grammar textbook or proficiency examiner.

Your ONLY job in this task is everyday speaking correction and explanation — NOT writing-style versions or vocabulary (those come in separate steps).

Rules:
- Provide ONE everyday speaking version — how a native would naturally say this in conversation (friends, family, texts)
- suggestions.speaking.english: natural English translation of the speaking French
- For "understood": confirm what the learner intended — include EVERY clause and reason
- When the learner clarifies in ENGLISH, suggestions.speaking MUST express the COMPLETE intended meaning — every "because" clause, not a summary
- explanations.speaking: 3–5 lines on why this sounds natural when speaking — conversational shortcuts, spoken French, texting conventions
- Do NOT return a changes array — changes come in a separate step
- Ratings are 0–100 integers for grammar and naturalness of the learner's French sentence ONLY
- Rating rubric (apply consistently — the same French text must always receive the same scores):
  - Grammar: count objective errors only (agreement, conjugation, spelling, word order, missing/extra words). Perfect = 95–100, one minor error = 80–92, two minor errors = 70–85, several fixable errors with clear meaning = 60–75, major errors that block understanding = below 55
  - Naturalness: how native the phrasing sounds if grammar is ignored. Awkward but understandable = 55–70, mostly natural = 75–88, fully natural = 90–100
  - If meaning comes through clearly, do not score below 60 on either dimension unless errors seriously confuse a reader
  - Round to whole numbers. Do not vary scores for identical input
- If the learner clarified in ENGLISH, set both grammar and naturalness ratings to 0
- If the learner clarified in French, rate that French clarification text
- Never say "that's just how French works" — explain the underlying rule or pattern
- Return ONLY valid JSON matching the schema

Tone: friendly, calm, encouraging — like a patient French friend, never judgmental.`;

const WRITING_STYLES_SYSTEM_PROMPT = `You generate THREE written French versions of the same message — Foundation, Expanding, and Fluent (internal keys: simple, natural, refined) — for learners who want to practice writing (not speaking).

CORE PHILOSOPHY — Mot-à-Mot is a practice buddy, NOT a proficiency examiner:
- These are writing LAYERS in a learning journey — not CEFR/DELF levels or judgments of ability.
- Never increase complexity unless it creates real communicative value.
- Never change, add, or remove meaning — only how the same idea is written.
- Identical sentences across layers are ALLOWED and ENCOURAGED when no better version exists.

THE THREE LAYERS:

Foundation (simple) — Clear, correct writing using common vocabulary. Include the FULL intended meaning using straightforward structures.

Expanding (natural) — Introduces richer vocabulary and more varied sentence structures while keeping the same meaning.

Fluent (refined) — Uses polished, natural written French where it genuinely adds value. If a simpler layer is already the best choice, repeat it (sameAsPrevious: true).

RULES:
1. Preserve meaning — include the FULL message in Foundation when possible; only omit if truly unwieldy and explain in note.
2. Never invent new ideas or bureaucratic phrasing to sound "advanced."
3. sameAsPrevious: true when this layer's sentence is IDENTICAL to the previous layer. For Fluent, this often means "no richer wording adds value" — that is a valid and good answer.
4. coversFullMeaning: false only if a clause could not fit even in Foundation — explain in note which part and why.

Examples:
- "Bonjour. Ça va?" → Foundation: "Bonjour, comment allez-vous ?" / Expanding & Fluent: same (sameAsPrevious: true)
- "Je suis fatigué." → Foundation: "Je suis fatigué." / Expanding: "Je suis très fatigué." / Fluent: "Je suis complètement épuisé."
- "Merci beaucoup." → Foundation & Expanding: "Merci beaucoup." / Fluent: "Je vous remercie sincèrement." (only because people actually write this)

Return exactly 3 entries: simple, natural, refined.

Each entry MUST include:
- style: exactly one of simple, natural, refined
- sentence: written French for this style
- english: natural English translation of what the French actually says
- explanation: 2–3 lines IN ENGLISH — why this style choice works (or why same as previous)
- sameAsPrevious: boolean — true when identical to the previous style
- coversFullMeaning: boolean — true when every intended clause is expressed
- note: optional plain-English note when coversFullMeaning is false or when reusing a previous style

Return ONLY valid JSON matching the schema.`;

const STYLE_CHANGES_SYSTEM_PROMPT = `You build an accurate "what changed" breakdown across French sentence versions — and explain each fix in English like a warm native French speaker helping a new student.

INPUTS: learner's ORIGINAL text, everyday speaking correction, and three written versions (simple, natural, refined).

METHOD:
1. Compare the learner's ORIGINAL to the speaking correction. Identify ONLY specific spans that were wrong, missing, unnatural, or misspelled.
2. For each issue, create ONE change row tied to a single meaning slot.
3. youWrote MUST be an exact verbatim substring from the learner's ORIGINAL.
4. speakingFrench MUST be the replacement phrase — a contiguous substring of the speaking sentence.
5. byStyle: for each writing style, the replacement at that meaning slot — copied from THAT style's sentence. Use "" when that style's sentence is identical to the previous style for this slot or no change applies.
6. Verify every non-empty value appears inside its target sentence.
7. Do NOT create a change row when the learner's span already matches the correction — omit that issue entirely. Do NOT use "" in byStyle and then explain a non-change.

Each row:
- youWrote, speakingFrench, speakingExplanation (English)
- byStyle: { simple, natural, refined } — "" when no change at that style
- explanationsByStyle: English explanation per style

Return empty changes array if the sentence is already correct.

Return ONLY valid JSON matching the schema.`;

const BY_STYLE_STRINGS_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(WRITING_STYLES.map((style) => [style, { type: 'string' }])),
  required: WRITING_STYLES,
};

const WRITING_STYLES_SCHEMA = {
  type: 'object',
  properties: {
    styles: {
      type: 'array',
      description: 'Exactly three entries: simple, natural, refined',
      items: {
        type: 'object',
        properties: {
          style: { type: 'string', enum: WRITING_STYLES },
          sentence: { type: 'string', description: 'Written French for this style' },
          english: { type: 'string', description: 'English translation of this written sentence' },
          explanation: { type: 'string', description: 'English — why this style works or why same as previous' },
          sameAsPrevious: { type: 'boolean', description: 'True when identical to the previous writing style' },
          coversFullMeaning: { type: 'boolean', description: 'True when full intended meaning is expressed' },
          note: { type: 'string', description: 'Optional note when meaning is partial or style reuses previous' },
        },
        required: ['style', 'sentence', 'english', 'explanation', 'sameAsPrevious', 'coversFullMeaning'],
      },
    },
  },
  required: ['styles'],
};

const STYLE_CHANGES_SCHEMA = {
  type: 'object',
  properties: {
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          youWrote: { type: 'string' },
          speakingFrench: { type: 'string' },
          speakingExplanation: { type: 'string', description: 'English only' },
          byStyle: BY_STYLE_STRINGS_SCHEMA,
          explanationsByStyle: {
            type: 'object',
            properties: Object.fromEntries(
              WRITING_STYLES.map((style) => [style, { type: 'string' }]),
            ),
            required: WRITING_STYLES,
          },
        },
        required: ['youWrote', 'speakingFrench', 'speakingExplanation', 'byStyle', 'explanationsByStyle'],
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
        speaking: {
          type: 'object',
          properties: {
            sentence: { type: 'string' },
            english: { type: 'string', description: 'Natural English translation of speaking sentence' },
          },
          required: ['sentence', 'english'],
        },
      },
      required: ['speaking'],
    },
    explanations: {
      type: 'object',
      properties: {
        speaking: { type: 'string' },
      },
      required: ['speaking'],
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

const COMBINED_VOCABULARY_SYSTEM_PROMPT = `You are a French linguistics assistant for learners.

Return TWO vocabulary lists in one JSON response:

1. userVocabulary — extract ALL meaningful vocabulary from the learner's French sentence ONLY (lemma form, include function words). If no learner French is provided, return an empty array.

2. suggestedAdditions — words NEWLY INTRODUCED in ANY corrected French version provided: the everyday speaking correction AND every writing style (simple, natural, refined). Compare against what the learner already used — not spelling fixes. Merge duplicates by lemma + part of speech. Multi-word expressions stay together. Lemma form for verbs/adjectives.

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

export function configurationMessage() {
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

function buildPracticeContext(practicePrompt) {
  if (!practicePrompt) return '';

  const words = (practicePrompt.targetWords ?? []).join(', ');
  return `PRACTICE MODE — the learner is completing a practice exercise, not free-form messaging.

Practice task: ${practicePrompt.title}
Instruction: ${practicePrompt.instruction}
Words they should use: ${words}

IMPORTANT for suggestions.speaking:
- Provide an OBJECTIVELY CORRECT model answer in everyday spoken French that fully completes this practice task and uses the required words naturally.
- Do NOT merely patch the learner's sentence — show what a strong, natural answer looks like even if their attempt was wrong or incomplete.
- understood should describe what a good answer to this practice task expresses in English.

Still rate grammar and naturalness on what the learner ACTUALLY wrote.

PRACTICE RATING GUIDANCE:
- Reward communicative success — if they fulfilled the task and meaning is clear, grammar should rarely fall below 65
- One accent, spelling, or agreement slip with clear meaning: grammar 80–92
- Multiple fixable errors but understandable: grammar 65–80
- Do not double-penalize the same issue in both grammar and naturalness
- Naturalness: if a native speaker would easily understand in context, score at least 70`;
}

function buildCorrectionPrompt(sentence, clarification, practicePrompt) {
  let prompt = practicePrompt
    ? `${buildPracticeContext(practicePrompt)}\n\nLearner's attempt:\n"${sentence}"`
    : `Correct this French message and return structured feedback:\n\n"${sentence}"`;

  const clarificationText = clarification?.text?.trim();
  if (clarificationText) {
    if (clarification.mode === 'english') {
      prompt += `\n\nThe learner clarified their intended meaning in English:\n"${clarificationText}"\n\nUse this to interpret what they meant. The everyday speaking correction MUST include every clause and reason — do not drop trailing "because" explanations.`;
    } else {
      prompt += `\n\nThe learner rewrote what they meant in French:\n"${clarificationText}"\n\nUse this to interpret their intent.`;
    }
  }

  return prompt;
}

function buildCombinedVocabularyPrompt(
  userFrench,
  learnerFrench,
  speakingSentence,
  writingByStyle,
) {
  const userSection = userFrench
    ? `Learner's French (extract userVocabulary from this):\n"${userFrench}"`
    : 'No learner French provided — return an empty userVocabulary array.';

  const writingSections = WRITING_STYLES.map(
    (style) => `Corrected (writing ${style}): "${writingByStyle[style].sentence}"`,
  ).join('\n');

  return `${userSection}

Learner's French baseline for comparing new words:
"${learnerFrench}"

Corrected (everyday speaking):
"${speakingSentence}"

${writingSections}

Extract userVocabulary from the learner French above (if any).
Extract suggestedAdditions from the UNION of all corrected versions — speaking plus every writing style. Include words the learner did not already use.`;
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

function buildWritingStylesPrompt(
  sentence,
  understood,
  speakingSentence,
  clarification,
  practicePrompt,
  retry = false,
) {
  let prompt = `Generate three written French versions (simple, natural, refined) for this message.
Include the FULL intended meaning in Foundation when possible. Never change meaning. Use sameAsPrevious when a layer adds no value — especially at Fluent.

Original learner message: "${sentence}"
Full intended meaning: ${understood}
Everyday speaking reference: "${speakingSentence}"`;

  if (practicePrompt) {
    const words = (practicePrompt.targetWords ?? []).join(', ');
    prompt += `\n\nPRACTICE MODE: Generate Foundation, Expanding, and Fluent as objectively correct WRITTEN model answers to the practice task — "${practicePrompt.title}: ${practicePrompt.instruction}". Each layer must fulfill the task and incorporate these words naturally: ${words}. These are ideal answers to the exercise, not minimal rewrites of the learner's attempt.`;
  }

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
      '\n\nIMPORTANT: Previous attempt changed meaning or forced unnecessary complexity. Preserve the SAME intent. Use sameAsPrevious when no better written version exists.';
  }

  return prompt;
}

function buildStyleChangesPrompt(originalSentence, speakingSentence, writingByStyle, retry = false) {
  const styleLines = WRITING_STYLES.map(
    (style) =>
      `${style}: "${writingByStyle[style].sentence}"${writingByStyle[style].sameAsPrevious ? ' (same as previous style)' : ''}`,
  ).join('\n');

  let prompt = `Compare the learner's ORIGINAL against each corrected sentence below. Build precise change rows.

Learner's ORIGINAL (youWrote must be copied verbatim from here only):
"${originalSentence}"

Everyday speaking correction:
"${speakingSentence}"

Written versions (byStyle phrases must be copied from the matching line only):
${styleLines}

For each issue: youWrote → speakingFrench → byStyle simple/natural/refined. English explanations. Return empty array if already correct.`;

  if (retry) {
    prompt +=
      '\n\nIMPORTANT: Alignment failed. youWrote from ORIGINAL only. speakingFrench from speaking sentence. Non-empty byStyle from that style\'s sentence. Use "" when no change at that style.';
  }

  return prompt;
}

function mapWritingStylesArray(styles) {
  const writing = {};
  const explanationsByStyle = {};

  for (const item of styles ?? []) {
    const style = String(item?.style ?? '')
      .trim()
      .toLowerCase();
    if (!WRITING_STYLES.includes(style)) continue;
    if (!item?.sentence?.trim()) continue;

    writing[style] = {
      sentence: item.sentence.trim(),
      english: item.english?.trim() || '',
      explanation: item.explanation?.trim() || '',
      sameAsPrevious: Boolean(item.sameAsPrevious),
      coversFullMeaning: item.coversFullMeaning !== false,
      note: item.note?.trim() || undefined,
    };
    explanationsByStyle[style] = item.explanation?.trim() || '';
  }

  normalizeSameAsPreviousFlags(writing);

  return { writing, explanationsByStyle };
}

function normalizeSameAsPreviousFlags(writing) {
  if (writing.simple) {
    writing.simple.sameAsPrevious = false;
  }

  if (writing.simple && writing.natural) {
    writing.natural.sameAsPrevious =
      normalizeForMatch(writing.natural.sentence) === normalizeForMatch(writing.simple.sentence);
  }

  if (writing.natural && writing.refined) {
    writing.refined.sameAsPrevious =
      normalizeForMatch(writing.refined.sentence) === normalizeForMatch(writing.natural.sentence);
  }
}

function hasCompleteWriting(writing) {
  return WRITING_STYLES.every((style) => writing[style]?.sentence?.trim());
}

function mapStyleStrings(source, { allowEmpty = false } = {}) {
  const mapped = {};
  for (const style of WRITING_STYLES) {
    if (!(style in (source ?? {}))) continue;
    const trimmed = String(source[style] ?? '').trim();
    if (trimmed || allowEmpty) mapped[style] = trimmed;
  }
  return mapped;
}

function hasAllStyleKeys(source, { allowEmpty = false } = {}) {
  return WRITING_STYLES.every((style) => {
    if (!(style in (source ?? {}))) return false;
    const trimmed = String(source[style] ?? '').trim();
    return allowEmpty || Boolean(trimmed);
  });
}

function allWritingSentencesIdentical(writing) {
  const baseline = normalizeForMatch(writing.simple?.sentence ?? '');
  if (!baseline) return false;
  return WRITING_STYLES.every((style) => normalizeForMatch(writing[style]?.sentence ?? '') === baseline);
}

function changeHasRealEdit(change) {
  if (normalizeForMatch(change.youWrote) !== normalizeForMatch(change.speakingFrench)) {
    return true;
  }

  return WRITING_STYLES.some((style) => {
    const phrase = change.byStyle[style]?.trim();
    return phrase && normalizeForMatch(phrase) !== normalizeForMatch(change.youWrote);
  });
}

function mapStyleChanges(changes) {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => {
      const byStyle = mapStyleStrings(change?.byStyle, { allowEmpty: true });
      const explanationsByStyle = mapStyleStrings(change?.explanationsByStyle, { allowEmpty: true });
      const speakingFrench = change?.speakingFrench?.trim() || change?.informalFrench?.trim();

      if (!change?.youWrote?.trim() || !speakingFrench) return null;
      if (!hasAllStyleKeys(byStyle, { allowEmpty: true })) return null;

      return {
        youWrote: change.youWrote.trim(),
        speakingFrench,
        speakingExplanation: change.speakingExplanation?.trim() || change.informalExplanation?.trim() || undefined,
        byStyle,
        explanationsByStyle:
          hasAllStyleKeys(explanationsByStyle, { allowEmpty: true }) ? explanationsByStyle : undefined,
      };
    })
    .filter(Boolean)
    .filter(changeHasRealEdit);
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

function changesArePersonalized(changes, writing, speakingSentence, originalSentence) {
  if (!changes.length) {
    return allWritingSentencesIdentical(writing);
  }

  for (const change of changes) {
    if (!phraseAppearsInSentence(change.youWrote, originalSentence)) {
      return false;
    }
    if (!phraseAppearsInSentence(change.speakingFrench, speakingSentence)) {
      return false;
    }

    for (const style of WRITING_STYLES) {
      const phrase = change.byStyle[style];
      if (!phrase?.trim()) continue;
      if (!phraseAppearsInSentence(phrase, writing[style].sentence)) {
        return false;
      }
    }
  }

  return true;
}

function mergeCorrectionWithWriting(correction, writing, explanationsByStyle, changes) {
  if (!hasCompleteWriting(writing)) {
    throw new Error('Writing style generation returned incomplete styles.');
  }

  return {
    understood: correction.understood,
    suggestions: {
      speaking: correction.suggestions.speaking,
      writing,
    },
    changes,
    explanations: {
      speaking: correction.explanations.speaking,
      writing: explanationsByStyle,
    },
    ratings: correction.ratings,
  };
}

async function runCorrection(config, sentence, clarification, practicePrompt) {
  return generateStructured(config, {
    systemPrompt: CORRECTION_SYSTEM_PROMPT,
    userPrompt: buildCorrectionPrompt(sentence, clarification, practicePrompt),
    schema: CORRECTION_SCHEMA,
    schemaName: 'french_correction',
    ollamaSchemaHint:
      'Keys: understood, suggestions ({speaking: {sentence, english}}), explanations ({speaking}), ratings ({grammar, naturalness}).',
    temperature: 0.1,
  });
}

async function runWritingStyles(
  config,
  sentence,
  understood,
  speakingSentence,
  clarification,
  practicePrompt,
  retry = false,
) {
  return generateStructured(config, {
    systemPrompt: WRITING_STYLES_SYSTEM_PROMPT,
    userPrompt: buildWritingStylesPrompt(
      sentence,
      understood,
      speakingSentence,
      clarification,
      practicePrompt,
      retry,
    ),
    schema: WRITING_STYLES_SCHEMA,
    schemaName: 'french_writing_styles',
    ollamaSchemaHint:
      'Keys: styles (array of 3: {style, sentence, english, explanation, sameAsPrevious, coversFullMeaning, note?}).',
  });
}

async function runStyleChanges(config, originalSentence, speakingSentence, writing, retry = false) {
  return generateStructured(config, {
    systemPrompt: STYLE_CHANGES_SYSTEM_PROMPT,
    userPrompt: buildStyleChangesPrompt(originalSentence, speakingSentence, writing, retry),
    schema: STYLE_CHANGES_SCHEMA,
    schemaName: 'french_style_changes',
    ollamaSchemaHint:
      'Keys: changes (array of {youWrote, speakingFrench, speakingExplanation, byStyle, explanationsByStyle}).',
  });
}

async function runStyleChangesWithRetry(config, originalSentence, speakingSentence, writing) {
  let changesResult = await runStyleChanges(config, originalSentence, speakingSentence, writing);
  let changes = mapStyleChanges(changesResult?.changes);

  if (!changesArePersonalized(changes, writing, speakingSentence, originalSentence)) {
    console.warn('Style changes were not personalized — retrying once.');
    changesResult = await runStyleChanges(config, originalSentence, speakingSentence, writing, true);
    changes = mapStyleChanges(changesResult?.changes);
  }

  if (!changesArePersonalized(changes, writing, speakingSentence, originalSentence)) {
    throw new Error('Could not generate style-specific changes.');
  }

  return changes;
}

async function runWritingStylesWithRetry(
  config,
  sentence,
  understood,
  speakingSentence,
  clarification,
  practicePrompt,
) {
  let writingStylesResult = await runWritingStyles(
    config,
    sentence,
    understood,
    speakingSentence,
    clarification,
    practicePrompt,
  );
  let { writing } = mapWritingStylesArray(writingStylesResult?.styles);

  if (!hasCompleteWriting(writing)) {
    console.warn('Writing styles were incomplete — retrying once.');
    writingStylesResult = await runWritingStyles(
      config,
      sentence,
      understood,
      speakingSentence,
      clarification,
      practicePrompt,
      true,
    );
    ({ writing } = mapWritingStylesArray(writingStylesResult?.styles));
  }

  if (!hasCompleteWriting(writing)) {
    throw new Error('Could not generate all three writing styles.');
  }

  return writingStylesResult;
}

async function runCombinedVocabularyExtraction(
  config,
  userFrench,
  learnerFrench,
  speakingSentence,
  writingByStyle,
) {
  return generateStructured(config, {
    systemPrompt: COMBINED_VOCABULARY_SYSTEM_PROMPT,
    userPrompt: buildCombinedVocabularyPrompt(
      userFrench,
      learnerFrench,
      speakingSentence,
      writingByStyle,
    ),
    schema: COMBINED_VOCABULARY_SCHEMA,
    schemaName: 'french_vocabulary_combined',
    ollamaSchemaHint:
      'Keys: userVocabulary (array), suggestedAdditions (array) — from speaking + writing simple/natural/refined.',
  });
}

export async function analyzeSentence(input) {
  const sentence = typeof input === 'string' ? input : input?.sentence;
  const clarification = typeof input === 'object' ? input?.clarification : undefined;
  const practicePrompt = typeof input === 'object' ? input?.practicePrompt : undefined;
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
    const correction = await runCorrection(config, trimmed, clarification, practicePrompt);

    if (clarification?.mode === 'english') {
      correction.ratings = { grammar: 0, naturalness: 0 };
    }

    const writingStylesResult = await runWritingStylesWithRetry(
      config,
      trimmed,
      correction.understood,
      correction.suggestions.speaking.sentence,
      clarification,
      practicePrompt,
    );
    const { writing, explanationsByStyle } = mapWritingStylesArray(writingStylesResult?.styles);
    const changes = await runStyleChangesWithRetry(
      config,
      trimmed,
      correction.suggestions.speaking.sentence,
      writing,
    );
    const merged = mergeCorrectionWithWriting(
      correction,
      writing,
      explanationsByStyle,
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
        merged.suggestions.speaking.sentence,
        merged.suggestions.writing,
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
