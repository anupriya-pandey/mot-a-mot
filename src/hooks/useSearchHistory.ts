import { useCallback, useEffect, useState } from 'react';
import {
  addHistoryEntry,
  loadHistory,
  updateHistoryEntry,
} from '../lib/historyStorage';
import type { AnalysisResult, SentenceLanguage } from '../types/analysis';
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
    (
      sentence: string,
      sourceSentence: string,
      result: AnalysisResult,
      sentenceLanguage: SentenceLanguage = 'french',
    ) => {
      const entry = addHistoryEntry(sentence, sourceSentence, result, sentenceLanguage);
      refresh();
      return entry.id;
    },
    [refresh],
  );

  const updateSearch = useCallback(
    (
      id: string,
      sentence: string,
      sourceSentence: string,
      result: AnalysisResult,
      sentenceLanguage: SentenceLanguage = 'french',
    ) => {
      updateHistoryEntry(id, sentence, sourceSentence, result, sentenceLanguage);
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
