import { PrimaryButton } from '../components/PrimaryButton';
import {
  PRACTICE_INTRO_BACK,
  PRACTICE_QUICK_INTRO,
  PRACTICE_SENTENCE_INTRO,
  PRACTICE_SESSION_TITLE,
} from '../constants/practiceMicrocopy';
import type { PracticeSessionPlan } from '../types/practice';

interface PracticeSessionIntroScreenProps {
  session: PracticeSessionPlan;
  onStart: () => void;
  onBack: () => void;
}

export function PracticeSessionIntroScreen({
  session,
  onStart,
  onBack,
}: PracticeSessionIntroScreenProps) {
  const introCopy = session.stage === 'quick' ? PRACTICE_QUICK_INTRO : PRACTICE_SENTENCE_INTRO;
  const focusLabel =
    session.focusCategory === 'all' ? 'All categories' : session.focusCategory;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-m py-xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-l self-start text-sm font-medium text-primary hover:underline"
      >
        ← {PRACTICE_INTRO_BACK}
      </button>

      <section className="rounded-card bg-surface p-xl shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{PRACTICE_SESSION_TITLE}</h1>

        <ul className="mt-l space-y-s text-base text-text-primary">
          <li className="flex items-center gap-s">
            <span className="text-success" aria-hidden>
              ✓
            </span>
            {session.prompts.length} questions
          </li>
          <li>Focus: {focusLabel}</li>
          <li>Estimated time: {session.estimatedMinutes} minutes</li>
        </ul>

        <p className="mt-m text-sm leading-relaxed text-text-secondary">{introCopy}</p>

        <div className="mt-xl">
          <PrimaryButton onClick={onStart} data-demo-target="practice-session-start">
            Start
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
