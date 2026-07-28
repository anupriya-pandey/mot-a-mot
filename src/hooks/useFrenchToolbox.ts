import { useCallback, useEffect, useState } from 'react';
import {
  addVocabulary,
  getCategoryCounts,
  getVocabularyByCategory,
  loadToolbox,
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

  const addFromAnalysis = useCallback(
    (items: VocabularyItem[]) => {
      const added = addVocabulary(items);
      if (added > 0) refresh();
      return added;
    },
    [refresh],
  );

  const getByCategory = useCallback((category: PartOfSpeech) => {
    return getVocabularyByCategory(category);
  }, []);

  return {
    entries,
    counts,
    totalCount: entries.length,
    addFromAnalysis,
    getByCategory,
    refresh,
  };
}
