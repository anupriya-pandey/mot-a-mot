import { useCallback, useEffect, useState } from 'react';
import {
  addHistoryEntry,
  loadHistory,
  updateHistoryEntry,
} from '../lib/historyStorage';
import { DATA_SYNCED_EVENT } from '../lib/storageKeys';
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

  useEffect(() => {
    const handleSync = () => refresh();
    window.addEventListener(DATA_SYNCED_EVENT, handleSync);
    return () => window.removeEventListener(DATA_SYNCED_EVENT, handleSync);
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
