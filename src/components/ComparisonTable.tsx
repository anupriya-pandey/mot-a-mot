import type { ReactNode } from 'react';
import { CEFR_LEVELS, CEFR_LEVEL_LABELS } from '../constants/cefrLevels';
import type { CorrectionChange } from '../types/analysis';
import { SectionHeader } from './SectionHeader';

interface ComparisonTableProps {
  changes: CorrectionChange[];
}

const LABEL_COL = '5.75rem';

function ChangeRow({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid items-start gap-x-m gap-y-xs ${className}`}
      style={{ gridTemplateColumns: `${LABEL_COL} minmax(0, 1fr)` }}
    >
      <span className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function LevelRow({ change, level }: { change: CorrectionChange; level: (typeof CEFR_LEVELS)[number] }) {
  const explanation = change.explanationsByLevel?.[level];

  return (
    <div
      className="grid items-start gap-x-m gap-y-xs border-t border-border/60 pt-m first:border-t-0 first:pt-0"
      style={{ gridTemplateColumns: `${LABEL_COL} minmax(0, 1fr)` }}
    >
      <div className="flex flex-col gap-xs pt-0.5">
        <span className="inline-flex w-[2.75rem] justify-center rounded-full bg-primary/10 px-s py-xs text-xs font-semibold text-primary">
          {level}
        </span>
        <span className="text-[10px] leading-tight text-text-secondary">{CEFR_LEVEL_LABELS[level]}</span>
      </div>
      <div className="min-w-0 space-y-s">
        <p className="break-words text-success leading-relaxed">{change.byLevel[level]}</p>
        {explanation && (
          <p className="break-words text-sm leading-relaxed text-text-secondary">{explanation}</p>
        )}
      </div>
    </div>
  );
}

export function ComparisonTable({ changes }: ComparisonTableProps) {
  if (changes.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader icon="📝" title="What Changed" />
      <p className="mb-m text-sm text-text-secondary">
        Your French buddy walks through each fix — informal first, then how it works at every DELF/DALF
        level.
      </p>
      <div className="space-y-l">
        {changes.map((change, index) => (
          <article
            key={index}
            className="rounded-card bg-surface p-m shadow-card space-y-m"
            aria-label={`Change ${index + 1}`}
          >
            <h3 className="text-sm font-semibold text-text-primary">
              Change {index + 1} of {changes.length}
            </h3>

            <div className="space-y-m">
              <ChangeRow label="You wrote">
                <p className="break-words leading-relaxed text-error">{change.youWrote}</p>
              </ChangeRow>

              <ChangeRow label="Informal">
                <p className="break-words leading-relaxed text-success">{change.informalFrench}</p>
                {change.informalExplanation && (
                  <p className="mt-s break-words text-sm leading-relaxed text-text-secondary">
                    {change.informalExplanation}
                  </p>
                )}
              </ChangeRow>
            </div>

            <div className="rounded-lg bg-background/60 p-m space-y-0">
              <p className="mb-m text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Formal by level
              </p>
              {CEFR_LEVELS.map((level) => (
                <LevelRow key={level} change={change} level={level} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
