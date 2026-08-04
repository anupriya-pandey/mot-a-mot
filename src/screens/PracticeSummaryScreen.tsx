import { PrimaryButton } from '../components/PrimaryButton';
import { PRACTICE_SUMMARY_COMPLETED, PRACTICE_SUMMARY_TITLE } from '../constants/practiceMicrocopy';
import type { PracticeSessionSummary } from '../types/practice';

interface PracticeSummaryScreenProps {
  summary: PracticeSessionSummary;
  onDone: () => void;
}

function StarRating({ count, total }: { count: number; total: number }) {
  return (
    <p className="text-2xl tracking-wider text-warning" aria-label={`${count} of ${total} completed`}>
      {'★'.repeat(count)}
      {'☆'.repeat(Math.max(0, total - count))}
    </p>
  );
}

export function PracticeSummaryScreen({ summary, onDone }: PracticeSummaryScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-m py-xl">
      <section className="rounded-card bg-surface p-xl shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{PRACTICE_SUMMARY_TITLE}</h1>
        <p className="mt-xs text-sm font-medium text-success">{PRACTICE_SUMMARY_COMPLETED}</p>

        <div className="mt-l">
          <StarRating count={summary.completedCount} total={summary.totalCount} />
          <p className="mt-s text-base text-text-primary">
            {summary.completedCount}/{summary.totalCount} prompts
          </p>
        </div>

        <ul className="mt-l space-y-s text-base text-text-primary">
          <li>New entries discovered: {summary.newWordsDiscovered}</li>
          <li>Words strengthened: {summary.wordsStrengthened}</li>
          {summary.stage === 'quick' && (
            <li>
              Correct answers: {summary.correctCount}/{summary.totalCount}
            </li>
          )}
        </ul>

        <p className="mt-m text-sm leading-relaxed text-text-secondary">
          Nice work — your practice is saved in History, and anything you added goes to your Toolbox.
        </p>

        <div className="mt-xl">
          <PrimaryButton onClick={onDone}>Back to Practice Lab</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
