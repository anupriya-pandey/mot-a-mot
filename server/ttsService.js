import { getRuntimeConfig } from './aiClient.js';

const TTS_MODEL = process.env.TTS_MODEL?.trim() || 'tts-1';
const TTS_VOICE_FR = process.env.TTS_VOICE_FR?.trim() || 'nova';
const TTS_VOICE_EN = process.env.TTS_VOICE_EN?.trim() || 'shimmer';

const MAX_TEXT_LENGTH = 500;

function normalizeLang(lang) {
  const value = String(lang ?? 'fr').trim().toLowerCase();
  return value === 'en' || value.startsWith('en-') ? 'en' : 'fr';
}

function voiceForLang(lang) {
  return lang === 'en' ? TTS_VOICE_EN : TTS_VOICE_FR;
}

export function isTtsConfigured() {
  const { hasOpenAiKey } = getRuntimeConfig();
  return hasOpenAiKey;
}

export function getTtsStatus() {
  return {
    configured: isTtsConfigured(),
    provider: 'openai',
    model: TTS_MODEL,
    voices: {
      fr: TTS_VOICE_FR,
      en: TTS_VOICE_EN,
    },
  };
}

export async function synthesizeSpeech({ text, lang = 'fr' }) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    return {
      status: 400,
      body: { message: 'Text is required.' },
    };
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      status: 400,
      body: { message: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.` },
    };
  }

  const { openai, hasOpenAiKey } = getRuntimeConfig();
  if (!hasOpenAiKey || !openai) {
    return {
      status: 503,
      body: {
        message: 'Speech is not configured on the server yet.',
      },
    };
  }

  const normalizedLang = normalizeLang(lang);

  try {
    const response = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voiceForLang(normalizedLang),
      input: trimmed,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      status: 200,
      buffer,
      contentType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('TTS synthesis failed:', error);
    return {
      status: 500,
      body: {
        message: "We couldn't generate speech right now. Please try again.",
      },
    };
  }
}
