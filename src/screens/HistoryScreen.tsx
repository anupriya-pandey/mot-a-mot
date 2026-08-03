import { ChevronRight } from 'lucide-react';
import { HISTORY_EMPTY, HISTORY_SUBTITLE } from '../constants/microcopy';
import type { SearchHistoryEntry } from '../types/history';

interface HistoryScreenProps {
  entries: SearchHistoryEntry[];
  onSelectEntry: (entry: SearchHistoryEntry) => void;
}

function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncateSentence(sentence: string, maxLength = 80): string {
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength).trim()}…`;
}

export function HistoryScreen({ entries, onSelectEntry }: HistoryScreenProps) {
  return (
    <div className="mx-auto w-full max-w-content px-m pb-xl">
      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">History</h1>
        <p className="mt-xs text-sm text-text-secondary">{HISTORY_SUBTITLE}</p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-card bg-surface p-l text-sm text-text-secondary shadow-card whitespace-pre-line">
          {HISTORY_EMPTY}
        </p>
      ) : (
        <ul className="space-y-s">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelectEntry(entry)}
                className="flex w-full items-center gap-m rounded-card bg-surface p-l text-left shadow-card transition-colors hover:bg-primary-light"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary">
                    {truncateSentence(entry.sentence)}
                  </p>
                  <p className="mt-xs text-sm text-text-secondary">
                    {formatHistoryDate(entry.createdAt)}
                    {' · '}
                    Grammar {entry.result.ratings.grammar}
                    {' · '}
                    Naturalness {entry.result.ratings.naturalness}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
