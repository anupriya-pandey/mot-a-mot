import type { ReactNode } from 'react';
import { CEFR_LEVELS, CEFR_LEVEL_LABELS } from '../constants/cefrLevels';
import type { CorrectionChange } from '../types/analysis';
import { SectionHeader } from './SectionHeader';
import { SwipeCarousel } from './SwipeCarousel';

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

function FormalChangeSlide({ change, level }: { change: CorrectionChange; level: (typeof CEFR_LEVELS)[number] }) {
  const explanation = change.explanationsByLevel?.[level];

  return (
    <div className="rounded-lg bg-background/60 p-m mx-1 min-h-[5rem]">
      <p className="break-words leading-relaxed text-success">{change.byLevel[level]}</p>
      {explanation && (
        <p className="mt-s break-words text-sm leading-relaxed text-text-secondary">{explanation}</p>
      )}
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
        Each fix shows informal first, then formal DELF/DALF levels — swipe right to move from A1 to C2.
      </p>
      <div className="space-y-l">
        {changes.map((change, index) => {
          const formalSlides = CEFR_LEVELS.map((level) => ({
            key: level,
            badge: `Formal ${level}`,
            subtitle: CEFR_LEVEL_LABELS[level],
            content: <FormalChangeSlide change={change} level={level} />,
          }));

          return (
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

              <div>
                <p className="mb-s text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Formal by level
                </p>
                <SwipeCarousel
                  slides={formalSlides}
                  ariaLabel={`Change ${index + 1} formal levels`}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
