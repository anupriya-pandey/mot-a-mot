import { playTtsAudio, stopTtsAudio } from './ttsAudio';

const FRENCH_LANG = 'fr-FR';

export function isFrenchSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof Audio !== 'undefined' || 'speechSynthesis' in window;
}

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function pickFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang === 'fr-FR' && /google|microsoft|premium|enhanced/i.test(v.name)) ||
    voices.find((v) => v.lang === 'fr-FR') ||
    voices.find((v) => v.lang.startsWith('fr'))
  );
}

function speakFrenchWithBrowser(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = FRENCH_LANG;
  utterance.rate = 0.92;

  const assignVoice = () => {
    const voice = pickFrenchVoice(getVoices());
    if (voice) utterance.voice = voice;
  };

  assignVoice();
  if (getVoices().length === 0) {
    const handleVoicesChanged = () => {
      assignVoice();
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function speakFrench(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!text.trim()) return;

  void playTtsAudio(text, 'fr', onStart, onEnd).then((played) => {
    if (!played) {
      speakFrenchWithBrowser(text, onStart, onEnd);
    }
  });
}

export function stopFrenchSpeech(): void {
  stopTtsAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
