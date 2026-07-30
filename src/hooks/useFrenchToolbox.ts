import { useCallback, useEffect, useState } from 'react';
import {
  addVocabulary,
  addVocabularyItem,
  getCategoryCounts,
  getVocabularyByCategory,
  isVocabularyInToolbox,
  loadToolbox,
  normalizePartOfSpeech,
} from '../lib/toolboxStorage';
import type { VocabularyItem } from '../types/analysis';
import type { CategoryCounts, PartOfSpeech, VocabularyEntry } from '../types/toolbox';

export function useFrenchToolbox() {
  const [entries, setEntries] = useState<VocabularyEntry[]>(() => loadToolbox());
  const [counts, setCounts] = useState<CategoryCounts>(() => getCategoryCounts());

  const refresh = useCallback(() => {
    setEntries(loadToolbox());
    setCounts(getCategoryCounts());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addUserVocabulary = useCallback(
    (items: VocabularyItem[]) => {
      const added = addVocabulary(items);
      if (added > 0) refresh();
      return added;
    },
    [refresh],
  );

  const addSingleItem = useCallback(
    (item: VocabularyItem) => {
      const added = addVocabularyItem(item);
      if (added) refresh();
      return added;
    },
    [refresh],
  );

  const isInToolbox = useCallback((lemma: string, partOfSpeech: string) => {
    const pos = normalizePartOfSpeech(partOfSpeech);
    if (!pos) return false;
    return isVocabularyInToolbox(lemma, pos);
  }, []);

  const getByCategory = useCallback((category: PartOfSpeech) => {
    return getVocabularyByCategory(category);
  }, []);

  return {
    entries,
    counts,
    totalCount: entries.length,
    addUserVocabulary,
    addSingleItem,
    isInToolbox,
    getByCategory,
    refresh,
  };
}
