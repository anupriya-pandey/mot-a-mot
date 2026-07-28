import { Copy, Sparkles } from 'lucide-react';
import { ComparisonTable } from '../components/ComparisonTable';
import { StatusBanner } from '../components/StatusBanner';
import { InformationCard } from '../components/InformationCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { RatingBar } from '../components/RatingBar';
import { SecondaryButton } from '../components/SecondaryButton';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import type { AnalysisResult } from '../types/analysis';

interface ResultsScreenProps {
  result: AnalysisResult;
  originalSentence: string;
  onCheckAnother: () => void;
}

export function ResultsScreen({ result, originalSentence, onCheckAnother }: ResultsScreenProps) {
  const { copied, error: copyError, copy } = useCopyToClipboard();

  const handleCopy = () => {
    void copy(result.correctedSentence);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <div className="space-y-l">
        <InformationCard icon="✏️" title="Your Sentence">
          {originalSentence}
        </InformationCard>

        <InformationCard icon="🇬🇧" title="What I Understood">
          <div className="space-y-s">
            <p>
              <span className="font-medium text-text-secondary">Literal: </span>
              {result.understood}
            </p>
            {result.everydayMeaning && (
              <p>
                <span className="font-medium text-text-secondary">In everyday French: </span>
                {result.everydayMeaning}
              </p>
            )}
          </div>
        </InformationCard>

        <InformationCard
          icon="✅"
          title="Ready to Send"
          highlight="success"
          action={
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full p-1 text-text-secondary transition-colors hover:text-primary"
              aria-label="Copy corrected sentence"
            >
              <Copy className="h-4 w-4" />
            </button>
          }
        >
          {result.correctedSentence}
        </InformationCard>

        <PrimaryButton onClick={handleCopy} success={copied}>
          Copy Message
        </PrimaryButton>

        {copyError && <StatusBanner type="error" message={copyError} />}

        <ComparisonTable changes={result.changes} />

        {result.grammarNotes && (
          <InformationCard icon="📚" title="Why These Changes?">
            {result.grammarNotes}
          </InformationCard>
        )}

        <section className="space-y-m" aria-labelledby="your-sentence-scores">
          <div>
            <h2 id="your-sentence-scores" className="text-lg font-semibold text-text-primary">
              Your Sentence Scores
            </h2>
            <p className="mt-xs text-sm text-text-secondary">
              These ratings score what you wrote — not the corrected version above.
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
