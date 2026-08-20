import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { VocabularyEntry } from '../types/toolbox';
import { ConfirmDialog } from './ConfirmDialog';
import { PronunciationButton } from './PronunciationButton';

interface VocabularyListItemProps {
  entry: VocabularyEntry;
  onDelete?: (entry: VocabularyEntry) => void;
}

function hasAdjectiveForms(entry: VocabularyEntry): boolean {
  const forms = entry.adjectiveForms;
  return Boolean(
    forms?.masculineSingular ||
      forms?.feminineSingular ||
      forms?.masculinePlural ||
      forms?.femininePlural,
  );
}

function SpeakableForm({ text }: { text: string }) {
  if (!text.trim() || text === '—') {
    return <>{text}</>;
  }

  return (
    <span className="inline-flex items-center gap-xs">
      <span>{text}</span>
      <PronunciationButton text={text} size="compact" ariaLabel={`Hear ${text}`} />
    </span>
  );
}

function FormsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-s overflow-x-auto rounded-input border border-border">
      <table className="w-full min-w-[240px] border-collapse text-sm">
        <thead>
          <tr className="bg-background">
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-border px-s py-xs text-left font-medium text-text-secondary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-s py-xs text-text-primary">
                  <SpeakableForm text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VocabularyListItem({ entry, onDelete }: VocabularyListItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const distinctSurfaces = entry.surfaces.filter(
    (surface) =>
      surface.toLowerCase() !== entry.lemma.toLowerCase() &&
      !entry.nounGenderForms &&
      !(entry.partOfSpeech === 'Adjectives' && hasAdjectiveForms(entry)),
  );

  return (
    <>
      <article className="rounded-card bg-surface p-l shadow-card">
        <div className="flex items-start gap-s">
          <div className="flex-1">
            <p className="text-lg font-semibold text-text-primary">{entry.lemma}</p>
            <p className="mt-xs text-base text-text-secondary">{entry.meaning}</p>
          </div>
          <div className="flex items-center gap-xs">
            <PronunciationButton text={entry.lemma} ariaLabel={`Hear ${entry.lemma}`} />
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-full p-2 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                aria-label={`Delete ${entry.lemma}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {entry.partOfSpeech === 'Nouns' && entry.nounGenderForms && (
          <div className="mt-s">
            <p className="text-sm font-medium text-text-secondary">Masculine / feminine</p>
            <FormsTable
              headers={['Masculine', 'Feminine']}
              rows={[
                [
                  entry.nounGenderForms.masculine,
                  entry.nounGenderForms.feminine ?? '—',
                ],
              ]}
            />
          </div>
        )}

        {entry.partOfSpeech === 'Adjectives' && hasAdjectiveForms(entry) && entry.adjectiveForms && (
          <div className="mt-s">
            <p className="text-sm font-medium text-text-secondary">All forms</p>
            <FormsTable
              headers={['Masculine', 'Feminine']}
              rows={[
                [
                  entry.adjectiveForms.masculineSingular,
                  entry.adjectiveForms.feminineSingular,
                ],
                [
                  entry.adjectiveForms.masculinePlural,
                  entry.adjectiveForms.femininePlural,
                ],
              ]}
            />
          </div>
        )}

        {distinctSurfaces.length > 0 && (
          <div className="mt-s">
            <p className="text-sm font-medium text-text-secondary">Forms seen</p>
            <ul className="mt-xs flex flex-wrap gap-s">
              {distinctSurfaces.map((surface) => (
                <li
                  key={surface}
                  className="inline-flex items-center gap-xs rounded-button border border-border bg-background px-s py-xs text-sm text-text-secondary"
                >
                  {surface}
                  <PronunciationButton text={surface} size="compact" ariaLabel={`Hear ${surface}`} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.examples.length > 0 && (
          <div className="mt-s">
            <p className="text-sm font-medium text-text-secondary">Examples</p>
            <ul className="mt-xs space-y-s">
              {entry.examples.map((example) => (
                <li key={example} className="flex items-start gap-s">
                  <p className="flex-1 text-sm italic text-text-secondary">&ldquo;{example}&rdquo;</p>
                  <PronunciationButton text={example} size="compact" ariaLabel="Hear example" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {confirmOpen && onDelete && (
        <ConfirmDialog
          title="Delete this entry?"
          message={`Remove « ${entry.lemma} » from your toolbox? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            onDelete(entry);
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
