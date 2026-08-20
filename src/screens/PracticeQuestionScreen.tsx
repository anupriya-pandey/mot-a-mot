import { useEffect, useRef, useState } from 'react';
import { PracticeWritingFeedback } from '../components/PracticeWritingFeedback';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import { TextInput } from '../components/TextInput';
import {
  PRACTICE_END_SESSION,
  PRACTICE_QUICK_CORRECT,
  PRACTICE_QUICK_INCORRECT,
  PRACTICE_WRONG_EXPLANATION_LABEL,
} from '../constants/practiceMicrocopy';
import { ERRORS } from '../constants/microcopy';
import {
  sanitizeFillBlankSentence,
  sanitizeFrenchDisplayText,
} from '../lib/practiceHelpers';
import type { PracticePrompt, PracticeQuestionFeedback } from '../types/practice';

interface PracticeQuestionScreenProps {
  prompt: PracticePrompt;
  questionNumber: number;
  totalQuestions: number;
  feedback: PracticeQuestionFeedback | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onEndSession: () => void;
  isChecking: boolean;
  /** Demo walkthrough only — prefills the answer field */
  demoPrefillAnswer?: string;
}

function exerciseTypeLabel(type: PracticePrompt['type']): string {
  switch (type) {
    case 'fill_blank':
      return 'Fill in the blank';
    case 'adjective_transform':
      return 'Adjective form';
    case 'match_meaning':
    case 'mcq_meaning':
      return 'Word meaning';
    case 'match_following':
      return 'Matching';
    case 'find_error':
      return 'Find the error';
    case 'find_errors_multi':
      return 'Find every error';
    case 'multiple_choice':
    case 'mcq_conjugation':
      return 'Conjugation';
    case 'mcq_verb_meaning':
      return 'Verb meaning';
    case 'mcq_pronoun':
      return 'Subject pronoun';
    case 'mcq_grammar':
      return 'Grammar';
    case 'mcq_expression':
      return 'Expression';
    case 'noun_gender':
      return 'Noun gender';
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

const CHOICE_EXERCISE_TYPES = new Set<PracticePrompt['type']>([
  'multiple_choice',
  'match_meaning',
  'find_error',
  'noun_gender',
  'mcq_conjugation',
  'mcq_verb_meaning',
  'mcq_pronoun',
  'mcq_meaning',
  'mcq_grammar',
  'mcq_expression',
]);

export function PracticeQuestionScreen({
  prompt,
  questionNumber,
  totalQuestions,
  feedback,
  onSubmit,
  onNext,
  onEndSession,
  isChecking,
  demoPrefillAnswer,
}: PracticeQuestionScreenProps) {
  const [answer, setAnswer] = useState(demoPrefillAnswer ?? '');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isChoiceType = CHOICE_EXERCISE_TYPES.has(prompt.type);
  const isMultiSelect = prompt.type === 'find_errors_multi' || Boolean(prompt.multiSelect);
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
    setAnswer(demoPrefillAnswer ?? '');
    setSelectedOption('');
    setSelectedOptions([]);
    setMatchSelections({});
    setShowEmptyError(false);
    inputRef.current?.focus();
  }, [prompt.id, demoPrefillAnswer]);

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

    if (isMultiSelect) {
      if (selectedOptions.length === 0) {
        setShowEmptyError(true);
        return;
      }
      setShowEmptyError(false);
      onSubmit(selectedOptions.sort().join(','));
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

  const displaySentence =
    prompt.type === 'fill_blank' && prompt.sentenceWithBlank
      ? sanitizeFillBlankSentence(prompt.sentenceWithBlank)
      : prompt.type !== 'translation' &&
          prompt.type !== 'question_answer' &&
          prompt.type !== 'build_sentence' &&
          prompt.sentenceWithBlank
        ? sanitizeFrenchDisplayText(prompt.sentenceWithBlank)
        : null;

  return (
    <div className="mx-auto w-full max-w-content px-m py-xl">
      <div className="mb-m flex items-center justify-between gap-m">
        <p className="text-sm font-medium text-text-secondary">
          Question {questionNumber} of {totalQuestions}
        </p>
        <button
          type="button"
          onClick={onEndSession}
          className="text-sm font-medium text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
        >
          {PRACTICE_END_SESSION}
        </button>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-primary">
        {exerciseTypeLabel(prompt.type)}
      </p>
      <h1 className="mt-xs text-2xl font-semibold text-text-primary">{prompt.title}</h1>
      <p className="mt-s text-base text-text-secondary">{prompt.instruction}</p>

      {prompt.type === 'translation' && prompt.englishPrompt && (
        <p className="mt-m rounded-lg border border-primary/20 bg-primary/5 px-m py-m text-center text-xl font-medium leading-relaxed text-text-primary">
          &ldquo;{prompt.englishPrompt}&rdquo;
        </p>
      )}

      {prompt.type === 'question_answer' && prompt.frenchPrompt && (
        <p className="mt-m rounded-lg border border-primary/20 bg-primary/5 px-m py-m text-center text-2xl font-semibold leading-relaxed text-text-primary">
          {sanitizeFrenchDisplayText(prompt.frenchPrompt)}
        </p>
      )}

      {prompt.type === 'build_sentence' && (prompt.frenchPrompt || prompt.targetWords.length > 0) && (
        <p className="mt-m rounded-lg border border-primary/20 bg-primary/5 px-m py-m text-center text-2xl font-semibold leading-relaxed text-text-primary">
          {prompt.frenchPrompt ??
            prompt.targetWords.map((word) => `« ${word} »`).join(' · ')}
        </p>
      )}

      {prompt.englishPrompt &&
        prompt.type !== 'translation' &&
        prompt.type !== 'question_answer' &&
        prompt.type !== 'build_sentence' && (
        <p className="mt-m rounded-lg bg-background px-m py-s text-base text-text-primary">
          {prompt.englishPrompt}
        </p>
      )}

      {prompt.type === 'match_meaning' && prompt.frenchPrompt && (
        <p className="mt-m rounded-lg border border-primary/20 bg-primary/5 px-m py-m text-2xl font-semibold text-text-primary">
          {prompt.frenchPrompt}
        </p>
      )}

      {displaySentence && (
        <p className="mt-m rounded-lg bg-background px-m py-s text-lg text-text-primary">
          {displaySentence}
        </p>
      )}

      {prompt.type === 'multiple_choice' && !prompt.sentenceWithBlank && prompt.frenchPrompt && (
        <p className="mt-m rounded-lg bg-background px-m py-s text-lg text-text-primary">
          {prompt.frenchPrompt}
        </p>
      )}

      {prompt.flawedSentence && (
        <p className="mt-m rounded-lg border border-warning/30 bg-warning/5 px-m py-s text-lg text-text-primary">
          {sanitizeFrenchDisplayText(prompt.flawedSentence)}
        </p>
      )}

      {prompt.flawedPassage && (
        <div className="mt-m space-y-s rounded-lg border border-warning/30 bg-warning/5 px-m py-s text-lg text-text-primary">
          {prompt.flawedPassage.split('\n').map((line) => (
            <p key={line}>{sanitizeFrenchDisplayText(line)}</p>
          ))}
        </div>
      )}

      {!feedback && isMultiSelect && choiceOptions.length > 0 && (
        <fieldset className="mt-l space-y-s">
          <legend className="sr-only">Select every error</legend>
          {choiceOptions.map((option) => (
            <label
              key={option.id}
              className={[
                'flex cursor-pointer items-start gap-m rounded-card border px-m py-s',
                selectedOptions.includes(option.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface',
              ].join(' ')}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => {
                  setSelectedOptions((current) =>
                    current.includes(option.id)
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id],
                  );
                  setShowEmptyError(false);
                }}
                className="mt-1"
              />
              <span className="text-base text-text-primary">{option.text}</span>
            </label>
          ))}
        </fieldset>
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

      {!feedback && isChoiceType && !isMultiSelect && choiceOptions.length > 0 && (
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

      {!feedback && !isChoiceType && !isMultiSelect && !isMatchFollowing && (
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
            data-demo-target="practice-answer-input"
          />
        </div>
      )}

      {feedback?.grading && (
        <PracticeWritingFeedback grading={feedback.grading} userAnswer={feedback.userAnswer} />
      )}

      {feedback && !feedback.grading && (
        <div
          data-demo-target="practice-feedback"
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
          {!feedback.correct && feedback.correctAnswer && (
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
          <PrimaryButton onClick={handleSubmit} loading={isChecking} data-demo-target="practice-submit">
            {isTextProduction ? 'Submit' : 'Submit'}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
