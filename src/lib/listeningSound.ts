let sharedContext: AudioContext | null = null;

export function prepareListeningSound() {
  try {
    if (!sharedContext) {
      sharedContext = new AudioContext();
    }
    if (sharedContext.state === 'suspended') {
      void sharedContext.resume();
    }
  } catch {
    // Sound is optional — ignore if the browser blocks audio
  }
}

function playTone(ctx: AudioContext, frequency: number, startAt: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.01);
}

export function playListeningStartSound() {
  try {
    prepareListeningSound();
    const ctx = sharedContext;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.1);
    playTone(ctx, 1318.51, now + 0.11, 0.14);
  } catch {
    // Sound is optional — ignore failures
  }
}
