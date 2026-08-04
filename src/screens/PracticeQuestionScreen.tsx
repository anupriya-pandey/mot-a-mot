import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';
import {
  PRACTICE_QUICK_CORRECT,
  PRACTICE_QUICK_INCORRECT,
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
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isChoiceType =
    prompt.type === 'multiple_choice' ||
    prompt.type === 'match_meaning' ||
    prompt.type === 'find_error';
  const isTextProduction =
    prompt.type === 'translation' ||
    prompt.type === 'question_answer' ||
    prompt.type === 'build_sentence';

  useEffect(() => {
    setAnswer('');
    setSelectedOption('');
    setShowEmptyError(false);
    inputRef.current?.focus();
  }, [prompt.id]);

  const handleSubmit = () => {
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

      {prompt.formFocus && (
        <p className="mt-s text-sm text-text-secondary">Form focus: {prompt.formFocus}</p>
      )}

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

      {!feedback && isChoiceType && prompt.options && (
        <fieldset className="mt-l space-y-s">
          <legend className="sr-only">Choose an answer</legend>
          {prompt.options.map((option) => (
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

      {!feedback && !isChoiceType && (
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
          {feedback.explanation && (
            <p className="mt-s text-sm leading-relaxed text-text-secondary">{feedback.explanation}</p>
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
