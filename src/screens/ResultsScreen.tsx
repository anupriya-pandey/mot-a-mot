import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ClarificationPanel } from '../components/ClarificationPanel';
import { ComparisonTable } from '../components/ComparisonTable';
import { InformationCard } from '../components/InformationCard';
import { RatingBar } from '../components/RatingBar';
import { SecondaryButton } from '../components/SecondaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { SuggestedMessageCard } from '../components/SuggestedMessageCard';
import type { AnalysisResult, ClarificationInput } from '../types/analysis';

interface ResultsScreenProps {
  result: AnalysisResult;
  originalSentence: string;
  onCheckAnother: () => void;
  onClarify: (clarification: ClarificationInput) => Promise<boolean>;
  isClarifying: boolean;
  clarificationError: string | null;
}

export function ResultsScreen({
  result,
  originalSentence,
  onCheckAnother,
  onClarify,
  isClarifying,
  clarificationError,
}: ResultsScreenProps) {
  const [showClarification, setShowClarification] = useState(false);

  const handleClarifySubmit = async (clarification: ClarificationInput) => {
    const success = await onClarify(clarification);
    if (success) setShowClarification(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <div className="space-y-l">
        <InformationCard icon="✏️" title="Your Sentence">
          {originalSentence}
        </InformationCard>

        <InformationCard icon="🇬🇧" title="What I Understood">
          <div className="space-y-m">
            <p>{result.understood}</p>
            {!showClarification && (
              <SecondaryButton onClick={() => setShowClarification(true)}>
                That&apos;s Not What I Meant
              </SecondaryButton>
            )}
          </div>
        </InformationCard>

        {showClarification && (
          <ClarificationPanel
            onSubmit={handleClarifySubmit}
            isSubmitting={isClarifying}
            error={clarificationError}
          />
        )}

        <section aria-labelledby="suggested-messages">
          <SectionHeader icon="💬" title="Suggested Messages" />
          <div className="space-y-l">
            <SuggestedMessageCard
              variant="informal"
              sentence={result.suggestions.informal.sentence}
            />
            <SuggestedMessageCard variant="formal" sentence={result.suggestions.formal.sentence} />
          </div>
        </section>

        <ComparisonTable changes={result.changes} />

        <InformationCard icon="📚" title="Why These Changes?">
          <div className="space-y-m">
            <div>
              <h3 className="mb-xs font-semibold text-text-primary">Informal Explanation</h3>
              <p className="whitespace-pre-line">{result.explanations.informal}</p>
            </div>
            <div>
              <h3 className="mb-xs font-semibold text-text-primary">Formal Explanation</h3>
              <p className="whitespace-pre-line">{result.explanations.formal}</p>
            </div>
          </div>
        </InformationCard>

        <section className="space-y-m" aria-labelledby="your-sentence-scores">
          <div>
            <h2 id="your-sentence-scores" className="text-lg font-semibold text-text-primary">
              Your Sentence Scores
            </h2>
            <p className="mt-xs text-sm text-text-secondary">
              These ratings score what you wrote — not the corrected versions above.
            </p>
          </div>
          <RatingBar label="Grammar" value={result.ratings.grammar} />
          <RatingBar label="Naturalness" value={result.ratings.naturalness} />
        </section>

        <SecondaryButton onClick={onCheckAnother}>
          <span className="inline-flex items-center justify-center gap-s">
            <Sparkles className="h-4 w-4" />
            Check Another Sentence
          </span>
        </SecondaryButton>
      </div>
    </div>
  );
}
