import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { sanitizeVocabulary } from './vocabularySanitizer.js';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CORRECTION_SYSTEM_PROMPT = `You are Mot-à-Mot, an AI messaging assistant for French learners (A1–C2).

Your ONLY job in this task is sentence correction and explanation — NOT vocabulary extraction or CEFR-level formal versions (those come in a separate step).

Rules:
- Provide ONE informal version (friends, family, texts) — natural spoken/texting French
- suggestions.informal.english: a natural English translation of the informal French sentence (small, clear, not word-for-word if unnatural)
- For "understood": a clear natural English explanation confirming what the learner intended to say — include EVERY clause and reason they expressed
- When the learner clarifies in ENGLISH, suggestions.informal MUST express the COMPLETE intended meaning in natural French — every part (e.g. every "because" clause), not a shortened summary
- explanations.informal: 3–5 lines on conversational shortcuts, spoken French, texting conventions
- Do NOT return a changes array — changes are generated in a separate step
- Ratings are 0–100 integers for grammar and naturalness of the learner's French sentence ONLY
- If the learner clarified in ENGLISH (not French), set both grammar and naturalness ratings to 0
- If the learner clarified in French, rate that French clarification text
- Never say "that's just how French works" — explain the underlying rule or pattern
- Return ONLY valid JSON matching the schema

Tone: friendly, calm, encouraging — like a patient French friend, never judgmental.`;

const FORMAL_LEVELS_SYSTEM_PROMPT = `You generate polite/formal French versions of a message at SIX CEFR levels (A1, A2, B1, B2, C1, C2), calibrated to DELF/DALF production standards.

CORE PHILOSOPHY — this is essential:
CEFR and DELF measure what a learner at each level can NATURALLY produce — NOT "make every sentence increasingly sophisticated."
Your job is to express the SAME intended meaning using language appropriate for each level. Never add, remove, or shift communicative intent.

RULE 1 — Preserve meaning (never drop clauses):
Never invent new ideas AND never silently omit part of what the learner wanted to say.
If the intended message has multiple parts (e.g. "I have a brother but not a sister" AND "parents didn't want many children" AND "they didn't have much money at that time"), EVERY level must attempt ALL parts.
Do NOT drop a trailing reason clause at A1/A2 and only add it at B1 — that hides meaning from learners at lower levels.

RULE 1b — Cover the whole message at every level:
- Try your best to translate the FULL intended meaning at A1, A2, B1, B2, C1, and C2.
- At lower levels: use simpler words, shorter chained sentences, parce que / et, high-frequency vocabulary — but include every idea.
- A1: short sentences, present tense where possible; simple past time with "à ce moment" or "avant" if needed; parce que for reasons.
- A2: passé composé, parce que, slightly longer but still simple — full meaning should usually fit.
- If a specific grammar point is genuinely out of scope at a level, set coversFullMeaning: false and explain IN limitation exactly which part is simplified or deferred and why (plain English, name the missing clause).
- coversFullMeaning: true when every part of the intended meaning appears in the French (even if simplified wording).
- english must reflect what the French sentence actually says; if coversFullMeaning is false, limitation must explain the gap.

RULE 2 — Do not over-elaborate (never add ideas):
Do NOT add length, new clauses, or bureaucratic phrasing just because the level is higher. A C2 speaker sounds like a native, not like a lawyer.

RULE 3 — Level-appropriate upgrades (same meaning, more proficiency):
When moving from one level to the next, ask: does this diploma level enable a small, natural upgrade that shows more proficiency WITHOUT changing meaning?
Allowed upgrades: a more precise verb, richer but appropriate synonym, smoother grammar, natural collocation, or a tense/structure credited at that DELF/DALF level — ONLY when it fits the same message.
Example — "Je suis fatigué": A1/A2 may stay the same → B1 optional "Je suis très fatigué" → B2 "Je suis épuisé" (stronger word, same meaning) → C1/C2 may repeat B2 if nothing better fits.
Example — "Bonjour, ça va?": one simple A1 formal version may be identical through C2 when no upgrade adds value.

RULE 4 — noChangeNeeded flag (STRICT):
- noChangeNeeded: true ONLY when this level's sentence is IDENTICAL to the previous level's sentence (B1 vs A2, B2 vs B1, etc.) — nothing more to gain at this level.
- noChangeNeeded: false whenever the sentence differs from the previous level — even one word (verb, adjective, connector). If A2 and B1 use different verbs, B1 MUST have noChangeNeeded: false.
- A1 always has noChangeNeeded: false (it is the first formal recommendation).

WHEN TO SET noChangeNeeded: true:
- Sentence is word-for-word the same as the previous level AND no level-appropriate improvement exists

WHEN TO SET noChangeNeeded: false:
- Any word differs from the previous level's sentence
- This level introduces a level-appropriate vocabulary or grammar upgrade (same meaning)
- A1 (always)

DELF A1 — basic user:
- Very short phrases; present tense; high-frequency vocabulary; basic politeness (Bonjour, s'il vous plaît)
- Simple clauses only; no subjunctive or complex tenses

DELF A2 — elementary:
- Routine exchanges; passé composé; futur proche; simple linking (et, mais, parce que)
- Slightly longer but still simple syntax

DELF B1 — threshold:
- Imparfait/passé composé; opinions; relative pronouns qui/que; structured short text

DELF B2 — upper intermediate:
- Subjunctive in common triggers when the message warrants them; complex sentences only when needed
- Simple greetings and everyday phrases often repeat the A1/A2 version

DALF C1 — advanced:
- Stylistic precision only when the message warrants it — simple messages may repeat lower levels

DALF C2 — mastery:
- Near-native natural phrasing — NOT rhetorical over-elaboration
- Identical to a lower level is correct when the message is simple

FORMAL REGISTER:
- All versions stay polite/formal (teachers, professionals) — use vous where appropriate
- Formal does NOT mean verbose or bureaucratic unless the original message is already formal correspondence

CRITICAL RULES:
- Return exactly 6 entries — one per level: A1, A2, B1, B2, C1, C2
- IDENTICAL sentences across levels are ALLOWED and EXPECTED when the message is simple and already optimal
- Do NOT use grammar or vocabulary above the level being tested
- If the full meaning cannot fit a lower level even when simplified, set coversFullMeaning: false and explain clearly in limitation which clause is affected — do NOT omit without explanation

Each entry MUST include:
- level: exactly one of A1, A2, B1, B2, C1, C2
- sentence: the recommended polite French (may match a lower level when noChangeNeeded)
- english: natural English translation (concise, learner-friendly)
- noChangeNeeded: boolean — true ONLY when sentence is identical to the previous level; false when any word differs or this level adds a proficiency upgrade
- coversFullMeaning: boolean — true when the French includes every part of the intended meaning; false only when a part is simplified/deferred with explanation in limitation
- limitation: neutral scope note — if coversFullMeaning is false, name the specific clause or idea that is simplified and why at this diploma level
- explanation: 2–3 lines — if noChangeNeeded, explain why no change is educational (e.g. "Native speakers use this daily; advanced proficiency means knowing when not to over-complicate")

Do NOT return a changes array — changes are extracted in a separate step from your sentences.

Return ONLY valid JSON matching the schema.`;

const LEVEL_CHANGES_SYSTEM_PROMPT = `You build an accurate, aligned "what changed" breakdown across French sentence versions — and explain each fix in English like a warm native French speaker helping a new student.

INPUTS: learner's ORIGINAL text (may contain errors), informal correction, and six formal sentences (A1–C2) already written. Some formal levels may have noChangeNeeded: true (sentence already optimal).

METHOD — follow in order:
1. Compare the learner's ORIGINAL to the informal correction. Identify ONLY specific spans that were wrong, missing, unnatural, or misspelled — not parts the learner got right.
2. For each issue, create ONE change row tied to a single meaning slot (e.g. verb choice, gender agreement, politeness, word order, vocabulary).
3. youWrote MUST be an exact verbatim substring copied from the learner's ORIGINAL (same spelling, accents, punctuation as they wrote). If you cannot find it in the original, do not invent it.
4. informalFrench MUST be the replacement phrase at the same meaning slot — a contiguous substring of the informal sentence.
5. byLevel: for each level, the replacement at that same meaning slot — a contiguous substring copied from THAT level's formal sentence. When levels restructure grammar, pick the phrase in that sentence that carries the same idea (not the same word position).
6. If a level's formal sentence is identical to the previous level (noChangeNeeded: true), set byLevel[level] to "" for that meaning slot. If the sentence DIFFERS from the previous level (even one word), byLevel[level] MUST contain the differing phrase from that level's sentence — never empty.
7. Verify every non-empty byLevel and informalFrench value actually appears inside its target sentence before returning.

Each row fields:
- youWrote: verbatim from learner original (French)
- informalFrench: matching fix phrase from informal sentence (French)
- informalExplanation: 2–4 sentences IN ENGLISH — buddy tone, why this informal fix works
- byLevel: A1–C2 fix phrases (French) — use "" when no change is needed at that level
- explanationsByLevel: A1–C2, 2–4 sentences IN ENGLISH each — for empty byLevel, explain why no change is needed

QUALITY RULES:
- Prefer several precise rows over one vague row that dumps half the sentence
- Do NOT use the full corrected sentence as youWrote unless the entire original was unusable
- Do NOT use the full sentence as informalFrench/byLevel unless the entire clause was replaced
- If the sentence is already correct with only minor informal fixes and formal levels need no changes, return an empty changes array
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
              'Neutral scope note: use "Out of scope", "Limited to", "Focuses on", "Already natural" — not "cannot" or "unable"',
          },
          noChangeNeeded: {
            type: 'boolean',
            description:
              'True when this level needs no meaningful change — sentence may match a lower level',
          },
          coversFullMeaning: {
            type: 'boolean',
            description:
              'True when the French sentence includes every part of the intended meaning; false if a clause is simplified with explanation in limitation',
          },
          explanation: {
            type: 'string',
            description: '2–3 lines on DELF/DALF production criteria met and key grammar used',
          },
        },
        required: ['level', 'sentence', 'english', 'limitation', 'noChangeNeeded', 'coversFullMeaning', 'explanation'],
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
      prompt += `\n\nThe learner clarified their intended meaning in English:\n"${clarificationText}"\n\nUse this to interpret what they meant. The informal French correction MUST include every clause and reason — do not drop trailing "because" explanations.`;
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
  let prompt = `Generate six polite/formal French versions (A1 through C2) for this message.
Express the SAME full intended meaning at every level — include EVERY clause and reason (do not drop parts at lower levels).
Use simpler vocabulary and shorter sentences at A1/A2, but cover the whole message. Set coversFullMeaning: false only if a part truly cannot fit — then explain in limitation which clause is simplified.
At each level step, use more DELF-appropriate wording when it shows proficiency without changing meaning.
Set noChangeNeeded: true ONLY when the sentence is identical to the previous level.

Original learner message: "${sentence}"
Intended meaning (include ALL parts in every level): ${understood}
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
      '\n\nIMPORTANT: Your previous attempt exceeded diploma boundaries or changed the user\'s meaning. Preserve the SAME communicative intent at every level. Use noChangeNeeded: true when no improvement is needed. Do NOT invent elaborate formal phrasing for simple messages.';
  }

  return prompt;
}

function buildLevelChangesPrompt(originalSentence, informalSentence, byLevel, retry = false) {
  const levelLines = CEFR_LEVELS.map(
    (level) =>
      `${level}: "${byLevel[level].sentence}"${byLevel[level].noChangeNeeded ? ' (no change needed)' : ''}`,
  ).join('\n');

  let prompt = `Compare the learner's ORIGINAL against each corrected sentence below. Build precise change rows — one per specific error or fix, not whole-sentence dumps.

Learner's ORIGINAL (youWrote must be copied verbatim from here only):
"${originalSentence}"

Informal correction:
"${informalSentence}"

Formal sentences (byLevel phrases must be copied from the matching line only):
${levelLines}

For each specific issue: youWrote from original → informalFrench from informal → byLevel A1–C2 from each formal line (use "" when no change at that level). English buddy explanations for informal and each level. Return an empty changes array if the sentence is already correct.`;

  if (retry) {
    prompt +=
      '\n\nIMPORTANT: Previous attempt failed alignment checks. youWrote must appear verbatim in the learner ORIGINAL. informalFrench must appear in the informal sentence. Each non-empty byLevel value must appear in that level\'s formal sentence. Use "" for levels where no change is needed. Use smaller, precise spans — not whole sentences.';
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
      noChangeNeeded: Boolean(item.noChangeNeeded),
      coversFullMeaning: item.coversFullMeaning !== false,
    };
    explanationsByLevel[level] = item.explanation?.trim() || '';
  }

  normalizeNoChangeNeededFlags(byLevel);

  return { byLevel, explanationsByLevel };
}

function normalizeNoChangeNeededFlags(byLevel) {
  if (byLevel.A1) {
    byLevel.A1.noChangeNeeded = false;
  }

  for (let i = 1; i < CEFR_LEVELS.length; i += 1) {
    const level = CEFR_LEVELS[i];
    const prevLevel = CEFR_LEVELS[i - 1];
    if (!byLevel[level] || !byLevel[prevLevel]) continue;

    const currSentence = normalizeForMatch(byLevel[level].sentence);
    const prevSentence = normalizeForMatch(byLevel[prevLevel].sentence);

    byLevel[level].noChangeNeeded = currSentence === prevSentence;
  }
}

function hasCompleteByLevel(byLevel) {
  return CEFR_LEVELS.every((level) => byLevel[level]?.sentence?.trim());
}

function mapLevelStrings(source, { allowEmpty = false } = {}) {
  const mapped = {};
  for (const level of CEFR_LEVELS) {
    if (!(level in (source ?? {}))) continue;
    const trimmed = String(source[level] ?? '').trim();
    if (trimmed || allowEmpty) mapped[level] = trimmed;
  }
  return mapped;
}

function hasAllLevelKeys(source, { allowEmpty = false } = {}) {
  return CEFR_LEVELS.every((level) => {
    if (!(level in (source ?? {}))) return false;
    const trimmed = String(source[level] ?? '').trim();
    return allowEmpty || Boolean(trimmed);
  });
}

function allFormalSentencesIdentical(byLevel) {
  const baseline = normalizeForMatch(byLevel.A1?.sentence ?? '');
  if (!baseline) return false;
  return CEFR_LEVELS.every((level) => normalizeForMatch(byLevel[level]?.sentence ?? '') === baseline);
}

function mapFormalLevelsChanges(changes) {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => {
      const byLevel = mapLevelStrings(change?.byLevel, { allowEmpty: true });
      const explanationsByLevel = mapLevelStrings(change?.explanationsByLevel, { allowEmpty: true });

      if (!change?.youWrote?.trim() || !change?.informalFrench?.trim()) return null;
      if (!hasAllLevelKeys(byLevel, { allowEmpty: true })) return null;

      return {
        youWrote: change.youWrote.trim(),
        informalFrench: change.informalFrench.trim(),
        informalExplanation: change.informalExplanation?.trim() || undefined,
        byLevel,
        explanationsByLevel:
          hasAllLevelKeys(explanationsByLevel, { allowEmpty: true }) ? explanationsByLevel : undefined,
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

function changesArePersonalized(changes, byLevel, informalSentence, originalSentence) {
  if (!changes.length) {
    return allFormalSentencesIdentical(byLevel);
  }

  for (const change of changes) {
    if (!phraseAppearsInSentence(change.youWrote, originalSentence)) {
      return false;
    }
    if (!phraseAppearsInSentence(change.informalFrench, informalSentence)) {
      return false;
    }

    for (const level of CEFR_LEVELS) {
      const phrase = change.byLevel[level];
      if (!phrase?.trim()) continue;
      if (!phraseAppearsInSentence(phrase, byLevel[level].sentence)) {
        return false;
      }
    }
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
      'Keys: levels (array of 6: {level, sentence, english, limitation, noChangeNeeded, coversFullMeaning, explanation}). Include full intended meaning at every level.',
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

  if (!hasCompleteByLevel(byLevel)) {
    console.warn('Formal levels were incomplete — retrying once.');
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
