import { StyleChangesCarousel } from './StyleChangesCarousel';
import type { CorrectionChange } from '../types/analysis';
import { SuggestedMessageCard } from './SuggestedMessageCard';

interface SpeakingSuggestionProps {
  sentence: string;
  english?: string;
  changes: CorrectionChange[];
}

export function SpeakingSuggestion({ sentence, english, changes }: SpeakingSuggestionProps) {
  return (
    <div className="space-y-m">
      <SuggestedMessageCard sentence={sentence} english={english} />
      <div className="rounded-card bg-surface p-m shadow-card">
        <StyleChangesCarousel
          changes={changes}
          styleLabel="Speaking"
          getFixPhrase={(change) => change.speakingFrench || change.informalFrench}
          getExplanation={(change) => change.speakingExplanation || change.informalExplanation}
          ariaLabel="What changed for everyday speaking"
        />
      </div>
    </div>
  );
}
