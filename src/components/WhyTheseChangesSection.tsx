import { CEFR_LEVELS, CEFR_LEVEL_LABELS } from '../constants/cefrLevels';
import { NO_CHANGE_AT_LEVEL } from '../constants/microcopy';
import type { CefrLevel, FormalByLevel } from '../types/analysis';
import { InformationCard } from './InformationCard';
import { SwipeCarousel } from './SwipeCarousel';

interface WhyTheseChangesSectionProps {
  informalExplanation: string;
  formalByLevel: FormalByLevel;
  explanationsByLevel: Record<CefrLevel, string>;
}

export function WhyTheseChangesSection({
  informalExplanation,
  formalByLevel,
  explanationsByLevel,
}: WhyTheseChangesSectionProps) {
  const formalSlides = CEFR_LEVELS.map((level) => ({
    key: level,
    badge: `Formal ${level}`,
    subtitle: CEFR_LEVEL_LABELS[level],
    content: (
      <div className="rounded-lg bg-background/60 p-m space-y-s min-h-[8rem]">
        {formalByLevel[level].noChangeNeeded && (
          <p className="text-sm font-medium text-success">✓ {NO_CHANGE_AT_LEVEL}</p>
        )}
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">In scope at this level: </span>
          {formalByLevel[level].limitation}
        </p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
          {explanationsByLevel[level]?.trim() || 'No overview available for this level.'}
        </p>
      </div>
    ),
  }));

  return (
    <InformationCard icon="📚" title="Why These Changes?">
      <div className="space-y-l">
        <div>
          <h3 className="mb-xs font-semibold text-text-primary">Informal</h3>
          <p className="whitespace-pre-line leading-relaxed text-sm">{informalExplanation}</p>
        </div>

        <div>
          <h3 className="mb-m font-semibold text-text-primary">Formal by DELF/DALF level</h3>
          <SwipeCarousel slides={formalSlides} ariaLabel="Why these changes formal levels" />
        </div>
      </div>
    </InformationCard>
  );
}
