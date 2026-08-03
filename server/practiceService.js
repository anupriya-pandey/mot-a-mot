import { generateStructured, getRuntimeConfig, isVercel } from './aiClient.js';
import { isConfigured } from './analyzeService.js';

const PRACTICE_SYSTEM_PROMPT = `You are Mot-à-Mot's Practice Lab — a calm French practice buddy that creates production exercises from a learner's personal toolbox.

PHILOSOPHY:
- Encourage PRODUCTION, not memory testing. Never ask "What does X mean?" — always ask the learner to WRITE or BUILD using their words.
- Every word in every prompt MUST come from the learner's toolbox list provided.
- Mix words from different categories (verbs, nouns, adjectives, expressions, connectors, etc.) into natural prompts.
- Adaptive difficulty based on toolbox size:
  - Under 20 entries: 2–3 words per prompt, simple "Build a sentence using…"
  - 20–99 entries: 3–4 words, slightly varied structures
  - 100+ entries: richer prompts like "Describe your morning using…" or "Tell a short story with…" — still using only toolbox words
- Increase difficulty slightly from prompt 1 → 5 within the same session (more words or slightly richer task, never overwhelming).
- Prompt 1: simplest. Prompt 5: most ambitious (but still fair for their toolbox size).
- Use English for instructions — the learner responds in French.
- targetWords: array of French lemmas/forms from the toolbox to include in the prompt (exact strings from input).
- title: short label like "Build a sentence" or "Describe your morning"
- instruction: clear English instruction for the learner

Return exactly 5 prompts, indexed 1–5.
Return ONLY valid JSON matching the schema.`;

const PRACTICE_SCHEMA = {
  type: 'object',
  properties: {
    estimatedMinutes: { type: 'string', description: 'e.g. "4–5"' },
    prompts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          title: { type: 'string' },
          instruction: { type: 'string' },
          targetWords: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['index', 'title', 'instruction', 'targetWords'],
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

function buildPracticePrompt(toolboxEntries) {
  const grouped = groupToolboxByCategory(toolboxEntries);
  const totalEntries = toolboxEntries.length;

  const lines = Object.entries(grouped)
    .map(([category, items]) => {
      const wordList = items.map((item) => `${item.lemma} (${item.meaning})`).join(', ');
      return `${category}: ${wordList}`;
    })
    .join('\n');

  return `Toolbox size: ${totalEntries} entries

${lines}

Generate today's 5-question practice session using ONLY words from this toolbox.`;
}

function normalizePrompts(rawPrompts) {
  if (!Array.isArray(rawPrompts)) return [];

  return rawPrompts
    .map((prompt, index) => ({
      index: typeof prompt.index === 'number' ? prompt.index : index + 1,
      title: String(prompt.title ?? 'Build a sentence').trim(),
      instruction: String(prompt.instruction ?? 'Use these words:').trim(),
      targetWords: (Array.isArray(prompt.targetWords) ? prompt.targetWords : [])
        .map((word) => String(word).trim())
        .filter(Boolean),
    }))
    .filter((prompt) => prompt.targetWords.length > 0)
    .slice(0, 5);
}

export async function generatePracticeSession(toolboxEntries) {
  const entries = Array.isArray(toolboxEntries) ? toolboxEntries : [];

  if (entries.length < 3) {
    return {
      status: 400,
      body: {
        message:
          'Add at least 3 entries to your French Toolbox before starting practice.',
      },
    };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();

  try {
    const result = await generateStructured(config, {
      systemPrompt: PRACTICE_SYSTEM_PROMPT,
      userPrompt: buildPracticePrompt(entries),
      schema: PRACTICE_SCHEMA,
      schemaName: 'practice_session',
      ollamaSchemaHint:
        'Keys: estimatedMinutes (string), prompts (array of 5: {index, title, instruction, targetWords}).',
      temperature: 0.4,
    });

    const prompts = normalizePrompts(result?.prompts);

    if (prompts.length < 5) {
      return {
        status: 500,
        body: { message: "We couldn't build a full practice session. Please try again." },
      };
    }

    return {
      status: 200,
      body: {
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
