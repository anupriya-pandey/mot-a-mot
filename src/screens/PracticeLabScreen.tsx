import { Lock } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { PRACTICE_STAGES } from '../constants/practiceStages';
import {
  PRACTICE_CATEGORIES_TITLE,
  PRACTICE_COMING_SOON,
  PRACTICE_LOCKED_ALMOST,
  PRACTICE_LOCKED_BODY,
  PRACTICE_LOCKED_TITLE,
  PRACTICE_PROGRESS_TITLE,
  PRACTICE_READINESS_TITLE,
  PRACTICE_STAGE_LOCKED,
  PRACTICE_STAGES_TITLE,
  PRACTICE_TAB_SUBTITLE,
} from '../constants/practiceMicrocopy';
import { isStageUnlocked, READINESS_TARGETS, type PracticeReadiness } from '../lib/practiceReadiness';
import type { PracticeStageId } from '../types/practice';

interface PracticeLabScreenProps {
  readiness: PracticeReadiness;
  totalEntries: number;
  onSelectStage: (stageId: PracticeStageId) => void;
  onGoToCheck: () => void;
  onGoToImport: () => void;
  error: string | null;
}

function ReadinessBar({ score }: { score: number }) {
  return (
    <div className="mt-s">
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

function LockedPracticeView({
  readiness,
  onGoToCheck,
  onGoToImport,
}: Pick<PracticeLabScreenProps, 'readiness' | 'onGoToCheck' | 'onGoToImport'>) {
  return (
    <section className="rounded-card bg-surface p-l shadow-card">
      <div className="flex items-start gap-m">
        <span className="text-3xl" aria-hidden>
          🔒
        </span>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{PRACTICE_LOCKED_TITLE}</h2>
          <p className="mt-s text-base leading-relaxed text-text-secondary">{PRACTICE_LOCKED_BODY}</p>
        </div>
      </div>

      <div className="mt-l rounded-lg border border-border bg-background p-m">
        <p className="text-sm font-medium text-text-secondary">{PRACTICE_READINESS_TITLE}</p>
        <p className="mt-xs text-2xl font-semibold text-text-primary">{readiness.score}%</p>
        <p className="text-sm text-text-secondary">{readiness.label}</p>
        <ReadinessBar score={readiness.score} />

        <ul className="mt-m space-y-xs text-sm text-text-secondary">
          <li>
            {readiness.factors.entries.label}: {readiness.factors.entries.current} /{' '}
            {readiness.factors.entries.target}
          </li>
          <li>
            {readiness.factors.categories.label}: {readiness.factors.categories.current} /{' '}
            {readiness.factors.categories.target}
          </li>
          <li>
            {readiness.factors.verbs.label}: {readiness.factors.verbs.current} /{' '}
            {readiness.factors.verbs.target}
          </li>
        </ul>
      </div>

      <div className="mt-l">
        <p className="text-sm font-medium text-text-secondary">{PRACTICE_PROGRESS_TITLE}</p>
        <p className="mt-xs text-base text-text-primary">
          {readiness.factors.entries.current} / {READINESS_TARGETS.entries} entries
        </p>
      </div>

      <div className="mt-l">
        <p className="text-sm font-medium text-text-secondary">{PRACTICE_CATEGORIES_TITLE}</p>
        <ul className="mt-s grid grid-cols-2 gap-s text-sm">
          {readiness.representedCategories.map((category) => (
            <li key={category} className="text-text-primary">
              ✓ {category}
            </li>
          ))}
          {readiness.missingCategories.map((category) => (
            <li key={category} className="text-text-secondary">
              ○ {category}
            </li>
          ))}
        </ul>
      </div>

      {readiness.score >= 60 && (
        <p className="mt-l rounded-lg bg-primary/5 px-m py-s text-sm text-text-secondary" role="note">
          {PRACTICE_LOCKED_ALMOST}
        </p>
      )}

      <div className="mt-l space-y-s">
        <PrimaryButton onClick={onGoToCheck}>Check French</PrimaryButton>
        <SecondaryButton onClick={onGoToImport}>Import to Toolbox</SecondaryButton>
      </div>
    </section>
  );
}

function StageCard({
  emoji,
  title,
  exerciseLabel,
  description,
  unlocked,
  comingSoon,
  entriesNeeded,
  totalEntries,
  onSelect,
  startDemoTarget,
}: {
  emoji: string;
  title: string;
  exerciseLabel: string;
  description: string;
  unlocked: boolean;
  comingSoon: boolean;
  entriesNeeded: number;
  totalEntries: number;
  onSelect: () => void;
  startDemoTarget?: string;
}) {
  const locked = comingSoon || !unlocked;

  return (
    <article
      className={[
        'rounded-card border p-m',
        locked ? 'border-border bg-background opacity-80' : 'border-primary/20 bg-surface shadow-card',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-s">
        <div>
          <p className="text-2xl" aria-hidden>
            {emoji}
          </p>
          <h3 className="mt-xs text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        {comingSoon && (
          <span className="rounded-button bg-border px-s py-xs text-xs font-medium text-text-secondary">
            {PRACTICE_COMING_SOON}
          </span>
        )}
        {!comingSoon && !unlocked && (
          <Lock className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
        )}
      </div>

      <p className="mt-xs text-xs font-medium text-primary">{exerciseLabel}</p>
      <p className="mt-s text-sm leading-relaxed text-text-secondary">{description}</p>

      {!comingSoon && !unlocked && (
        <p className="mt-s text-sm text-text-secondary">
          {PRACTICE_STAGE_LOCKED} ({totalEntries}/{entriesNeeded} entries)
        </p>
      )}

      {!comingSoon && unlocked && (
        <div className="mt-m" data-demo-target={startDemoTarget}>
          <PrimaryButton onClick={onSelect}>Start</PrimaryButton>
        </div>
      )}
    </article>
  );
}

export function PracticeLabScreen({
  readiness,
  totalEntries,
  onSelectStage,
  onGoToCheck,
  onGoToImport,
  error,
}: PracticeLabScreenProps) {
  return (
    <div className="mx-auto w-full max-w-content px-m pb-xl">
      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">Practice</h1>
        <p className="mt-xs text-sm text-text-secondary">{PRACTICE_TAB_SUBTITLE}</p>
      </header>

      {error && (
        <p className="mb-m rounded-lg bg-error/10 px-m py-s text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {!readiness.unlocked ? (
        <LockedPracticeView
          readiness={readiness}
          onGoToCheck={onGoToCheck}
          onGoToImport={onGoToImport}
        />
      ) : (
        <section className="space-y-m">
          <div className="rounded-card border border-primary/20 bg-primary/5 p-m" data-demo-target="practice-readiness">
            <p className="text-sm font-medium text-text-secondary">{PRACTICE_READINESS_TITLE}</p>
            <p className="mt-xs text-xl font-semibold text-text-primary">
              {readiness.score}% — {readiness.label}
            </p>
            <ReadinessBar score={readiness.score} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary">{PRACTICE_STAGES_TITLE}</h2>
            <div className="mt-m space-y-m" data-demo-target="practice-stages">
              {PRACTICE_STAGES.map((stage) => (
                <div
                  key={stage.id}
                  data-demo-target={
                    stage.id === 'quick'
                      ? 'practice-stage-spot-match'
                      : stage.id === 'sentence'
                        ? 'practice-stage-write'
                        : undefined
                  }
                >
                  <StageCard
                    emoji={stage.emoji}
                    title={stage.title}
                    exerciseLabel={stage.exerciseLabel}
                    description={stage.description}
                    comingSoon={stage.comingSoon}
                    entriesNeeded={stage.minEntries}
                    totalEntries={totalEntries}
                    unlocked={isStageUnlocked(stage.id, totalEntries, readiness)}
                    onSelect={() => onSelectStage(stage.id)}
                    startDemoTarget={
                      stage.id === 'quick' ? 'practice-stage-spot-match-start' : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
