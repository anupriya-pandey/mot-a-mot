import { pickFrenchVoice } from './frenchSpeech';

export type NarrationSegment =
  | { kind: 'en'; text: string }
  | { kind: 'fr'; text: string }
  | { kind: 'brand' };

let narrationGeneration = 0;
let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices && cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  if (voicesReadyPromise) {
    return voicesReadyPromise;
  }

  voicesReadyPromise = new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const resolveVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        cachedVoices = voices;
        resolve(voices);
        return true;
      }
      return false;
    };

    if (resolveVoices()) return;

    const handleChange = () => {
      if (resolveVoices()) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleChange);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleChange);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleChange);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 120);
  });

  return voicesReadyPromise;
}

export function preloadDemoNarration(): Promise<void> {
  return waitForVoices().then(() => undefined);
}

function pickFriendlyEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const ranked = voices
    .filter((voice) => voice.lang.startsWith('en'))
    .sort((a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a));

  return ranked[0] || voices.find((voice) => voice.lang.startsWith('en'));
}

function pickNarratorVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    pickFriendlyEnglishVoice(voices) ||
    pickFrenchVoice(voices) ||
    voices.find((voice) => voice.lang.startsWith('en'))
  );
}

function scoreEnglishVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();

  if (/samantha|karen|moira|tessa|fiona|veena|zira|jenny|aria|susan|victoria|google.*english.*female|microsoft.*zira|microsoft.*jenny|natural|enhanced|premium|neural|expressive|friendly|warm/i.test(name)) {
    score += 40;
  }
  if (/female|woman/i.test(name)) score += 12;
  if (/enhanced|premium|natural|neural|expressive|hd|wavenet|multilingual|bilingual/i.test(name)) score += 20;
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

const NARRATOR_RATE = 1.2;
const NARRATOR_PITCH = 1.24;

function buildUtterance(
  segment: NarrationSegment,
  narratorVoice?: SpeechSynthesisVoice,
): SpeechSynthesisUtterance | null {
  let text = '';
  let lang = 'en-US';

  if (segment.kind === 'brand') {
    text = 'Mot à mot';
    lang = 'fr-FR';
  } else if (segment.kind === 'fr') {
    text = segment.text.trim();
    lang = 'fr-FR';
  } else {
    text = segment.text.trim();
    lang = 'en-US';
  }

  if (!text) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = NARRATOR_RATE;
  utterance.pitch = NARRATOR_PITCH;
  utterance.volume = 1;
  if (narratorVoice) utterance.voice = narratorVoice;
  return utterance;
}

export async function speakDemoNarration(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return;

  const generation = narrationGeneration;
  const voices = await waitForVoices();
  if (generation !== narrationGeneration) return;

  const narratorVoice = pickNarratorVoice(voices);
  const utterances = parseDemoNarration(text)
    .map((segment) => buildUtterance(segment, narratorVoice))
    .filter((utterance): utterance is SpeechSynthesisUtterance => utterance !== null);

  if (utterances.length === 0) return;

  window.speechSynthesis.cancel();

  await new Promise<void>((resolve) => {
    if (utterances.length === 0) {
      resolve();
      return;
    }

    utterances.forEach((utterance, index) => {
      if (index === utterances.length - 1) {
        utterance.onend = () => {
          if (generation === narrationGeneration) resolve();
        };
        utterance.onerror = () => resolve();
      }
      window.speechSynthesis.speak(utterance);
    });

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  });
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
