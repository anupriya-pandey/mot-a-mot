import type { ReactNode } from 'react';
import { WRITING_STYLES, WRITING_STYLE_LABELS } from '../constants/writingStyles';
import { NO_CHANGE_FORMAL_PHRASE } from '../constants/microcopy';
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

function WritingChangeSlide({
  change,
  style,
}: {
  change: CorrectionChange;
  style: (typeof WRITING_STYLES)[number];
}) {
  const phrase = change.byStyle[style]?.trim();
  const explanation = change.explanationsByStyle?.[style];

  return (
    <div className="rounded-lg bg-background/60 p-m mx-1 min-h-[5rem]">
      {phrase ? (
        <p className="break-words leading-relaxed text-success">{phrase}</p>
      ) : (
        <p className="text-sm italic leading-relaxed text-text-secondary">{NO_CHANGE_FORMAL_PHRASE}</p>
      )}
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
        Each fix shows everyday speaking first, then writing styles — swipe to compare Simple, Natural, and Refined.
      </p>
      <div className="space-y-l">
        {changes.map((change, index) => {
          const writingSlides = WRITING_STYLES.map((style) => ({
            key: style,
            badge: WRITING_STYLE_LABELS[style],
            subtitle: 'Writing',
            content: <WritingChangeSlide change={change} style={style} />,
          }));

          const speakingPhrase = change.speakingFrench || change.informalFrench || '';

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

                <ChangeRow label="Speaking">
                  <p className="break-words leading-relaxed text-success">{speakingPhrase}</p>
                  {(change.speakingExplanation || change.informalExplanation) && (
                    <p className="mt-s break-words text-sm leading-relaxed text-text-secondary">
                      {change.speakingExplanation || change.informalExplanation}
                    </p>
                  )}
                </ChangeRow>
              </div>

              <div>
                <p className="mb-s text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Writing by style
                </p>
                <SwipeCarousel slides={writingSlides} ariaLabel={`Change ${index + 1} writing styles`} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
