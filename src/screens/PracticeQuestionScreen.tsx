import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';
import {
  PRACTICE_HINTS_LABEL,
  PRACTICE_QUICK_CORRECT,
  PRACTICE_QUICK_INCORRECT,
  PRACTICE_WRONG_EXPLANATION_LABEL,
} from '../constants/practiceMicrocopy';
import { ERRORS } from '../constants/microcopy';
import type { PracticePrompt } from '../types/practice';

export interface PracticeQuestionFeedback {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

interface PracticeQuestionScreenProps {
  prompt: PracticePrompt;
  questionNumber: number;
  totalQuestions: number;
  feedback: PracticeQuestionFeedback | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  isChecking: boolean;
}

function exerciseTypeLabel(type: PracticePrompt['type']): string {
  switch (type) {
    case 'fill_blank':
      return 'Fill in the blank';
    case 'match_meaning':
      return 'Match the meaning';
    case 'match_following':
      return 'Match the following';
    case 'find_error':
      return 'Find the error';
    case 'multiple_choice':
      return 'Multiple choice';
    case 'translation':
      return 'Translation';
    case 'question_answer':
      return 'Question & answer';
    case 'build_sentence':
      return 'Build a sentence';
    default:
      return 'Practice';
  }
}

export function PracticeQuestionScreen({
  prompt,
  questionNumber,
  totalQuestions,
  feedback,
  onSubmit,
  onNext,
  isChecking,
}: PracticeQuestionScreenProps) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isChoiceType =
    prompt.type === 'multiple_choice' ||
    prompt.type === 'match_meaning' ||
    prompt.type === 'find_error';
  const isMatchFollowing = prompt.type === 'match_following';
  const isTextProduction =
    prompt.type === 'translation' ||
    prompt.type === 'question_answer' ||
    prompt.type === 'build_sentence';

  const choiceOptions = (() => {
    if (!prompt.options) return [];
    const seen = new Set<string>();
    return prompt.options.filter((option) => {
      const key = option.text.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  useEffect(() => {
    setAnswer('');
    setSelectedOption('');
    setMatchSelections({});
    setShowEmptyError(false);
    inputRef.current?.focus();
  }, [prompt.id]);

  const handleSubmit = () => {
    if (isMatchFollowing) {
      const rows = prompt.matchRows ?? [];
      const complete = rows.every((row) => matchSelections[row.id]?.trim());
      if (!complete) {
        setShowEmptyError(true);
        return;
      }
      setShowEmptyError(false);
      onSubmit(JSON.stringify(matchSelections));
      return;
    }

    const value = isChoiceType ? selectedOption : answer.trim();
    if (!value) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    setShowEmptyError(false);
    onSubmit(value);
  };

  return (
    <div className="mx-auto w-full max-w-content px-m py-xl">
      <p className="mb-m text-sm font-medium text-text-secondary">
        Question {questionNumber} of {totalQuestions}
      </p>

      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {exerciseTypeLabel(prompt.type)}
      </p>
      <h1 className="mt-xs text-2xl font-semibold text-text-primary">{prompt.title}</h1>
      <p className="mt-s text-base text-text-secondary">{prompt.instruction}</p>

      {prompt.englishPrompt && (
        <p className="mt-m rounded-lg bg-background px-m py-s text-base text-text-primary">
          {prompt.englishPrompt}
        </p>
      )}

      {prompt.sentenceWithBlank && (
        <p className="mt-m rounded-lg bg-background px-m py-s text-lg text-text-primary">
          {prompt.sentenceWithBlank}
        </p>
      )}

      {prompt.flawedSentence && (
        <p className="mt-m rounded-lg border border-warning/30 bg-warning/5 px-m py-s text-lg text-text-primary">
          {prompt.flawedSentence}
        </p>
      )}

      { (prompt.hints ?? []).length > 0 && (
        <div className="mt-m rounded-lg border border-border bg-background px-m py-s">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {PRACTICE_HINTS_LABEL}
          </p>
          <ul className="mt-s space-y-xs">
            {(prompt.hints ?? []).map((hint) => (
              <li key={hint} className="text-sm leading-relaxed text-text-primary">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!feedback && isMatchFollowing && prompt.matchRows && (
        <div className="mt-l space-y-m">
          {prompt.matchRows.map((row) => (
            <label key={row.id} className="block space-y-xs">
              <span className="text-base font-medium text-text-primary">{row.french}</span>
              <select
                value={matchSelections[row.id] ?? ''}
                onChange={(event) => {
                  setMatchSelections((current) => ({
                    ...current,
                    [row.id]: event.target.value,
                  }));
                  setShowEmptyError(false);
                }}
                className="w-full rounded-button border border-border bg-surface px-m py-s text-base text-text-primary"
              >
                <option value="">Choose the meaning…</option>
                {choiceOptions.map((option) => (
                  <option key={`${row.id}-${option.id}`} value={option.id}>
                    {option.text}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {!feedback && isChoiceType && choiceOptions.length > 0 && (
        <fieldset className="mt-l space-y-s">
          <legend className="sr-only">Choose an answer</legend>
          {choiceOptions.map((option) => (
            <label
              key={option.id}
              className={[
                'flex cursor-pointer items-start gap-m rounded-card border px-m py-s',
                selectedOption === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface',
              ].join(' ')}
            >
              <input
                type="radio"
                name={`practice-${prompt.id}`}
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => {
                  setSelectedOption(option.id);
                  setShowEmptyError(false);
                }}
                className="mt-1"
              />
              <span className="text-base text-text-primary">{option.text}</span>
            </label>
          ))}
        </fieldset>
      )}

      {!feedback && !isChoiceType && !isMatchFollowing && (
        <div className="mt-l">
          <TextInput
            ref={inputRef}
            value={answer}
            onChange={(event) => {
              if (event.target.value.trim()) setShowEmptyError(false);
              setAnswer(event.target.value);
            }}
            placeholder={
              isTextProduction ? 'Write your sentence in French…' : 'Type your answer…'
            }
            rows={isTextProduction ? 4 : 2}
            warning={showEmptyError}
          />
        </div>
      )}

      {feedback && (
        <div
          className={[
            'mt-l rounded-card border px-m py-m',
            feedback.correct
              ? 'border-success/30 bg-success/5'
              : 'border-warning/30 bg-warning/5',
          ].join(' ')}
          role="status"
        >
          <p className="font-semibold text-text-primary">
            {feedback.correct ? PRACTICE_QUICK_CORRECT : PRACTICE_QUICK_INCORRECT}
          </p>
          {!feedback.correct && (
            <p className="mt-s text-base text-text-primary">
              <span className="font-medium">Answer: </span>
              {feedback.correctAnswer}
            </p>
          )}
          {!feedback.correct && feedback.explanation && (
            <div className="mt-m rounded-lg bg-surface/80 px-m py-s">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {PRACTICE_WRONG_EXPLANATION_LABEL}
              </p>
              <p className="mt-xs text-sm leading-relaxed text-text-primary">
                {feedback.explanation}
              </p>
            </div>
          )}
          {feedback.correct && feedback.explanation && (
            <p className="mt-s text-sm leading-relaxed text-text-secondary">
              {feedback.explanation}
            </p>
          )}
        </div>
      )}

      {showEmptyError && !feedback && (
        <div className="mt-m">
          <StatusBanner type="warning" message={ERRORS.emptyInput} />
        </div>
      )}

      <div className="mt-l">
        {feedback ? (
          <PrimaryButton onClick={onNext}>
            {questionNumber >= totalQuestions ? 'Finish Session →' : 'Next Question →'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleSubmit} loading={isChecking}>
            {isTextProduction ? 'Check' : 'Submit'}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
