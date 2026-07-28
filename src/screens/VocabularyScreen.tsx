import { ArrowLeft } from 'lucide-react';
import { SecondaryButton } from '../components/SecondaryButton';
import { VocabularyListItem } from '../components/VocabularyListItem';
import { TOOLBOX_EMPTY } from '../constants/microcopy';
import type { PartOfSpeech, VocabularyEntry } from '../types/toolbox';

interface VocabularyScreenProps {
  category: PartOfSpeech;
  entries: VocabularyEntry[];
  onBack: () => void;
}

export function VocabularyScreen({ category, entries, onBack }: VocabularyScreenProps) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <SecondaryButton onClick={onBack} className="mb-l">
        <span className="inline-flex items-center justify-center gap-s">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </span>
      </SecondaryButton>

      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">{category}</h1>
        <p className="mt-xs text-sm text-text-secondary">
          {entries.length} {entries.length === 1 ? 'word' : 'words'} in your toolbox
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-card bg-surface p-l text-sm text-text-secondary shadow-card whitespace-pre-line">
          {TOOLBOX_EMPTY}
        </p>
      ) : (
        <div className="space-y-m">
          {entries.map((entry) => (
            <VocabularyListItem key={`${entry.lemma}-${entry.meaning}-${entry.partOfSpeech}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
