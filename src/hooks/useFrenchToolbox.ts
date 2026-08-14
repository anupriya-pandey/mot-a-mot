import { useCallback, useEffect, useState } from 'react';
import {
  addVocabulary,
  addVocabularyItem,
  applyToolboxImport,
  getCategoryCounts,
  getVocabularyByCategory,
  isVocabularyInToolbox,
  loadToolbox,
  normalizePartOfSpeech,
} from '../lib/toolboxStorage';
import { DATA_SYNCED_EVENT } from '../lib/storageKeys';
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

  useEffect(() => {
    const handleSync = () => refresh();
    window.addEventListener(DATA_SYNCED_EVENT, handleSync);
    return () => window.removeEventListener(DATA_SYNCED_EVENT, handleSync);
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

  const applyImport = useCallback(
    (items: VocabularyItem[]) => {
      const result = applyToolboxImport(items);
      refresh();
      return result;
    },
    [refresh],
  );

  return {
    entries,
    counts,
    totalCount: entries.length,
    addUserVocabulary,
    addSingleItem,
    applyImport,
    isInToolbox,
    getByCategory,
    refresh,
  };
}
