import { PrimaryButton } from '../components/PrimaryButton';
import { PRACTICE_SESSION_TITLE } from '../constants/practiceMicrocopy';
import type { PracticeSessionPlan } from '../types/practice';

interface PracticeSessionIntroScreenProps {
  session: PracticeSessionPlan;
  onStart: () => void;
}

export function PracticeSessionIntroScreen({ session, onStart }: PracticeSessionIntroScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-m py-xl">
      <section className="rounded-card bg-surface p-xl shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{PRACTICE_SESSION_TITLE}</h1>

        <ul className="mt-l space-y-s text-base text-text-primary">
          <li className="flex items-center gap-s">
            <span className="text-success" aria-hidden>
              ✓
            </span>
            5 questions
          </li>
          <li>
            Estimated time: {session.estimatedMinutes} minutes
          </li>
        </ul>

        <p className="mt-m text-sm leading-relaxed text-text-secondary">
          Each prompt uses words from your toolbox. Write in French — we&apos;ll check your sentence
          and help you improve, just like the Check tab.
        </p>

        <div className="mt-xl">
          <PrimaryButton onClick={onStart}>Start</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
