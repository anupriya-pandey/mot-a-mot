import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { VocabularyItem } from '../types/analysis';
import { PronunciationButton } from './PronunciationButton';

interface SuggestedToolkitAdditionsProps {
  items: VocabularyItem[];
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean;
  onAdd: (item: VocabularyItem) => void;
}

function itemKey(item: VocabularyItem): string {
  return `${item.lemma.toLowerCase()}|${item.partOfSpeech.toLowerCase()}`;
}

export function SuggestedToolkitAdditions({
  items,
  isInToolbox,
  onAdd,
}: SuggestedToolkitAdditionsProps) {
  const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set());

  const visibleItems = items.filter((item) => {
    const key = itemKey(item);
    return !addedKeys.has(key) && !isInToolbox(item.lemma, item.partOfSpeech);
  });

  if (visibleItems.length === 0) return null;

  const handleAdd = (item: VocabularyItem) => {
    onAdd(item);
    setAddedKeys((prev) => new Set(prev).add(itemKey(item)));
  };

  return (
    <section className="rounded-card bg-surface p-l shadow-card" aria-labelledby="toolkit-additions">
      <h2 id="toolkit-additions" className="text-lg font-semibold text-text-primary">
        Add to your French toolkit?
      </h2>
      <p className="mt-xs text-sm text-text-secondary">
        These words were newly introduced in the corrected versions (everyday speaking and writing styles) —
        not spelling fixes. Tap + to save one to your toolbox.
      </p>
      <ul className="mt-m space-y-s">
        {visibleItems.map((item) => {
          const key = itemKey(item);

          return (
            <li
              key={key}
              className="flex items-center gap-m rounded-button border border-border bg-background px-m py-s"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-s">
                  <p className="font-medium text-text-primary">{item.lemma}</p>
                  <PronunciationButton text={item.lemma} size="compact" ariaLabel={`Hear ${item.lemma}`} />
                </div>
                <p className="text-sm text-text-secondary">
                  {item.meaning}
                  <span className="text-text-secondary/70"> · {item.partOfSpeech}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(item)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
                aria-label={`Add ${item.lemma} to toolbox`}
              >
                <Plus className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
