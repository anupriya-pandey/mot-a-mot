import type { ReactNode } from 'react';
import { CHANGE_CARRIES_FROM_LAYER, NO_CHANGE_AT_LAYER } from '../constants/microcopy';
import type { CorrectionChange } from '../types/analysis';
import type { FixPhraseDisplay } from '../lib/writingChangeDisplay';
import { PronunciationButton } from './PronunciationButton';
import { SwipeCarousel } from './SwipeCarousel';

const LABEL_COL = '5.75rem';

function ChangeRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid items-start gap-x-m gap-y-xs"
      style={{ gridTemplateColumns: `${LABEL_COL} minmax(0, 1fr)` }}
    >
      <span className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface StyleChangesCarouselProps {
  changes: CorrectionChange[];
  styleLabel: string;
  getFixDisplay: (change: CorrectionChange) => FixPhraseDisplay | null;
  getExplanation: (change: CorrectionChange) => string | undefined;
  ariaLabel: string;
}

export function StyleChangesCarousel({
  changes,
  styleLabel,
  getFixDisplay,
  getExplanation,
  ariaLabel,
}: StyleChangesCarouselProps) {
  if (changes.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No changes needed — your sentence already works for {styleLabel.toLowerCase()}.
      </p>
    );
  }

  const slides = changes.map((change, index) => {
    const fix = getFixDisplay(change);
    const explanation = getExplanation(change);

    return {
      key: String(index),
      badge: `Change ${index + 1}`,
      subtitle: `of ${changes.length}`,
      content: (
        <div className="rounded-lg bg-background/60 p-m mx-1 min-h-[5rem] space-y-m">
          <ChangeRow label="You wrote">
            <p className="break-words leading-relaxed text-error">{change.youWrote}</p>
          </ChangeRow>
          <ChangeRow label={styleLabel}>
            {fix?.phrase ? (
              <>
                <div className="flex items-start gap-s">
                  <p className="flex-1 break-words leading-relaxed text-success">{fix.phrase}</p>
                  <PronunciationButton
                    text={fix.phrase}
                    size="compact"
                    ariaLabel={`Hear corrected French: ${fix.phrase}`}
                  />
                </div>
                {fix.carryOverFrom && (
                  <p className="mt-s text-sm italic leading-relaxed text-text-secondary">
                    {CHANGE_CARRIES_FROM_LAYER(fix.carryOverFrom)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm italic leading-relaxed text-text-secondary">
                {NO_CHANGE_AT_LAYER}
              </p>
            )}
            {explanation && (
              <p className="mt-s break-words text-sm leading-relaxed text-text-secondary">
                {explanation}
              </p>
            )}
          </ChangeRow>
        </div>
      ),
    };
  });

  return (
    <div className="space-y-s">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">What changed</p>
      <SwipeCarousel slides={slides} ariaLabel={ariaLabel} />
    </div>
  );
}
