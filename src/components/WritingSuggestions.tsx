import {
  WRITING_STYLES,
  WRITING_STYLE_DESCRIPTIONS,
  WRITING_STYLE_LABELS,
  WRITING_SECTION_INTRO,
} from '../constants/writingStyles';
import { PARTIAL_MEANING_AT_LEVEL, SAME_AS_PREVIOUS_STYLE } from '../constants/microcopy';
import type { CorrectionChange, WritingByStyle, WritingStyle } from '../types/analysis';
import { PrimaryButton } from './PrimaryButton';
import { SectionHeader } from './SectionHeader';
import { StatusBanner } from './StatusBanner';
import { StyleChangesCarousel } from './StyleChangesCarousel';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface WritingSuggestionsProps {
  writing: WritingByStyle;
  changes: CorrectionChange[];
}

function WritingStyleGroup({
  style,
  sentence,
  english,
  explanation,
  sameAsPrevious,
  coversFullMeaning,
  note,
  previousLabel,
  changes,
}: {
  style: WritingStyle;
  sentence: string;
  english?: string;
  explanation: string;
  sameAsPrevious?: boolean;
  coversFullMeaning?: boolean;
  note?: string;
  previousLabel?: string;
  changes: CorrectionChange[];
}) {
  const { copied, error: copyError, copy } = useCopyToClipboard();
  const styleLabel = `${WRITING_STYLE_LABELS[style]} Writing`;

  return (
    <article className="rounded-card bg-surface p-m shadow-card space-y-m">
      <div>
        <h3 className="font-semibold text-text-primary">{styleLabel}</h3>
        <p className="mt-xs text-sm text-text-secondary">{WRITING_STYLE_DESCRIPTIONS[style]}</p>
      </div>

      {sameAsPrevious && previousLabel && (
        <p className="rounded-lg bg-success/10 px-m py-s text-sm font-medium text-success" role="status">
          ✓ {SAME_AS_PREVIOUS_STYLE.replace('{style}', previousLabel)}
        </p>
      )}

      {coversFullMeaning === false && (
        <p className="rounded-lg bg-warning/10 px-m py-s text-sm font-medium text-text-primary" role="note">
          {PARTIAL_MEANING_AT_LEVEL}
        </p>
      )}

      {!sameAsPrevious && (
        <>
          <p className="whitespace-pre-line leading-relaxed text-text-primary">{sentence}</p>
          {english?.trim() && (
            <p className="text-sm leading-relaxed text-text-secondary">{english.trim()}</p>
          )}
          <PrimaryButton
            onClick={() => void copy(sentence)}
            success={copied}
            aria-label={`Copy ${styleLabel}`}
          >
            Copy Message
          </PrimaryButton>
          {copyError && <StatusBanner type="error" message={copyError} />}
        </>
      )}

      {note?.trim() && <p className="text-sm text-text-secondary">{note.trim()}</p>}

      {explanation?.trim() && !sameAsPrevious && (
        <p className="text-sm leading-relaxed text-text-secondary">{explanation.trim()}</p>
      )}

      <StyleChangesCarousel
        changes={changes}
        styleLabel={styleLabel}
        getFixPhrase={(change) => change.byStyle[style]}
        getExplanation={(change) => change.explanationsByStyle?.[style]}
        ariaLabel={`What changed for ${styleLabel}`}
      />
    </article>
  );
}

export function WritingSuggestions({ writing, changes }: WritingSuggestionsProps) {
  return (
    <section aria-labelledby="writing-suggestions">
      <SectionHeader icon="✍️" title="Writing" />
      <p className="mb-m text-sm text-text-secondary">{WRITING_SECTION_INTRO}</p>
      <div className="space-y-m">
        {WRITING_STYLES.map((style, index) => {
          const previousLabel = index > 0 ? WRITING_STYLE_LABELS[WRITING_STYLES[index - 1]] : undefined;
          const item = writing[style];

          return (
            <WritingStyleGroup
              key={style}
              style={style}
              sentence={item.sentence}
              english={item.english}
              explanation={item.explanation}
              sameAsPrevious={item.sameAsPrevious}
              coversFullMeaning={item.coversFullMeaning}
              note={item.note}
              previousLabel={previousLabel}
              changes={changes}
            />
          );
        })}
      </div>
    </section>
  );
}
