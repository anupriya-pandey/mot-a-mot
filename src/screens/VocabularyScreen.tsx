import { ArrowLeft, Download } from 'lucide-react';
import { useState } from 'react';
import { SecondaryButton } from '../components/SecondaryButton';
import { VocabularyListItem } from '../components/VocabularyListItem';
import { GRAMMAR_GUIDES } from '../constants/grammarGuides';
import { TOOLBOX_EMPTY } from '../constants/microcopy';
import { exportToolboxToExcel, exportToolboxToPdf } from '../lib/exportToolbox';
import type { PartOfSpeech, VocabularyEntry } from '../types/toolbox';

interface VocabularyScreenProps {
  category: PartOfSpeech;
  entries: VocabularyEntry[];
  onBack: () => void;
  onDeleteEntry: (entry: VocabularyEntry) => void;
}

export function VocabularyScreen({ category, entries, onBack, onDeleteEntry }: VocabularyScreenProps) {
  const guide = GRAMMAR_GUIDES[category];
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <SecondaryButton onClick={onBack} className="mb-l">
        <span className="inline-flex items-center justify-center gap-s">
          <ArrowLeft className="h-4 w-4" />
          Back to Toolbox
        </span>
      </SecondaryButton>

      <header className="mb-l">
        <h1 className="text-2xl font-semibold text-text-primary">{category}</h1>
        <p className="mt-xs text-sm text-text-secondary">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your toolbox
        </p>
        <p className="mt-m rounded-card bg-surface p-m text-sm leading-relaxed text-text-secondary shadow-card">
          {guide.summary}
        </p>
      </header>

      <div className="relative mb-l">
        <SecondaryButton
          onClick={() => setExportMenuOpen((open) => !open)}
          className="w-full"
          disabled={entries.length === 0}
          data-demo-target="toolbox-export-category"
        >
          <span className="inline-flex items-center justify-center gap-s">
            <Download className="h-4 w-4" aria-hidden />
            Export {category}
          </span>
        </SecondaryButton>
        {exportMenuOpen && entries.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-s rounded-card border border-border bg-surface p-s shadow-card">
            <button
              type="button"
              className="block w-full rounded-button px-m py-2 text-center text-sm hover:bg-primary-light md:text-left"
              onClick={() => {
                exportToolboxToExcel(entries, { category });
                setExportMenuOpen(false);
              }}
            >
              Download Excel (.xlsx)
            </button>
            <button
              type="button"
              className="mt-xs block w-full rounded-button px-m py-2 text-center text-sm hover:bg-primary-light md:text-left"
              onClick={() => {
                exportToolboxToPdf(entries, { category });
                setExportMenuOpen(false);
              }}
            >
              Download PDF
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-card bg-surface p-l text-sm text-text-secondary shadow-card whitespace-pre-line">
          {TOOLBOX_EMPTY}
        </p>
      ) : (
        <div className="space-y-m">
          {entries.map((entry, index) => (
            <div key={`${entry.lemma}-${entry.meaning}-${entry.partOfSpeech}`} data-demo-target={index === 0 ? 'toolbox-card-forms' : undefined}>
            <VocabularyListItem
              entry={entry}
              onDelete={onDeleteEntry}
            />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
