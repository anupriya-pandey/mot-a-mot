import { Volume2, VolumeX } from 'lucide-react';
import { useCallback, useState } from 'react';
import { isFrenchSpeechSupported, speakFrench, stopFrenchSpeech } from '../lib/frenchSpeech';

interface PronunciationButtonProps {
  text: string;
  ariaLabel?: string;
  size?: 'default' | 'compact';
  className?: string;
}

export function PronunciationButton({
  text,
  ariaLabel,
  size = 'default',
  className,
}: PronunciationButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = isFrenchSpeechSupported();
  const iconSize = size === 'compact' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonPadding = size === 'compact' ? 'p-1.5' : 'p-2';
  const trimmed = text.trim();
  const disabled = !isSupported || !trimmed;

  const handleClick = useCallback(() => {
    if (isSpeaking) {
      stopFrenchSpeech();
      setIsSpeaking(false);
      return;
    }

    speakFrench(
      trimmed,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
    );
  }, [trimmed, isSpeaking]);

  const Icon = !isSupported ? VolumeX : Volume2;
  const label = ariaLabel ?? `Hear pronunciation of ${trimmed}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isSpeaking ? 'Stop pronunciation' : label}
      aria-pressed={isSpeaking}
      title={
        disabled
          ? 'Pronunciation unavailable'
          : isSpeaking
            ? 'Stop'
            : 'Hear in French'
      }
      className={[
        'shrink-0 rounded-full transition-colors duration-interaction',
        buttonPadding,
        isSpeaking
          ? 'bg-primary text-white'
          : 'bg-background text-text-secondary hover:bg-primary-light hover:text-primary',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      ].join(' ')}
    >
      <Icon className={iconSize} />
    </button>
  );
}
