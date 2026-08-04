import { PrimaryButton } from '../components/PrimaryButton';
import {
  PRACTICE_SUMMARY_CATEGORIES,
  PRACTICE_SUMMARY_COMPLETED,
  PRACTICE_SUMMARY_CORRECT,
  PRACTICE_SUMMARY_REINFORCED,
  PRACTICE_SUMMARY_SCORE,
  PRACTICE_SUMMARY_SCORE_NOTE,
  PRACTICE_SUMMARY_TITLE,
} from '../constants/practiceMicrocopy';
import { formatPracticeScore } from '../lib/practiceHelpers';
import type { PracticeSessionSummary } from '../types/practice';

interface PracticeSummaryScreenProps {
  summary: PracticeSessionSummary;
  onDone: () => void;
}

function StarRating({ score, total }: { score: number; total: number }) {
  const filled = Math.round(score);
  return (
    <p className="text-2xl tracking-wider text-warning" aria-label={`${score} of ${total} points`}>
      {'★'.repeat(filled)}
      {'☆'.repeat(Math.max(0, total - filled))}
    </p>
  );
}

export function PracticeSummaryScreen({ summary, onDone }: PracticeSummaryScreenProps) {
  const isSentenceStage = summary.stage === 'sentence';
  const scoreLabel = isSentenceStage ? PRACTICE_SUMMARY_SCORE : PRACTICE_SUMMARY_CORRECT;
  const scoreDisplay = isSentenceStage
    ? `${formatPracticeScore(summary.totalScore)}/${summary.totalCount}`
    : `${summary.correctCount}/${summary.totalCount}`;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-m py-xl">
      <section className="rounded-card bg-surface p-xl shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{PRACTICE_SUMMARY_TITLE}</h1>
        <p className="mt-xs text-sm font-medium text-success">{PRACTICE_SUMMARY_COMPLETED}</p>

        <div className="mt-l">
          <StarRating score={isSentenceStage ? summary.totalScore : summary.correctCount} total={summary.totalCount} />
          <p className="mt-s text-base text-text-primary">
            {summary.completedCount}/{summary.totalCount} prompts
          </p>
        </div>

        <ul className="mt-l space-y-s text-base text-text-primary">
          <li>
            {scoreLabel}: {scoreDisplay}
          </li>
          <li>
            {PRACTICE_SUMMARY_REINFORCED}: {summary.toolboxWordsReinforced}
          </li>
          <li>
            {PRACTICE_SUMMARY_CATEGORIES}: {summary.categoriesPracticed}
          </li>
        </ul>

        {isSentenceStage && (
          <p className="mt-m text-sm leading-relaxed text-text-secondary">{PRACTICE_SUMMARY_SCORE_NOTE}</p>
        )}

        <p className="mt-m text-sm leading-relaxed text-text-secondary">
          {summary.stage === 'sentence'
            ? 'Nice work — your written answers are saved in History.'
            : 'Keep going — each correct answer reinforces words from your toolbox.'}
        </p>

        <div className="mt-xl">
          <PrimaryButton onClick={onDone}>Back to Practice Lab</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
