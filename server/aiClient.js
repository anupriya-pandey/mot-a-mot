import OpenAI from 'openai';

function isVercel() {
  return Boolean(process.env.VERCEL);
}

function geminiErrorMessage(error) {
  return String(error?.message ?? '').toLowerCase();
}

export function isGeminiHighDemand(error) {
  const message = geminiErrorMessage(error);
  return (
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily unavailable') ||
    error?.status === 503
  );
}

function isGeminiRetryableError(error) {
  const message = geminiErrorMessage(error);
  return (
    error?.status === 429 ||
    error?.status === 503 ||
    error?.status === 404 ||
    error?.status === 500 ||
    message.includes('quota') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily unavailable') ||
    message.includes('resource exhausted') ||
    message.includes('not found') ||
    message.includes('not supported') ||
    message.includes('no longer available') ||
    error?.isNetworkError
  );
}

export function getRuntimeConfig() {
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

  const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
  const geminiFallbackModels = [
    geminiModel,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
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

function isValidKey(key) {
  return Boolean(key?.trim() && !/^your_.*_here$/i.test(key.trim()));
}

async function generateWithOpenAI(config, systemPrompt, userPrompt, schema, schemaName, temperature = 0.4) {
  const completion = await config.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict: true,
        schema: { ...schema, additionalProperties: false },
      },
    },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return JSON.parse(content);
}

async function generateWithGeminiModel(config, systemPrompt, userPrompt, schema, model, temperature = 0.3, attempt = 1) {
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
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
            responseSchema: schema,
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
      if (isGeminiHighDemand(error) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        return generateWithGeminiModel(config, systemPrompt, userPrompt, schema, model, temperature, attempt + 1);
      }
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
      return generateWithGeminiModel(config, systemPrompt, userPrompt, schema, model, temperature, attempt + 1);
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

async function generateWithGemini(config, systemPrompt, userPrompt, schema, temperature = 0.3) {
  let lastError;

  for (const model of config.geminiFallbackModels) {
    try {
      return await generateWithGeminiModel(config, systemPrompt, userPrompt, schema, model, temperature);
    } catch (error) {
      lastError = error;
      if (!isGeminiRetryableError(error)) throw error;
      console.warn(`Gemini model ${model} unavailable:`, error.message);
    }
  }

  throw lastError ?? new Error('All Gemini models unavailable');
}

async function generateWithOllama(config, systemPrompt, userPrompt, schemaHint) {
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
          content: `${systemPrompt}\n\nReturn valid JSON only. ${schemaHint}`,
        },
        { role: 'user', content: userPrompt },
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

export async function generateStructured(
  config,
  { systemPrompt, userPrompt, schema, schemaName, ollamaSchemaHint, temperature },
) {
  if (config.configuredProvider === 'gemini') {
    return generateWithGemini(config, systemPrompt, userPrompt, schema, temperature);
  }
  if (config.configuredProvider === 'ollama') {
    return generateWithOllama(config, systemPrompt, userPrompt, ollamaSchemaHint);
  }
  return generateWithOpenAI(config, systemPrompt, userPrompt, schema, schemaName, temperature);
}

export { isVercel };
