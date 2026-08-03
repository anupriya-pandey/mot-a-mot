const FRENCH_LANG = 'fr-FR';

export function isFrenchSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function getVoices(): SpeechSynthesisVoice[] {
  if (!isFrenchSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function pickFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang === 'fr-FR' && /google|microsoft|premium|enhanced/i.test(v.name)) ||
    voices.find((v) => v.lang === 'fr-FR') ||
    voices.find((v) => v.lang.startsWith('fr'))
  );
}

export function speakFrench(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!isFrenchSpeechSupported() || !text.trim()) return;

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

export function stopFrenchSpeech(): void {
  if (isFrenchSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
