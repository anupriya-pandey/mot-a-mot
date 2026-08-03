import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured } from './analyzeService.js';
import { isInvalidItem, normalizePartOfSpeechLabel } from './vocabularySanitizer.js';

const IMPORT_SYSTEM_PROMPT = `You are a French linguistics assistant helping learners build a personal French Toolbox from pasted notes.

Extract every meaningful French vocabulary entry from the pasted text — including:
- Single words (être, bonjour, aujourd'hui)
- Multi-word expressions (avoir besoin de, être en train de)
- Connectors and function words when they appear as vocabulary items
- Complete sentences ONLY as example sentences attached to entries — do not create one entry per full sentence unless it is a fixed expression or idiom

Rules:
- Use dictionary lemma form for single words (infinitive for verbs, masculine singular for adjectives)
- Keep multi-word expressions as one lemma (e.g. "avoir besoin de", "être en train de")
- partOfSpeech must be one of: Noun, Verb, Adjective, Adverb, Pronoun, Article / Determiner, Preposition, Conjunction, Expression, Negation Particle, Reflexive Pronoun
- meaning: concise English meaning
- surface: form as it appeared in the pasted text, or lemma if not found
- example: a short French example sentence using the entry (from the pasted text when possible, otherwise invent a simple one)
- examples: additional example sentences when available (especially common expressions, collocations)
- When the SAME French word has MULTIPLE valid meanings or parts of speech (e.g. entre = verb "to enter" AND preposition "between"; livre = noun "book" AND noun "pound"), return SEPARATE entries — do NOT merge them
- "ne" and "pas" are separate entries. Never combine negation with a verb
- Skip pure English text, headers without French content, and duplicate exact entries
- Return ONLY valid JSON matching the schema`;

const IMPORT_SCHEMA = {
  type: 'object',
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lemma: { type: 'string' },
          surface: { type: 'string' },
          meaning: { type: 'string' },
          partOfSpeech: { type: 'string' },
          example: { type: 'string' },
          examples: { type: 'array', items: { type: 'string' } },
          surfaces: { type: 'array', items: { type: 'string' } },
        },
        required: ['lemma', 'surface', 'meaning', 'partOfSpeech', 'example'],
      },
    },
  },
  required: ['entries'],
};

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function normalizeImportEntries(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const results = [];
  const seen = new Set();

  for (const item of rawItems) {
    if (isInvalidItem(item)) continue;

    const partOfSpeech = normalizePartOfSpeechLabel(item.partOfSpeech);
    if (!partOfSpeech) continue;

    const lemma = String(item.lemma ?? '').trim();
    const meaning = String(item.meaning ?? '').trim();
    if (!lemma || !meaning) continue;

    const dedupeKey = `${lemma.toLowerCase()}|${partOfSpeech}|${meaning.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const surface = String(item.surface ?? lemma).trim() || lemma;
    const example = String(item.example ?? '').trim();
    const examples = uniqueStrings([...(Array.isArray(item.examples) ? item.examples : []), example]);
    const surfaces = uniqueStrings([
      ...(Array.isArray(item.surfaces) ? item.surfaces : []),
      surface,
      lemma,
    ]);

    results.push({
      lemma,
      surface,
      meaning,
      partOfSpeech,
      example: examples[0] ?? '',
      examples,
      surfaces,
    });
  }

  return results.sort((a, b) => a.lemma.localeCompare(b.lemma, 'fr'));
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

export async function importToolboxText(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';

  if (!trimmed) {
    return { status: 400, body: { message: 'Please paste some French text to import.' } };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();

  try {
    const result = await generateStructured(config, {
      systemPrompt: IMPORT_SYSTEM_PROMPT,
      userPrompt: `Extract French toolbox entries from this pasted text:\n\n${trimmed}`,
      schema: IMPORT_SCHEMA,
      schemaName: 'toolbox_import',
      ollamaSchemaHint:
        'Keys: entries (array of {lemma, surface, meaning, partOfSpeech, example, examples?, surfaces?}).',
      temperature: 0.2,
    });

    const entries = normalizeImportEntries(result?.entries);

    return {
      status: 200,
      body: { entries },
    };
  } catch (error) {
    console.error('Import toolbox failed:', error);
    return {
      status: 500,
      body: { message: "We couldn't analyze your import right now. Please try again." },
    };
  }
}
