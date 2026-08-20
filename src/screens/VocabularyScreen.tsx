import { ArrowLeft } from 'lucide-react';
import { SecondaryButton } from '../components/SecondaryButton';
import { VocabularyListItem } from '../components/VocabularyListItem';
import { GRAMMAR_GUIDES } from '../constants/grammarGuides';
import { TOOLBOX_EMPTY } from '../constants/microcopy';
import type { PartOfSpeech, VocabularyEntry } from '../types/toolbox';

interface VocabularyScreenProps {
  category: PartOfSpeech;
  entries: VocabularyEntry[];
  onBack: () => void;
  onDeleteEntry: (entry: VocabularyEntry) => void;
}

export function VocabularyScreen({ category, entries, onBack, onDeleteEntry }: VocabularyScreenProps) {
  const guide = GRAMMAR_GUIDES[category];

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <SecondaryButton onClick={onBack} className="mb-l">
        <span className="inline-flex items-center justify-center gap-s">
          <ArrowLeft className="h-4 w-4" />
          Back to Toolbox
        </span>
      </SecondaryButton>

      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">{category}</h1>
        <p className="mt-xs text-sm text-text-secondary">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your toolbox
        </p>
        <p className="mt-m rounded-card bg-surface p-m text-sm leading-relaxed text-text-secondary shadow-card">
          {guide.summary}
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-card bg-surface p-l text-sm text-text-secondary shadow-card whitespace-pre-line">
          {TOOLBOX_EMPTY}
        </p>
      ) : (
        <div className="space-y-m">
          {entries.map((entry) => (
            <VocabularyListItem
              key={`${entry.lemma}-${entry.meaning}-${entry.partOfSpeech}`}
              entry={entry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
