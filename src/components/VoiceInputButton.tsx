import { Loader2, Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  'data-demo-target'?: string;
}

export function VoiceInputButton({ isListening, isSupported, onClick, 'data-demo-target': demoTarget }: VoiceInputButtonProps) {
  const Icon = !isSupported ? MicOff : isListening ? Loader2 : Mic;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSupported}
      data-demo-target={demoTarget}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      className={[
        'absolute bottom-3 right-3 rounded-full p-2 transition-colors duration-interaction',
        isListening
          ? 'bg-primary text-white'
          : 'bg-background text-text-secondary hover:bg-primary-light hover:text-primary',
        !isSupported && 'cursor-not-allowed opacity-50',
      ].join(' ')}
    >
      <Icon className={`h-5 w-5 ${isListening ? 'animate-spin' : ''}`} />
    </button>
  );
}
