import { StyleChangesCarousel } from './StyleChangesCarousel';
import { EVERYDAY_FRENCH_SUBTITLE } from '../constants/writingStyles';
import type { CorrectionChange } from '../types/analysis';
import { getChangesForSpeaking } from '../lib/writingChangeDisplay';
import { SuggestedMessageCard } from './SuggestedMessageCard';

interface SpeakingSuggestionProps {
  sentence: string;
  english?: string;
  changes: CorrectionChange[];
  originalSentence?: string;
}

export function SpeakingSuggestion({
  sentence,
  english,
  changes,
  originalSentence,
}: SpeakingSuggestionProps) {
  return (
    <div className="space-y-m">
      <SuggestedMessageCard sentence={sentence} english={english} />
      <div className="rounded-card bg-surface p-m shadow-card">
        <StyleChangesCarousel
          changes={getChangesForSpeaking(changes)}
          styleLabel={EVERYDAY_FRENCH_SUBTITLE}
          originalSentence={originalSentence}
          styleSentence={sentence}
          getFixDisplay={(change) => {
            const phrase = (change.speakingFrench || change.informalFrench)?.trim();
            return phrase ? { phrase } : null;
          }}
          getExplanation={(change) => change.speakingExplanation || change.informalExplanation}
          ariaLabel="What changed for everyday French conversation"
        />
      </div>
    </div>
  );
}
