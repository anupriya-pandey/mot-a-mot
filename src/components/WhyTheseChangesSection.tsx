import { WRITING_STYLES, WRITING_STYLE_LABELS } from '../constants/writingStyles';
import { PARTIAL_MEANING_AT_LEVEL, SAME_AS_PREVIOUS_STYLE } from '../constants/microcopy';
import type { WritingByStyle } from '../types/analysis';
import { InformationCard } from './InformationCard';

interface WhyTheseChangesSectionProps {
  speakingExplanation: string;
  writingByStyle: WritingByStyle;
  explanationsByStyle: Record<(typeof WRITING_STYLES)[number], string>;
}

export function WhyTheseChangesSection({
  speakingExplanation,
  writingByStyle,
  explanationsByStyle,
}: WhyTheseChangesSectionProps) {
  return (
    <InformationCard icon="📚" title="Why These Changes?">
      <div className="space-y-l">
        <div>
          <h3 className="mb-xs font-semibold text-text-primary">Everyday French (Speaking)</h3>
          <p className="whitespace-pre-line leading-relaxed text-sm">{speakingExplanation}</p>
        </div>

        <div className="space-y-m">
          <h3 className="font-semibold text-text-primary">Writing</h3>
          {WRITING_STYLES.map((style, index) => {
            const item = writingByStyle[style];
            const previousLabel = index > 0 ? WRITING_STYLE_LABELS[WRITING_STYLES[index - 1]] : undefined;

            return (
              <div key={style} className="rounded-lg bg-background/60 p-m space-y-s">
                <h4 className="font-medium text-text-primary">{WRITING_STYLE_LABELS[style]} Writing</h4>
                {item.sameAsPrevious && previousLabel && (
                  <p className="text-sm font-medium text-success">
                    ✓ {SAME_AS_PREVIOUS_STYLE.replace('{style}', previousLabel)}
                  </p>
                )}
                {item.coversFullMeaning === false && (
                  <p className="text-sm font-medium text-text-primary">{PARTIAL_MEANING_AT_LEVEL}</p>
                )}
                {item.note?.trim() && (
                  <p className="text-sm text-text-secondary">{item.note.trim()}</p>
                )}
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
                  {explanationsByStyle[style]?.trim() || item.explanation?.trim() || 'No overview available.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </InformationCard>
  );
}
