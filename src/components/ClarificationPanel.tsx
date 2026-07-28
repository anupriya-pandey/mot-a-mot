import { useEffect, useRef, useState } from 'react';
import { ERRORS } from '../constants/microcopy';
import type { ClarificationInput } from '../types/analysis';
import { PrimaryButton } from './PrimaryButton';
import { TextInput } from './TextInput';

interface ClarificationPanelProps {
  onSubmit: (clarification: ClarificationInput) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function ClarificationPanel({ onSubmit, isSubmitting, error }: ClarificationPanelProps) {
  const [mode, setMode] = useState<'english' | 'french'>('english');
  const [text, setText] = useState('');
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    onSubmit({ mode, text: text.trim() });
  };

  return (
    <section
      className="rounded-card border border-border bg-background p-l"
      aria-labelledby="clarification-title"
    >
      <h3 id="clarification-title" className="text-base font-semibold text-text-primary">
        Help us understand what you meant
      </h3>
      <p className="mt-xs text-sm text-text-secondary">
        Tell us in English or rewrite your sentence in French — we&apos;ll update your correction.
      </p>

      <div className="mt-m flex flex-wrap gap-s">
        <button
          type="button"
          onClick={() => setMode('english')}
          className={[
            'rounded-button px-m py-2 text-sm font-medium transition-colors',
            mode === 'english'
              ? 'bg-primary text-white'
              : 'border border-border bg-surface text-text-secondary hover:bg-primary-light',
          ].join(' ')}
        >
          Describe it in English
        </button>
        <button
          type="button"
          onClick={() => setMode('french')}
          className={[
            'rounded-button px-m py-2 text-sm font-medium transition-colors',
            mode === 'french'
              ? 'bg-primary text-white'
              : 'border border-border bg-surface text-text-secondary hover:bg-primary-light',
          ].join(' ')}
        >
          Rewrite it in French
        </button>
      </div>

      <div className="mt-m">
        <TextInput
          ref={inputRef}
          value={text}
          onChange={(event) => {
            if (event.target.value.trim()) setShowEmptyError(false);
            setText(event.target.value);
          }}
          placeholder={
            mode === 'english'
              ? 'I wanted to say that I cannot come today.'
              : "Je ne peux pas venir aujourd'hui."
          }
          warning={showEmptyError}
          aria-label={
            mode === 'english'
              ? 'Describe your intended meaning in English'
              : 'Rewrite your intended meaning in French'
          }
        />
      </div>

      {showEmptyError && (
        <p className="mt-s text-sm text-warning" role="alert">
          {ERRORS.clarificationEmpty}
        </p>
      )}

      {error && (
        <p className="mt-s text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="mt-m">
        <PrimaryButton onClick={handleSubmit} loading={isSubmitting}>
          Update My Correction
        </PrimaryButton>
      </div>
    </section>
  );
}
