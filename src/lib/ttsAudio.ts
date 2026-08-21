export type TtsLang = 'fr' | 'en';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let playbackGeneration = 0;

function cleanupPlayback(objectUrl: string | null) {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
  if (currentObjectUrl === objectUrl) {
    currentObjectUrl = null;
    currentAudio = null;
  }
}

export function stopTtsAudio(): void {
  playbackGeneration += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export async function playTtsAudio(
  text: string,
  lang: TtsLang,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed || typeof Audio === 'undefined') {
    onEnd?.();
    return false;
  }

  stopTtsAudio();
  const generation = playbackGeneration;

  try {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, lang }),
    });

    if (generation !== playbackGeneration) {
      onEnd?.();
      return false;
    }

    if (!response.ok) {
      onEnd?.();
      return false;
    }

    const blob = await response.blob();
    if (generation !== playbackGeneration) {
      onEnd?.();
      return false;
    }

    const objectUrl = URL.createObjectURL(blob);
    currentObjectUrl = objectUrl;

    const audio = new Audio(objectUrl);
    currentAudio = audio;

    return await new Promise<boolean>((resolve) => {
      const finish = (success: boolean) => {
        cleanupPlayback(objectUrl);
        onEnd?.();
        resolve(success);
      };

      audio.oncanplaythrough = () => {
        if (generation !== playbackGeneration) {
          finish(false);
          return;
        }

        audio.onplay = () => onStart?.();
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);

        void audio.play().catch(() => finish(false));
      };

      audio.onerror = () => finish(false);
    });
  } catch {
    onEnd?.();
    return false;
  }
}

export async function speakTtsSequence(
  segments: Array<{ text: string; lang: TtsLang }>,
): Promise<boolean> {
  const generation = playbackGeneration;
  let playedAny = false;

  for (const segment of segments) {
    if (generation !== playbackGeneration) return playedAny;

    const success = await playTtsAudio(segment.text, segment.lang);
    if (success) {
      playedAny = true;
      continue;
    }

    return false;
  }

  return playedAny;
}
