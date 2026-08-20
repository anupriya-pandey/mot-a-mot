import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  TOOLBOX_DESCRIPTION,
  TOOLBOX_EMPTY,
  TOOLBOX_METHOD_IMPORT,
  TOOLBOX_METHOD_PRACTICE,
  TOOLBOX_TAB_SUBTITLE,
} from '../constants/microcopy';
import type { CategoryCounts, PartOfSpeech, VocabularyEntry } from '../types/toolbox';
import { FrenchToolboxDashboard } from '../components/FrenchToolboxDashboard';
import { ToolboxStretchWords } from '../components/ToolboxStretchWords';
import { VocabularyListItem } from '../components/VocabularyListItem';
import { SecondaryButton } from '../components/SecondaryButton';
import { exportToolboxToExcel, exportToolboxToPdf } from '../lib/exportToolbox';
import type { VocabularyItem } from '../types/analysis';

interface ToolboxScreenProps {
  entries: VocabularyEntry[];
  counts: CategoryCounts;
  totalCount: number;
  onSelectCategory: (category: PartOfSpeech) => void;
  onImport: () => void;
  onDeleteEntry: (entry: VocabularyEntry) => void;
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean;
  onAddRecommendation: (item: VocabularyItem) => void;
  demoRecommendations?: VocabularyItem[];
}

function matchesQuery(entry: VocabularyEntry, query: string): boolean {
  const q = query.toLowerCase();
  return (
    entry.lemma.toLowerCase().includes(q) ||
    entry.meaning.toLowerCase().includes(q) ||
    entry.partOfSpeech.toLowerCase().includes(q) ||
    entry.surfaces.some((surface) => surface.toLowerCase().includes(q))
  );
}

export function ToolboxScreen({
  entries,
  counts,
  totalCount,
  onSelectCategory,
  onImport,
  onDeleteEntry,
  isInToolbox,
  onAddRecommendation,
  demoRecommendations,
}: ToolboxScreenProps) {
  const [query, setQuery] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return entries
      .filter((entry) => matchesQuery(entry, trimmedQuery))
      .sort((a, b) => a.lemma.localeCompare(b.lemma, 'fr'));
  }, [entries, isSearching, trimmedQuery]);

  return (
    <div className="mx-auto w-full max-w-content px-m pb-xl">
      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">French Toolbox</h1>
        <p className="mt-xs text-sm text-text-secondary">{TOOLBOX_TAB_SUBTITLE}</p>
      </header>

      <div className="relative mb-m">
        <Search
          className="pointer-events-none absolute left-m top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search entries…"
          aria-label="Search toolbox entries"
          data-demo-target="toolbox-search"
          className="w-full rounded-input border border-border bg-surface py-3 pl-xxl pr-m text-base text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <SecondaryButton onClick={onImport} className="mb-s" data-demo-target="toolbox-import">
        Import to Toolbox
      </SecondaryButton>

      <div className="relative mb-m">
        <SecondaryButton
          onClick={() => setExportMenuOpen((open) => !open)}
          className="w-full"
          disabled={entries.length === 0}
          data-demo-target="toolbox-export-all"
        >
          <span className="inline-flex items-center justify-center gap-s">
            <Download className="h-4 w-4" aria-hidden />
            Export all vocabulary
          </span>
        </SecondaryButton>
        {exportMenuOpen && entries.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-s rounded-card border border-border bg-surface p-s shadow-card">
            <button
              type="button"
              className="block w-full rounded-button px-m py-2 text-left text-sm hover:bg-primary-light"
              onClick={() => {
                exportToolboxToExcel(entries);
                setExportMenuOpen(false);
              }}
            >
              Download Excel (.xlsx)
            </button>
            <button
              type="button"
              className="mt-xs block w-full rounded-button px-m py-2 text-left text-sm hover:bg-primary-light"
              onClick={() => {
                exportToolboxToPdf(entries);
                setExportMenuOpen(false);
              }}
            >
              Download PDF
            </button>
          </div>
        )}
      </div>

      {isSearching ? (
        <section aria-labelledby="search-results">
          <h2 id="search-results" className="mb-m text-lg font-semibold text-text-primary">
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
          </h2>
          {searchResults.length === 0 ? (
            <p className="rounded-card bg-surface p-m text-sm text-text-secondary shadow-card">
              No entries match &ldquo;{trimmedQuery}&rdquo;.
            </p>
          ) : (
            <div className="space-y-m">
              {searchResults.map((entry) => (
                <VocabularyListItem
                  key={`${entry.lemma}-${entry.partOfSpeech}-${entry.meaning}`}
                  entry={entry}
                  onDelete={onDeleteEntry}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <FrenchToolboxDashboard
            counts={counts}
            totalCount={totalCount}
            onSelectCategory={onSelectCategory}
            description={TOOLBOX_DESCRIPTION}
            methodPractice={TOOLBOX_METHOD_PRACTICE}
            methodImport={TOOLBOX_METHOD_IMPORT}
            emptyMessage={TOOLBOX_EMPTY}
          />
          <ToolboxStretchWords
            entries={entries}
            counts={counts}
            totalCount={totalCount}
            isInToolbox={isInToolbox}
            onAdd={onAddRecommendation}
            demoItems={demoRecommendations}
          />
        </>
      )}
    </div>
  );
}
