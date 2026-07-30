import { CEFR_LEVELS, CEFR_LEVEL_LABELS, FORMAL_BY_LEVEL_INTRO } from '../constants/cefrLevels';
import type { CefrLevel, FormalByLevel } from '../types/analysis';
import { PrimaryButton } from './PrimaryButton';
import { SectionHeader } from './SectionHeader';
import { StatusBanner } from './StatusBanner';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface LevelFormalSuggestionsProps {
  byLevel: FormalByLevel;
}

function LevelCard({
  level,
  sentence,
  english,
  limitation,
}: {
  level: CefrLevel;
  sentence: string;
  english?: string;
  limitation: string;
}) {
  const { copied, error: copyError, copy } = useCopyToClipboard();

  return (
    <div className="rounded-card bg-surface p-m shadow-card space-y-s">
      <div className="flex flex-wrap items-center gap-s">
        <span className="inline-flex rounded-full bg-primary/10 px-s py-xs text-xs font-semibold text-primary">
          {level}
        </span>
        <span className="text-xs text-text-secondary">{CEFR_LEVEL_LABELS[level]}</span>
      </div>
      <p className="leading-relaxed text-text-primary">{sentence}</p>
      {english?.trim() && (
        <p className="text-sm leading-relaxed text-text-secondary">{english.trim()}</p>
      )}
      <p className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">In scope at this level: </span>
        {limitation}
      </p>
      <PrimaryButton
        onClick={() => void copy(sentence)}
        success={copied}
        aria-label={`Copy formal French message at ${level} level`}
      >
        Copy Message
      </PrimaryButton>
      {copyError && <StatusBanner type="error" message={copyError} />}
    </div>
  );
}

export function LevelFormalSuggestions({ byLevel }: LevelFormalSuggestionsProps) {
  return (
    <section aria-labelledby="formal-by-level">
      <SectionHeader icon="🇫🇷" title="Formal French by DELF/DALF Level" />
      <p className="mb-m text-sm text-text-secondary">{FORMAL_BY_LEVEL_INTRO}</p>
      <div className="space-y-m">
        {CEFR_LEVELS.map((level) => (
          <LevelCard
            key={level}
            level={level}
            sentence={byLevel[level].sentence}
            english={byLevel[level].english}
            limitation={byLevel[level].limitation}
          />
        ))}
      </div>
    </section>
  );
}
