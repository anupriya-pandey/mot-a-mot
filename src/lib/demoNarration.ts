import { pickFrenchVoice } from './frenchSpeech';

export type NarrationSegment =
  | { kind: 'en'; text: string }
  | { kind: 'fr'; text: string }
  | { kind: 'brand' };

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
  return (
    voices.find(
      (voice) =>
        voice.lang.startsWith('en') &&
        /samantha|google.*english.*female|zira|jenny|aria|enhanced|premium|natural|female/i.test(
          voice.name,
        ),
    ) ||
    voices.find((voice) => voice.lang === 'en-US') ||
    voices.find((voice) => voice.lang.startsWith('en'))
  );
}

function normalizeNarrationInput(text: string): string {
  return text
    .replace(/Mot-à-Mot/gi, '\u0000BRAND\u0000')
    .replace(/Mot à Mot/gi, '\u0000BRAND\u0000')
    .replace(/Mo ah mo/gi, '\u0000BRAND\u0000')
    .replace(/Mo-Ah-Mo/gi, '\u0000BRAND\u0000')
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
    const before = normalized.slice(lastIndex, match.index).trim();
    if (before) segments.push({ kind: 'en', text: before });

    if (match[0] === '\u0000BRAND\u0000') {
      segments.push({ kind: 'brand' });
    } else {
      const french = match[0].replace(/^\u0000FR:/, '').replace(/\u0000$/, '').trim();
      if (french) segments.push({ kind: 'fr', text: french });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = normalized.slice(lastIndex).trim();
  if (tail) segments.push({ kind: 'en', text: tail });

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
): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text.trim()) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = options.lang;
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.12;
    if (options.voice) utterance.voice = options.voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function speakBrandName(englishVoice?: SpeechSynthesisVoice): Promise<void> {
  const syllables = [
    { text: 'Mo', rate: 0.95, pitch: 1.2 },
    { text: 'Ah', rate: 0.88, pitch: 1.22 },
    { text: 'Mo', rate: 0.95, pitch: 1.2 },
  ];

  for (const syllable of syllables) {
    await speakUtterance(syllable.text, {
      lang: 'en-US',
      voice: englishVoice,
      rate: syllable.rate,
      pitch: syllable.pitch,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 90));
  }
}

export async function speakDemoNarration(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const voices = await waitForVoices();
  const englishVoice = pickFriendlyEnglishVoice(voices);
  const frenchVoice = pickFrenchVoice(voices);
  const segments = parseDemoNarration(text);

  for (const segment of segments) {
    if (segment.kind === 'brand') {
      await speakBrandName(englishVoice);
      continue;
    }

    if (segment.kind === 'fr') {
      await speakUtterance(segment.text, {
        lang: 'fr-FR',
        voice: frenchVoice,
        rate: 0.9,
        pitch: 1.05,
      });
      continue;
    }

    await speakUtterance(segment.text, {
      lang: 'en-US',
      voice: englishVoice,
      rate: 1.1,
      pitch: 1.16,
    });
  }
}

export function stopDemoNarration(): void {
  window.speechSynthesis?.cancel();
}

export function formatNarrationForDisplay(text: string): string {
  return text
    .replace(/«([^»]+)»/g, '$1')
    .replace(/\{\{fr:([^}]+)\}\}/g, '$1');
}
