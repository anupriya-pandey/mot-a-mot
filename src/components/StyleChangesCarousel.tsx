import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  CHANGE_CARRIES_FROM_LAYER,
  COMPARE_WITH_ORIGINAL,
  HIDE_ORIGINAL_COMPARISON,
  NO_CHANGE_AT_LAYER,
  STYLE_VERSION_LABEL,
  YOUR_ORIGINAL_LABEL,
} from '../constants/microcopy';
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
  originalSentence?: string;
  styleSentence?: string;
}

export function StyleChangesCarousel({
  changes,
  styleLabel,
  getFixDisplay,
  getExplanation,
  ariaLabel,
  originalSentence,
  styleSentence,
}: StyleChangesCarouselProps) {
  const [showFullComparison, setShowFullComparison] = useState(false);
  const canCompare =
    Boolean(originalSentence?.trim()) &&
    Boolean(styleSentence?.trim()) &&
    originalSentence?.trim() !== styleSentence?.trim();

  if (changes.length === 0) {
    return (
      <div className="space-y-s">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">What changed</p>
        {canCompare && (
          <ComparisonToggle
            show={showFullComparison}
            onToggle={() => setShowFullComparison((current) => !current)}
          />
        )}
        {showFullComparison && canCompare && (
          <FullSentenceComparison
            originalSentence={originalSentence!}
            styleSentence={styleSentence!}
            styleLabel={styleLabel}
          />
        )}
        <p className="text-sm text-text-secondary">
          No changes needed — your sentence already works for {styleLabel.toLowerCase()}.
        </p>
      </div>
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
      {canCompare && (
        <ComparisonToggle
          show={showFullComparison}
          onToggle={() => setShowFullComparison((current) => !current)}
        />
      )}
      {showFullComparison && canCompare && (
        <FullSentenceComparison
          originalSentence={originalSentence!}
          styleSentence={styleSentence!}
          styleLabel={styleLabel}
        />
      )}
      <SwipeCarousel slides={slides} ariaLabel={ariaLabel} />
    </div>
  );
}

function ComparisonToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      {show ? HIDE_ORIGINAL_COMPARISON : COMPARE_WITH_ORIGINAL}
    </button>
  );
}

function FullSentenceComparison({
  originalSentence,
  styleSentence,
  styleLabel,
}: {
  originalSentence: string;
  styleSentence: string;
  styleLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-m rounded-lg border border-border bg-background/60 p-m sm:grid-cols-2">
      <div className="min-w-0 space-y-xs">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {YOUR_ORIGINAL_LABEL}
        </p>
        <p className="whitespace-pre-line break-words leading-relaxed text-error">{originalSentence}</p>
      </div>
      <div className="min-w-0 space-y-xs sm:border-l sm:border-border sm:pl-m">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {STYLE_VERSION_LABEL(styleLabel)}
        </p>
        <div className="flex items-start gap-s">
          <p className="flex-1 whitespace-pre-line break-words leading-relaxed text-success">
            {styleSentence}
          </p>
          <PronunciationButton
            text={styleSentence}
            size="compact"
            ariaLabel={`Hear ${styleLabel} version`}
          />
        </div>
      </div>
    </div>
  );
}
