import { pickFrenchVoice } from './frenchSpeech';

export type NarrationSegment =
  | { kind: 'en'; text: string }
  | { kind: 'fr'; text: string }
  | { kind: 'brand' };

let narrationGeneration = 0;

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const handleChange = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleChange);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleChange);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleChange);
      resolve(window.speechSynthesis.getVoices());
    }, 250);
  });
}

function pickFriendlyEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const ranked = voices
    .filter((voice) => voice.lang.startsWith('en'))
    .sort((a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a));

  return ranked[0] || voices.find((voice) => voice.lang.startsWith('en'));
}

function scoreEnglishVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();

  if (/samantha|karen|moira|tessa|fiona|veena|zira|jenny|aria|susan|victoria|google.*english.*female|microsoft.*zira|microsoft.*jenny|natural|enhanced|premium|neural|expressive|friendly|warm/i.test(name)) {
    score += 40;
  }
  if (/female|woman/i.test(name)) score += 12;
  if (/enhanced|premium|natural|neural|expressive|hd|wavenet/i.test(name)) score += 20;
  if (voice.lang === 'en-US') score += 8;
  if (voice.default) score += 4;
  if (/compact|low quality|espeak|robot|fred|bad/i.test(name)) score -= 30;

  return score;
}

function normalizeNarrationInput(text: string): string {
  return text
    .replace(/Mot-à-Mot/gi, '\u0000BRAND\u0000')
    .replace(/Mot à Mot/gi, '\u0000BRAND\u0000')
    .replace(/Mo ah mo/gi, '\u0000BRAND\u0000')
    .replace(/Mo-Ah-Mo/gi, '\u0000BRAND\u0000')
    .replace(/Mohahmoh/gi, '\u0000BRAND\u0000')
    .replace(/moamo/gi, '\u0000BRAND\u0000')
    .replace(/«([^»]+)»/g, (_, french: string) => `\u0000FR:${french.trim()}\u0000`)
    .replace(/\{\{fr:([^}]+)\}\}/g, (_, french: string) => `\u0000FR:${french.trim()}\u0000`)
    .replace(/\bN A\b/g, 'N/A');
}

export function parseDemoNarration(text: string): NarrationSegment[] {
  const normalized = normalizeNarrationInput(text);
  const segments: NarrationSegment[] = [];
  const pattern = /(\u0000BRAND\u0000|\u0000FR:[\s\S]*?\u0000)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    const before = normalized.slice(lastIndex, match.index);
    if (before.trim()) segments.push({ kind: 'en', text: before });

    if (match[0] === '\u0000BRAND\u0000') {
      segments.push({ kind: 'brand' });
    } else {
      const french = match[0].replace(/^\u0000FR:/, '').replace(/\u0000$/, '').trim();
      if (french) segments.push({ kind: 'fr', text: french });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = normalized.slice(lastIndex);
  if (tail.trim()) segments.push({ kind: 'en', text: tail });

  return segments.length > 0 ? segments : [{ kind: 'en', text }];
}

function speakUtterance(
  text: string,
  options: {
    lang: string;
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
  },
  generation: number,
): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text.trim() || generation !== narrationGeneration) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = options.lang;
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.12;
    utterance.volume = 1;
    if (options.voice) utterance.voice = options.voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function buildSegmentSpeech(
  segment: NarrationSegment,
  englishVoice?: SpeechSynthesisVoice,
  frenchVoice?: SpeechSynthesisVoice,
): { text: string; lang: string; voice?: SpeechSynthesisVoice; rate: number; pitch: number } | null {
  if (segment.kind === 'brand') {
    return {
      text: 'moamo',
      lang: 'en-US',
      voice: englishVoice,
      rate: 0.96,
      pitch: 1.18,
    };
  }

  if (segment.kind === 'fr') {
    return {
      text: segment.text.trim(),
      lang: 'fr-FR',
      voice: frenchVoice,
      rate: 1.04,
      pitch: 1.08,
    };
  }

  return {
    text: segment.text.trim(),
    lang: 'en-US',
    voice: englishVoice,
    rate: 1.18,
    pitch: 1.28,
  };
}

export async function speakDemoNarration(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return;

  const generation = narrationGeneration;
  window.speechSynthesis.cancel();

  const voices = await waitForVoices();
  if (generation !== narrationGeneration) return;

  const englishVoice = pickFriendlyEnglishVoice(voices);
  const frenchVoice = pickFrenchVoice(voices);
  const segments = parseDemoNarration(text);

  for (const segment of segments) {
    if (generation !== narrationGeneration) return;

    const speech = buildSegmentSpeech(segment, englishVoice, frenchVoice);
    if (!speech || !speech.text) continue;

    await speakUtterance(
      speech.text,
      {
        lang: speech.lang,
        voice: speech.voice,
        rate: speech.rate,
        pitch: speech.pitch,
      },
      generation,
    );
  }
}

export function stopDemoNarration(): void {
  narrationGeneration += 1;
  window.speechSynthesis?.cancel();
}

export function formatNarrationForDisplay(text: string): string {
  return text
    .replace(/«([^»]+)»/g, '$1')
    .replace(/\{\{fr:([^}]+)\}\}/g, '$1');
}
