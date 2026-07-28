import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are Mot-à-Mot, an AI messaging assistant for beginner French learners (A1–B1).

Your job: help users verify, improve, and confidently send everyday French messages before they press Send.

Rules:
- Prioritize natural conversational French over literal translations
- Explain mistakes in simple, beginner-friendly language (avoid heavy grammar jargon)
- Every correction must include a brief "why" with real reasoning
- grammarNotes: 3–5 short lines. Teach the underlying rule or pattern behind the changes — explain WHY French works this way, with a concrete example if helpful. Never say things like "because it's always done this way" or "that's just how French is." Give fundamentals a beginner can reuse.
- If the sentence is already natural and correct, say so with minimal changes
- Ratings are 0–100 integers for grammar and naturalness of the ORIGINAL user sentence
- For "understood": literal, word-for-word English of exactly what they wrote — faithful to their wording, not a paraphrase
- For "everydayMeaning": how French speakers actually use this in real conversation — the practical meaning or social function (e.g. "Ça va?" literally "It goes?" but used to ask "How are you?")
- Return ONLY valid JSON matching the schema

Tone: friendly, calm, encouraging — like a patient French friend, never judgmental.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    understood: {
      type: 'string',
      description: 'Literal word-for-word English translation of the user sentence',
    },
    everydayMeaning: {
      type: 'string',
      description:
        'How this phrase is used in everyday conversational French — practical meaning, not literal translation',
    },
    correctedSentence: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          youWrote: { type: 'string' },
          betterFrench: { type: 'string' },
          why: {
            type: 'string',
            description: 'Clear reason for this change — explain the rule or pattern, not just that it sounds better',
          },
        },
        required: ['youWrote', 'betterFrench', 'why'],
      },
    },
    grammarNotes: {
      type: 'string',
      description:
        'Educational explanation of the grammar or usage pattern behind the changes — 3–5 lines, teach the underlying rule with clear rationale',
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
  required: ['understood', 'everydayMeaning', 'correctedSentence', 'changes', 'grammarNotes', 'ratings'],
};

function isValidKey(key) {
  return Boolean(key?.trim() && !/^your_.*_here$/i.test(key.trim()));
}

function isVercel() {
  return Boolean(process.env.VERCEL);
}

function getRuntimeConfig() {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const hasOpenAiKey = isValidKey(openaiKey);
  const hasGeminiKey = isValidKey(geminiKey);

  let configuredProvider =
    process.env.AI_PROVIDER?.trim().toLowerCase() ??
    (hasGeminiKey ? 'gemini' : hasOpenAiKey ? 'openai' : null);

  if (configuredProvider === 'ollama' && isVercel()) {
    configuredProvider = hasGeminiKey ? 'gemini' : hasOpenAiKey ? 'openai' : null;
  }

  const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';
  const geminiFallbackModels = [
    geminiModel,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
  ].filter((model, index, models) => models.indexOf(model) === index);

  return {
    configuredProvider,
    hasOpenAiKey,
    hasGeminiKey,
    openaiKey,
    geminiKey,
    openai: hasOpenAiKey ? new OpenAI({ apiKey: openaiKey }) : null,
    geminiFallbackModels,
    ollamaModel: process.env.OLLAMA_MODEL?.trim() || 'llama3.2',
    ollamaUrl: process.env.OLLAMA_URL?.trim() || 'http://127.0.0.1:11434',
  };
}

export function getHealthStatus() {
  const { configuredProvider } = getRuntimeConfig();
  return {
    ok: true,
    provider: configuredProvider,
    configured: isConfigured(),
  };
}

export function isConfigured() {
  const { configuredProvider, hasGeminiKey, hasOpenAiKey } = getRuntimeConfig();
  if (configuredProvider === 'ollama') return !isVercel();
  if (configuredProvider === 'gemini') return hasGeminiKey;
  if (configuredProvider === 'openai') return hasOpenAiKey;
  return false;
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

  if (String(error?.message).includes('no longer available')) {
    return 'This Gemini model is unavailable on your account. Try again or set GEMINI_MODEL=gemini-3.5-flash.';
  }

  return error?.message ?? "We couldn't check your sentence right now. Please try again.";
}

async function analyzeWithOpenAI(sentence, config) {
  const completion = await config.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'french_analysis',
        strict: true,
        schema: { ...RESPONSE_SCHEMA, additionalProperties: false },
      },
    },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this French message and return structured feedback:\n\n"${sentence}"`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return JSON.parse(content);
}

async function analyzeWithGeminiModel(sentence, model, config, attempt = 1) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.geminiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                {
                  text: `Analyze this French message and return structured feedback:\n\n"${sentence}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message ?? 'Gemini request failed';
      const error = new Error(message);
      error.status = response.status;
      error.provider = 'gemini';
      error.model = model;
      throw error;
    }

    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty AI response');
    return JSON.parse(content);
  } catch (error) {
    const isNetworkError =
      error?.cause?.code === 'ECONNRESET' ||
      error?.cause?.code === 'ETIMEDOUT' ||
      String(error?.message).includes('fetch failed');

    if (isNetworkError && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      return analyzeWithGeminiModel(sentence, model, config, attempt + 1);
    }

    if (isNetworkError) {
      const networkError = new Error('Could not reach Gemini. Check your internet and try again.');
      networkError.provider = 'gemini';
      networkError.isNetworkError = true;
      throw networkError;
    }

    throw error;
  }
}

async function analyzeWithGemini(sentence, config) {
  let lastError;

  for (const model of config.geminiFallbackModels) {
    try {
      return await analyzeWithGeminiModel(sentence, model, config);
    } catch (error) {
      lastError = error;
      const message = String(error.message ?? '');
      const isRetryable =
        error?.status === 429 ||
        error?.status === 404 ||
        message.includes('quota') ||
        message.includes('not found') ||
        message.includes('not supported') ||
        message.includes('no longer available') ||
        error?.isNetworkError;

      if (!isRetryable) throw error;
      console.warn(`Gemini model ${model} unavailable:`, message);
    }
  }

  throw lastError ?? new Error('All Gemini models unavailable');
}

async function analyzeWithOllama(sentence, config) {
  const response = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nReturn JSON with keys: understood, everydayMeaning, correctedSentence, changes (array of {youWrote, betterFrench, why}), grammarNotes, ratings ({grammar, naturalness}).`,
        },
        {
          role: 'user',
          content: `Analyze this French message and return structured feedback:\n\n"${sentence}"`,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error ?? 'Ollama request failed';
    const error = new Error(message);
    error.status = response.status;
    error.provider = 'ollama';
    throw error;
  }

  const content = payload.message?.content;
  if (!content) throw new Error('Empty AI response');
  return JSON.parse(content);
}

export async function analyzeSentence(sentence) {
  const trimmed = typeof sentence === 'string' ? sentence.trim() : '';

  if (!trimmed) {
    return { status: 400, body: { message: 'Please enter a French sentence.' } };
  }

  if (!isConfigured()) {
    return { status: 500, body: { message: configurationMessage() } };
  }

  const config = getRuntimeConfig();

  try {
    let parsed;
    if (config.configuredProvider === 'gemini') parsed = await analyzeWithGemini(trimmed, config);
    else if (config.configuredProvider === 'ollama') parsed = await analyzeWithOllama(trimmed, config);
    else parsed = await analyzeWithOpenAI(trimmed, config);

    return { status: 200, body: parsed };
  } catch (error) {
    console.error('Analysis error:', error);
    return { status: 500, body: { message: mapAnalysisError(error) } };
  }
}
