import { useState } from 'react';
import {
  PRACTICE_GRADE_GRAMMAR,
  PRACTICE_GRADE_MEANING,
  PRACTICE_GRADE_NATURALNESS,
  PRACTICE_GRADE_VOCABULARY,
  PRACTICE_WRITING_COLLAPSE,
  PRACTICE_WRITING_EXPAND,
  PRACTICE_WRITING_SUGGESTED,
  PRACTICE_WRITING_YOUR_ANSWER,
  PRACTICE_WRONG_EXPLANATION_LABEL,
} from '../constants/practiceMicrocopy';
import { formatPracticeScore } from '../lib/practiceHelpers';
import { formatStarRating } from '../lib/practiceGradingDisplay';
import type { PracticeExerciseGrading } from '../types/practice';

interface PracticeWritingFeedbackProps {
  grading: PracticeExerciseGrading;
  userAnswer: string;
}

function GradeRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-m text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium tracking-wide text-warning" aria-label={`${label}: ${value} out of 1`}>
        {formatStarRating(value)}
      </span>
    </div>
  );
}

export function PracticeWritingFeedback({ grading, userAnswer }: PracticeWritingFeedbackProps) {
  const [expanded, setExpanded] = useState(false);
  const scoreLabel = `${formatPracticeScore(grading.overall)} / 1`;
  const isStrong = grading.overall >= 0.8;

  return (
    <div
      className={[
        'mt-l rounded-card border px-m py-m',
        isStrong ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5',
      ].join(' ')}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-s">
        <div>
          <p className="text-lg font-semibold text-text-primary">
            {grading.overall >= 0.95 ? '✔ ' : ''}
            {grading.headline}
          </p>
          <p className="mt-xs text-2xl font-semibold text-text-primary">{scoreLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {expanded ? PRACTICE_WRITING_COLLAPSE : PRACTICE_WRITING_EXPAND}
        </button>
      </div>

      {expanded && (
        <div className="mt-m space-y-xs rounded-lg bg-surface/80 px-m py-s">
          <GradeRow label={PRACTICE_GRADE_MEANING} value={grading.meaning} />
          <GradeRow label={PRACTICE_GRADE_GRAMMAR} value={grading.grammar} />
          <GradeRow label={PRACTICE_GRADE_VOCABULARY} value={grading.vocabulary} />
          <GradeRow label={PRACTICE_GRADE_NATURALNESS} value={grading.naturalness} />
        </div>
      )}

      <div className="mt-m space-y-m">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {PRACTICE_WRITING_YOUR_ANSWER}
          </p>
          <p className="mt-xs text-base text-text-primary">{userAnswer}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {PRACTICE_WRITING_SUGGESTED}
          </p>
          <p className="mt-xs text-base text-text-primary">{grading.suggestedAnswer}</p>
        </div>

        {grading.feedback && (
          <div className="rounded-lg bg-surface/80 px-m py-s">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {PRACTICE_WRONG_EXPLANATION_LABEL}
            </p>
            <p className="mt-xs text-sm leading-relaxed text-text-primary">{grading.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
