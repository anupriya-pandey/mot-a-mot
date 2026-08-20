import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { ERRORS, VOICE_HINT, VOICE_LISTENING } from '../constants/microcopy';
import { AppLogo } from '../components/AppLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface LandingScreenProps {
  sentence: string;
  onSentenceChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function LandingScreen({
  sentence,
  onSentenceChange,
  onSubmit,
  isSubmitting,
}: LandingScreenProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);

  const applyVoiceTranscript = (transcript: string) => {
    onSentenceChange(transcript.trim());
    inputRef.current?.focus();
  };

  const {
    isListening,
    isRequestingPermission,
    isSupported,
    permissionState,
    interimTranscript,
    error,
    start,
    stop,
  } = useSpeechRecognition(applyVoiceTranscript);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVoiceClick = () => {
    if (isRequestingPermission) return;

    if (isListening) {
      stop();
    } else {
      void start();
    }
  };

  const trimmed = sentence.trim();

  const handleSubmit = () => {
    if (!trimmed) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    setShowEmptyError(false);
    onSubmit();
  };

  const handleChange = (value: string) => {
    if (value.trim()) {
      setShowEmptyError(false);
    }
    onSentenceChange(value);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-content flex-1 flex-col px-m py-xl">
        <header className="mb-xxl text-center">
          <AppLogo />
          <p className="mt-m text-base text-text-secondary">Write confidently. Learn naturally.</p>
        </header>

        <div className="flex flex-1 flex-col">
          <label htmlFor="french-input" className="mb-m text-2xl font-semibold text-text-primary">
            What do you want to say in French?
          </label>

          <div className="relative mb-m">
            <TextInput
              ref={inputRef}
              id="french-input"
              data-demo-target="check-input"
              value={sentence}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Je ne peux pas venir aujourd'hui."
              warning={showEmptyError}
              aria-describedby={
                error ? 'voice-error' : showEmptyError ? 'empty-error' : undefined
              }
            />
            <VoiceInputButton
              data-demo-target="check-voice"
              isListening={isListening || isRequestingPermission}
              isSupported={isSupported}
              onClick={handleVoiceClick}
            />
          </div>

          {isRequestingPermission && (
            <p className="mb-m text-sm font-medium text-primary">{ERRORS.voiceMicRequesting}</p>
          )}

          {isListening && (
            <p className="mb-m text-sm font-medium text-primary">
              {interimTranscript ? `"${interimTranscript}"` : VOICE_LISTENING}
            </p>
          )}

          {isSupported && !error && !isRequestingPermission && !isListening && permissionState !== 'denied' && (
            <p className="mb-m text-sm text-text-secondary">{VOICE_HINT}</p>
          )}

          {permissionState === 'denied' && !error && (
            <div className="mb-m">
              <StatusBanner type="warning" message={ERRORS.voiceMicDeniedReset} />
            </div>
          )}

          {error && (
            <div className="mb-m" id="voice-error">
              <StatusBanner type="warning" message={error} />
            </div>
          )}

          {showEmptyError && (
            <div className="mb-m" id="empty-error">
              <StatusBanner type="warning" message={ERRORS.emptyInput} />
            </div>
          )}

          <PrimaryButton onClick={handleSubmit} loading={isSubmitting} data-demo-target="check-submit">
            Check My French
          </PrimaryButton>
        </div>
      </main>

      <footer className="pb-xl text-center">
        <p className="inline-flex items-center gap-s text-sm text-text-secondary">
          <Lock className="h-4 w-4" aria-hidden />
          Your messages are private and secure.
        </p>
      </footer>
    </div>
  );
}
