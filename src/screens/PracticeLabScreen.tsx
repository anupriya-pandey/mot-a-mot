import { PrimaryButton } from '../components/PrimaryButton';
import { PRACTICE_EMPTY_TOOLBOX, PRACTICE_TAB_SUBTITLE, PRACTICE_TODAY_TITLE } from '../constants/practiceMicrocopy';

interface PracticeLabScreenProps {
  totalEntries: number;
  onStartPractice: () => void;
  isStarting: boolean;
  error: string | null;
}

export function PracticeLabScreen({
  totalEntries,
  onStartPractice,
  isStarting,
  error,
}: PracticeLabScreenProps) {
  const canPractice = totalEntries >= 3;

  return (
    <div className="mx-auto w-full max-w-content px-m pb-xl">
      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">Practice Lab</h1>
        <p className="mt-xs text-sm text-text-secondary">{PRACTICE_TAB_SUBTITLE}</p>
      </header>

      <section className="rounded-card bg-surface p-l shadow-card">
        <h2 className="text-xl font-semibold text-text-primary">{PRACTICE_TODAY_TITLE}</h2>
        <p className="mt-m text-base leading-relaxed text-text-secondary">
          Five short prompts built from your toolbox — write in French, get the same helpful feedback
          as Check, and grow your vocabulary as you go.
        </p>

        {!canPractice && (
          <p className="mt-m rounded-lg bg-warning/10 px-m py-s text-sm text-text-primary" role="note">
            {PRACTICE_EMPTY_TOOLBOX}
          </p>
        )}

        {error && (
          <p className="mt-m rounded-lg bg-error/10 px-m py-s text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-l">
          <PrimaryButton
            onClick={onStartPractice}
            loading={isStarting}
            disabled={!canPractice}
          >
            Start Practice
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
