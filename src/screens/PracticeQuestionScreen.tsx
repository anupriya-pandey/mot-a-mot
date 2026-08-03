import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';
import { ERRORS } from '../constants/microcopy';
import type { PracticePrompt } from '../types/practice';

interface PracticeQuestionScreenProps {
  prompt: PracticePrompt;
  questionNumber: number;
  totalQuestions: number;
  onCheck: (sentence: string) => void;
  isChecking: boolean;
}

export function PracticeQuestionScreen({
  prompt,
  questionNumber,
  totalQuestions,
  onCheck,
  isChecking,
}: PracticeQuestionScreenProps) {
  const [sentence, setSentence] = useState('');
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSentence('');
    setShowEmptyError(false);
    inputRef.current?.focus();
  }, [prompt.index]);

  const handleCheck = () => {
    if (!sentence.trim()) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    setShowEmptyError(false);
    onCheck(sentence.trim());
  };

  return (
    <div className="mx-auto w-full max-w-content px-m py-xl">
      <p className="mb-m text-sm font-medium text-text-secondary">
        Question {questionNumber} of {totalQuestions}
      </p>

      <h1 className="text-2xl font-semibold text-text-primary">{prompt.title}</h1>
      <p className="mt-s text-base text-text-secondary">{prompt.instruction}</p>

      <ul className="mt-m flex flex-wrap gap-s">
        {prompt.targetWords.map((word) => (
          <li
            key={word}
            className="rounded-button border border-primary/20 bg-primary/5 px-m py-s text-sm font-medium text-text-primary"
          >
            {word}
          </li>
        ))}
      </ul>

      <div className="mt-l">
        <TextInput
          ref={inputRef}
          value={sentence}
          onChange={(event) => {
            if (event.target.value.trim()) setShowEmptyError(false);
            setSentence(event.target.value);
          }}
          placeholder="Write your sentence in French…"
          rows={4}
          warning={showEmptyError}
        />
      </div>

      {showEmptyError && (
        <div className="mt-m">
          <StatusBanner type="warning" message={ERRORS.emptyInput} />
        </div>
      )}

      <div className="mt-l">
        <PrimaryButton onClick={handleCheck} loading={isChecking}>
          Check
        </PrimaryButton>
      </div>
    </div>
  );
}
