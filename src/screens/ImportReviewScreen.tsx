import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { candidateToVocabularyItem } from '../lib/categorizeImport';
import type {
  AmbiguousImportGroup,
  ImportCandidate,
  ImportReviewData,
  RelatedImportEntry,
} from '../types/import';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { PronunciationButton } from '../components/PronunciationButton';

interface ImportReviewScreenProps {
  review: ImportReviewData;
  onReviewChange: (review: ImportReviewData) => void;
  onConfirm: () => void;
  onBack: () => void;
  isImporting: boolean;
}

function EntryRow({
  candidate,
  prefix = '✓',
}: {
  candidate: ImportCandidate;
  prefix?: string;
}) {
  return (
    <div className="rounded-button border border-border bg-background px-m py-s">
      <div className="flex items-start gap-s">
        <span className="shrink-0 text-success" aria-hidden>
          {prefix}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-s">
            <p className="font-medium text-text-primary">{candidate.lemma}</p>
            <PronunciationButton text={candidate.lemma} size="compact" ariaLabel={`Hear ${candidate.lemma}`} />
          </div>
          <p className="text-sm text-text-secondary">{candidate.partOfSpeech}</p>
          <p className="text-sm text-text-secondary">{candidate.meaning}</p>
        </div>
      </div>
    </div>
  );
}

function AmbiguousSection({
  group,
  onToggle,
}: {
  group: AmbiguousImportGroup;
  onToggle: (optionId: string) => void;
}) {
  return (
    <article className="rounded-card bg-surface p-m shadow-card space-y-m">
      <div>
        <p className="font-semibold text-text-primary">{group.lemma}</p>
        <p className="mt-xs text-sm text-text-secondary">
          We found multiple valid meanings. Select the ones you&apos;d like to save.
        </p>
      </div>
      <ul className="space-y-s">
        {group.options.map((option) => (
          <li key={option.id}>
            <label className="flex cursor-pointer items-start gap-m rounded-button border border-border bg-background px-m py-s">
              <input
                type="checkbox"
                checked={option.selected}
                onChange={() => onToggle(option.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-s">
                  <p className="font-medium text-text-primary">{option.partOfSpeech}</p>
                  <PronunciationButton text={option.lemma} size="compact" ariaLabel={`Hear ${option.lemma}`} />
                </div>
                <p className="text-sm text-text-secondary">{option.meaning}</p>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RelatedSection({
  entry,
  onToggle,
}: {
  entry: RelatedImportEntry;
  onToggle: (relatedId: string) => void;
}) {
  const { existing, relatedEntries } = entry;

  return (
    <article className="rounded-card bg-surface p-m shadow-card space-y-m">
      <div>
        <p className="text-sm font-medium text-primary">✏️ Related to an entry you already have</p>
        <div className="mt-xs flex items-center gap-s">
          <p className="font-semibold text-text-primary">{existing.lemma}</p>
          <PronunciationButton text={existing.lemma} size="compact" ariaLabel={`Hear ${existing.lemma}`} />
        </div>
        <p className="text-sm text-text-secondary">
          {existing.partOfSpeech} · {existing.meaning} — already saved
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-text-primary">New entries to save separately:</p>
        <ul className="mt-s space-y-s">
          {relatedEntries.map((related) => (
            <li key={related.id}>
              <label className="flex cursor-pointer items-start gap-m rounded-button border border-border bg-background px-m py-s">
                <input
                  type="checkbox"
                  checked={related.selected}
                  onChange={() => onToggle(related.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-s">
                    <p className="font-medium text-text-primary">{related.lemma}</p>
                    <PronunciationButton text={related.lemma} size="compact" ariaLabel={`Hear ${related.lemma}`} />
                  </div>
                  <p className="text-sm text-text-secondary">{related.partOfSpeech}</p>
                  <p className="text-sm text-text-secondary">{related.meaning}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function ImportReviewScreen({
  review,
  onReviewChange,
  onConfirm,
  onBack,
  isImporting,
}: ImportReviewScreenProps) {
  const [showExisting, setShowExisting] = useState(false);

  const confirmationSummary = useMemo(() => {
    const selectedAmbiguous = review.ambiguous.flatMap((group) =>
      group.options.filter((option) => option.selected),
    );
    const selectedRelated = review.related.flatMap((group) =>
      group.relatedEntries.filter((entry) => entry.selected),
    );

    return {
      newCount: review.ready.length + selectedAmbiguous.length + selectedRelated.length,
      skippedCount: review.alreadyIn.length,
      ambiguousCount: review.ambiguous.length,
      relatedCount: review.summary.relatedCount,
      totalReviewed: review.summary.totalReviewed,
    };
  }, [review]);

  const toggleAmbiguous = (lemma: string, optionId: string) => {
    onReviewChange({
      ...review,
      ambiguous: review.ambiguous.map((group) =>
        group.lemma !== lemma
          ? group
          : {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, selected: !option.selected } : option,
              ),
            },
      ),
    });
  };

  const toggleRelated = (groupId: string, relatedId: string) => {
    onReviewChange({
      ...review,
      related: review.related.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              relatedEntries: group.relatedEntries.map((entry) =>
                entry.id === relatedId ? { ...entry, selected: !entry.selected } : entry,
              ),
            },
      ),
    });
  };

  const hasAnythingToImport =
    review.ready.length > 0 ||
    review.ambiguous.some((group) => group.options.some((option) => option.selected)) ||
    review.related.some((group) => group.relatedEntries.some((entry) => entry.selected));

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl pb-xxl">
      <SecondaryButton onClick={onBack} className="mb-l">
        <span className="inline-flex items-center justify-center gap-s">
          <ArrowLeft className="h-4 w-4" />
          Back
        </span>
      </SecondaryButton>

      <section className="mb-l rounded-card bg-surface p-l shadow-card" aria-labelledby="import-summary" data-demo-target="toolbox-import-summary">
        <h1 id="import-summary" className="text-xl font-semibold text-text-primary">
          We found:
        </h1>
        <ul className="mt-m space-y-s text-base text-text-primary">
          <li>✓ {confirmationSummary.newCount} new entries</li>
          <li>↺ {confirmationSummary.skippedCount} already in your toolbox</li>
          {confirmationSummary.ambiguousCount > 0 && (
            <li>❓ {confirmationSummary.ambiguousCount} entries with multiple meanings</li>
          )}
          {confirmationSummary.relatedCount > 0 && (
            <li>✏️ {confirmationSummary.relatedCount} new entries related to what you already have</li>
          )}
        </ul>
      </section>

      {review.ready.length > 0 && (
        <section className="mb-l" aria-labelledby="ready-import" data-demo-target="toolbox-import-ready">
          <h2 id="ready-import" className="mb-m text-lg font-semibold text-text-primary">
            Ready to Import
          </h2>
          <div className="space-y-s">
            {review.ready.map((candidate) => (
              <EntryRow key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </section>
      )}

      {review.alreadyIn.length > 0 && (
        <section className="mb-l" aria-labelledby="already-in" data-demo-target="toolbox-import-duplicates">
          <button
            type="button"
            id="already-in"
            onClick={() => setShowExisting((open) => !open)}
            className="flex w-full items-center justify-between rounded-card bg-surface px-m py-s text-center shadow-card md:text-left"
          >
            <span className="font-semibold text-text-primary">
              Already in Toolbox ({review.alreadyIn.length})
            </span>
            {showExisting ? (
              <ChevronUp className="h-5 w-5 text-text-secondary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-text-secondary" />
            )}
          </button>
          {showExisting && (
            <div className="mt-s space-y-s">
              {review.alreadyIn.map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-button border border-border bg-background px-m py-s text-sm text-text-secondary"
                >
                  ↺ {candidate.lemma} · {candidate.partOfSpeech} — Already saved.
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {review.ambiguous.length > 0 && (
        <section className="mb-l space-y-m" aria-labelledby="ambiguous-import" data-demo-target="toolbox-import-ambiguous">
          <h2 id="ambiguous-import" className="text-lg font-semibold text-text-primary">
            Multiple Meanings
          </h2>
          {review.ambiguous.map((group) => (
            <AmbiguousSection
              key={group.lemma}
              group={group}
              onToggle={(optionId) => toggleAmbiguous(group.lemma, optionId)}
            />
          ))}
        </section>
      )}

      {review.related.length > 0 && (
        <section className="mb-l space-y-m" aria-labelledby="related-import">
          <h2 id="related-import" className="text-lg font-semibold text-text-primary">
            Related to Your Toolbox
          </h2>
          <p className="text-sm text-text-secondary">
            These will be saved as new separate entries — your existing entries stay unchanged.
          </p>
          {review.related.map((entry) => (
            <RelatedSection
              key={entry.id}
              entry={entry}
              onToggle={(relatedId) => toggleRelated(entry.id, relatedId)}
            />
          ))}
        </section>
      )}

      <section className="sticky bottom-0 -mx-m border-t border-border bg-background/95 px-m py-l backdrop-blur">
        <p className="mb-m text-center text-sm text-text-secondary">
          {confirmationSummary.totalReviewed} entries reviewed · ✓ {confirmationSummary.newCount} new · ↺{' '}
          {confirmationSummary.skippedCount} skipped
          {confirmationSummary.ambiguousCount > 0 &&
            ` · ❓ ${confirmationSummary.ambiguousCount} with multiple meanings`}
        </p>
        <PrimaryButton
          onClick={onConfirm}
          loading={isImporting}
          disabled={!hasAnythingToImport}
          data-demo-target="toolbox-import-confirm"
        >
          Import to Toolbox
        </PrimaryButton>
      </section>
    </div>
  );
}

export function collectSelectedImportItems(review: ImportReviewData) {
  const selectedAmbiguous = review.ambiguous.flatMap((group) =>
    group.options.filter((option) => option.selected),
  );
  const selectedRelated = review.related.flatMap((group) =>
    group.relatedEntries.filter((entry) => entry.selected),
  );

  return [
    ...review.ready.map(candidateToVocabularyItem),
    ...selectedAmbiguous.map(candidateToVocabularyItem),
    ...selectedRelated.map(candidateToVocabularyItem),
  ];
}
