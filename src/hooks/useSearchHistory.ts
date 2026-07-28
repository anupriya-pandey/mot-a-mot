import { useCallback, useEffect, useState } from 'react';
import {
  addHistoryEntry,
  loadHistory,
  updateHistoryEntry,
} from '../lib/historyStorage';
import type { AnalysisResult } from '../types/analysis';
import type { SearchHistoryEntry } from '../types/history';

export function useSearchHistory() {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(() => loadHistory());

  const refresh = useCallback(() => {
    setEntries(loadHistory());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSearch = useCallback(
    (sentence: string, result: AnalysisResult) => {
      const entry = addHistoryEntry(sentence, result);
      refresh();
      return entry.id;
    },
    [refresh],
  );

  const updateSearch = useCallback(
    (id: string, sentence: string, result: AnalysisResult) => {
      updateHistoryEntry(id, sentence, result);
      refresh();
    },
    [refresh],
  );

  return {
    entries,
    saveSearch,
    updateSearch,
    refresh,
  };
}
