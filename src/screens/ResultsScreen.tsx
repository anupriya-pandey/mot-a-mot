import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ClarificationPanel } from '../components/ClarificationPanel';
import { InformationCard } from '../components/InformationCard';
import { PracticeReflectionPanel } from '../components/PracticeReflectionPanel';
import { RatingBar } from '../components/RatingBar';
import { SecondaryButton } from '../components/SecondaryButton';
import { SectionHeader } from '../components/SectionHeader';
import { SpeakingSuggestion } from '../components/SpeakingSuggestion';
import { WhyTheseChangesSection } from '../components/WhyTheseChangesSection';
import { WritingSuggestions } from '../components/WritingSuggestions';
import { SuggestedToolkitAdditions } from '../components/SuggestedToolkitAdditions';
import { SCORES_ENGLISH_CLARIFICATION, SCORES_FRENCH_NOTE, NEW_VOCAB_HINT } from '../constants/microcopy';
import type { AnalysisResult, ClarificationInput, SentenceLanguage, VocabularyItem } from '../types/analysis';
import type { PracticeReflection } from '../types/practice';

interface ResultsScreenProps {
  result: AnalysisResult;
  displaySentence: string;
  sentenceLanguage: SentenceLanguage;
  onCheckAnother: () => void;
  onClarify: (clarification: ClarificationInput) => Promise<boolean>;
  isClarifying: boolean;
  clarificationError: string | null;
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean;
  onAddToToolbox: (item: VocabularyItem) => void;
  mode?: 'check' | 'practice';
  practiceReflection?: PracticeReflection | null;
  onAddPracticeExpression?: () => void;
  practiceExpressionAdded?: boolean;
  footerLabel?: string;
  onFooter?: () => void;
}

export function ResultsScreen({
  result,
  displaySentence,
  sentenceLanguage,
  onCheckAnother,
  onClarify,
  isClarifying,
  clarificationError,
  isInToolbox,
  onAddToToolbox,
  mode = 'check',
  practiceReflection,
  onAddPracticeExpression,
  practiceExpressionAdded,
  footerLabel,
  onFooter,
}: ResultsScreenProps) {
  const [showClarification, setShowClarification] = useState(false);

  const isEnglishDisplay = sentenceLanguage === 'english';
  const grammarScore = isEnglishDisplay ? 0 : result.ratings.grammar;
  const naturalnessScore = isEnglishDisplay ? 0 : result.ratings.naturalness;

  const handleClarifySubmit = async (clarification: ClarificationInput) => {
    const success = await onClarify(clarification);
    if (success) setShowClarification(false);
  };

  const hasSuggestedVocab = (result.suggestedAdditions?.length ?? 0) > 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <div className="space-y-l">
        {hasSuggestedVocab && (
          <p
            className="rounded-card border border-border bg-background px-m py-s text-sm leading-relaxed text-text-secondary"
            role="note"
          >
            {NEW_VOCAB_HINT}
          </p>
        )}

        <InformationCard icon="✏️" title="Your Sentence">
          {displaySentence}
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
            <SpeakingSuggestion
              sentence={result.suggestions.speaking.sentence}
              english={result.suggestions.speaking.english ?? result.understood}
              changes={result.changes}
            />
            <WritingSuggestions writing={result.suggestions.writing} changes={result.changes} />
          </div>
        </section>

        <WhyTheseChangesSection
          speakingExplanation={result.explanations.speaking}
          writingByStyle={result.suggestions.writing}
          explanationsByStyle={result.explanations.writing}
        />

        <section className="space-y-m" aria-labelledby="your-sentence-scores">
          <div>
            <h2 id="your-sentence-scores" className="text-lg font-semibold text-text-primary">
              Your Sentence Scores
            </h2>
            <p className="mt-xs text-sm text-text-secondary">
              {isEnglishDisplay ? SCORES_ENGLISH_CLARIFICATION : SCORES_FRENCH_NOTE}
            </p>
          </div>
          <RatingBar label="Grammar" value={grammarScore} />
          <RatingBar label="Naturalness" value={naturalnessScore} />
        </section>

        <SuggestedToolkitAdditions
          items={result.suggestedAdditions ?? []}
          isInToolbox={isInToolbox}
          onAdd={onAddToToolbox}
        />

        {mode === 'practice' && practiceReflection && (
          <PracticeReflectionPanel
            reflection={practiceReflection}
            onAddExpression={
              practiceReflection.newExpression ? onAddPracticeExpression : undefined
            }
            expressionAdded={practiceExpressionAdded}
          />
        )}

        <SecondaryButton onClick={mode === 'practice' && onFooter ? onFooter : onCheckAnother}>
          <span className="inline-flex items-center justify-center gap-s">
            {mode === 'practice' ? null : <Sparkles className="h-4 w-4" />}
            {footerLabel ?? (mode === 'practice' ? 'Next Question →' : 'Check Another Sentence')}
          </span>
        </SecondaryButton>
      </div>
    </div>
  );
}
