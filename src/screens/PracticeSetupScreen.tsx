import { useState } from 'react';
import { PrimaryButton } from '../components/PrimaryButton';
import { PRACTICE_FOCUS_CATEGORIES } from '../constants/practiceStages';
import {
  PRACTICE_DEDUP_NOTE,
  PRACTICE_FOCUS_ALL,
  PRACTICE_SETUP_SUBTITLE,
  PRACTICE_SETUP_TITLE,
} from '../constants/practiceMicrocopy';
import type { PracticeFocusFilter, PracticeStageId } from '../types/practice';
import type { PartOfSpeech } from '../types/toolbox';

interface PracticeSetupScreenProps {
  stageId: PracticeStageId;
  stageTitle: string;
  categoryCounts: Record<PartOfSpeech, number>;
  onBack: () => void;
  onStart: (focusCategory: PracticeFocusFilter) => void;
  isStarting: boolean;
}

const FILTER_OPTIONS: { value: PracticeFocusFilter; label: string }[] = [
  { value: 'all', label: PRACTICE_FOCUS_ALL },
  ...PRACTICE_FOCUS_CATEGORIES.map((category) => ({
    value: category as PracticeFocusFilter,
    label: category,
  })),
];

export function PracticeSetupScreen({
  stageTitle,
  categoryCounts,
  onBack,
  onStart,
  isStarting,
}: PracticeSetupScreenProps) {
  const [focusCategory, setFocusCategory] = useState<PracticeFocusFilter>('all');

  return (
    <div className="mx-auto w-full max-w-content px-m py-xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-l text-sm font-medium text-primary hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-semibold text-text-primary">{PRACTICE_SETUP_TITLE}</h1>
      <p className="mt-xs text-sm text-text-secondary">{stageTitle}</p>
      <p className="mt-m text-base leading-relaxed text-text-secondary">{PRACTICE_SETUP_SUBTITLE}</p>

      <div className="mt-l flex flex-wrap gap-s">
        {FILTER_OPTIONS.map((option) => {
          const count =
            option.value === 'all'
              ? Object.values(categoryCounts).reduce((sum, value) => sum + value, 0)
              : categoryCounts[option.value as PartOfSpeech] ?? 0;
          const disabled = option.value !== 'all' && count === 0;
          const selected = focusCategory === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => setFocusCategory(option.value)}
              className={[
                'rounded-button border px-m py-s text-sm font-medium transition-colors',
                selected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-primary hover:border-primary/40',
                disabled ? 'cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              {option.label}
              {option.value !== 'all' ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      <p className="mt-m text-sm text-text-secondary">{PRACTICE_DEDUP_NOTE}</p>

      <div className="mt-xl">
        <PrimaryButton onClick={() => onStart(focusCategory)} loading={isStarting}>
          Begin Session
        </PrimaryButton>
      </div>
    </div>
  );
}
