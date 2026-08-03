import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  IMPORT_DESCRIPTION,
  IMPORT_EMPTY_ERROR,
  IMPORT_PLACEHOLDER,
  IMPORT_TITLE,
} from '../constants/importMicrocopy';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';

interface ImportToolboxScreenProps {
  text: string;
  onTextChange: (value: string) => void;
  onAnalyze: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function ImportToolboxScreen({
  text,
  onTextChange,
  onAnalyze,
  onBack,
  isSubmitting,
  error,
}: ImportToolboxScreenProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    setShowEmptyError(false);
    onAnalyze();
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <SecondaryButton onClick={onBack} className="mb-l">
        <span className="inline-flex items-center justify-center gap-s">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </span>
      </SecondaryButton>

      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">{IMPORT_TITLE}</h1>
        <p className="mt-m text-base leading-relaxed text-text-secondary">{IMPORT_DESCRIPTION}</p>
      </header>

      <TextInput
        ref={inputRef}
        value={text}
        onChange={(event) => {
          if (event.target.value.trim()) setShowEmptyError(false);
          onTextChange(event.target.value);
        }}
        placeholder={IMPORT_PLACEHOLDER}
        rows={12}
        warning={showEmptyError}
        className="font-mono text-sm leading-relaxed"
        aria-describedby={showEmptyError ? 'import-empty-error' : undefined}
      />

      {showEmptyError && (
        <div className="mt-m" id="import-empty-error">
          <StatusBanner type="warning" message={IMPORT_EMPTY_ERROR} />
        </div>
      )}

      {error && (
        <div className="mt-m">
          <StatusBanner type="error" message={error} />
        </div>
      )}

      <div className="mt-l">
        <PrimaryButton onClick={handleSubmit} loading={isSubmitting}>
          Analyze Import
        </PrimaryButton>
      </div>
    </div>
  );
}
