import type { VocabularyEntry } from '../types/toolbox';

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

export function VocabularyListItem({ entry }: VocabularyListItemProps) {
  const distinctSurfaces = entry.surfaces.filter(
    (surface) => surface.toLowerCase() !== entry.lemma.toLowerCase(),
  );

  return (
    <article className="rounded-card bg-surface p-l shadow-card">
      <p className="text-lg font-semibold text-text-primary">{entry.lemma}</p>
      <p className="mt-xs text-base text-text-secondary">{entry.meaning}</p>

      {entry.partOfSpeech === 'Adjectives' && hasAdjectiveForms(entry) && entry.adjectiveForms && (
        <div className="mt-s">
          <p className="text-sm font-medium text-text-secondary">Forms</p>
          <dl className="mt-xs grid grid-cols-2 gap-x-m gap-y-xs text-sm text-text-secondary">
            <div>
              <dt className="font-medium">m. sg.</dt>
              <dd>{entry.adjectiveForms.masculineSingular || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium">f. sg.</dt>
              <dd>{entry.adjectiveForms.feminineSingular || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium">m. pl.</dt>
              <dd>{entry.adjectiveForms.masculinePlural || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium">f. pl.</dt>
              <dd>{entry.adjectiveForms.femininePlural || '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      {distinctSurfaces.length > 0 && (
        <p className="mt-s text-sm text-text-secondary">
          <span className="font-medium">Forms seen: </span>
          {distinctSurfaces.join(', ')}
        </p>
      )}

      {entry.examples.length > 0 && (
        <div className="mt-s">
          <p className="text-sm font-medium text-text-secondary">Examples</p>
          <ul className="mt-xs space-y-xs">
            {entry.examples.map((example) => (
              <li key={example} className="text-sm italic text-text-secondary">
                &ldquo;{example}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
