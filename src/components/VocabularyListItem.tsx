import type { VocabularyEntry } from '../types/toolbox';
import { PronunciationButton } from './PronunciationButton';

interface VocabularyListItemProps {
  entry: VocabularyEntry;
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

export function VocabularyListItem({ entry }: VocabularyListItemProps) {
  const distinctSurfaces = entry.surfaces.filter(
    (surface) => surface.toLowerCase() !== entry.lemma.toLowerCase(),
  );

  return (
    <article className="rounded-card bg-surface p-l shadow-card">
      <div className="flex items-start gap-s">
        <p className="flex-1 text-lg font-semibold text-text-primary">{entry.lemma}</p>
        <PronunciationButton text={entry.lemma} ariaLabel={`Hear ${entry.lemma}`} />
      </div>
      <p className="mt-xs text-base text-text-secondary">{entry.meaning}</p>

      {entry.partOfSpeech === 'Adjectives' && hasAdjectiveForms(entry) && entry.adjectiveForms && (
        <div className="mt-s">
          <p className="text-sm font-medium text-text-secondary">Forms</p>
          <dl className="mt-xs grid grid-cols-2 gap-x-m gap-y-xs text-sm text-text-secondary">
            <div>
              <dt className="font-medium">m. sg.</dt>
              <dd>
                <SpeakableForm text={entry.adjectiveForms.masculineSingular || '—'} />
              </dd>
            </div>
            <div>
              <dt className="font-medium">f. sg.</dt>
              <dd>
                <SpeakableForm text={entry.adjectiveForms.feminineSingular || '—'} />
              </dd>
            </div>
            <div>
              <dt className="font-medium">m. pl.</dt>
              <dd>
                <SpeakableForm text={entry.adjectiveForms.masculinePlural || '—'} />
              </dd>
            </div>
            <div>
              <dt className="font-medium">f. pl.</dt>
              <dd>
                <SpeakableForm text={entry.adjectiveForms.femininePlural || '—'} />
              </dd>
            </div>
          </dl>
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
                <PronunciationButton text={example} size="compact" ariaLabel={`Hear example`} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
