import { CEFR_LEVELS, CEFR_LEVEL_LABELS, FORMAL_BY_LEVEL_INTRO } from '../constants/cefrLevels';
import type { CefrLevel, FormalByLevel } from '../types/analysis';
import { PrimaryButton } from './PrimaryButton';
import { SectionHeader } from './SectionHeader';
import { StatusBanner } from './StatusBanner';
import { SwipeCarousel } from './SwipeCarousel';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface LevelFormalSuggestionsProps {
  byLevel: FormalByLevel;
}

function LevelSlideContent({
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
    <div className="rounded-card bg-surface p-m shadow-card space-y-s mx-1">
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
  const slides = CEFR_LEVELS.map((level) => ({
    key: level,
    badge: level,
    subtitle: CEFR_LEVEL_LABELS[level],
    content: (
      <LevelSlideContent
        level={level}
        sentence={byLevel[level].sentence}
        english={byLevel[level].english}
        limitation={byLevel[level].limitation}
      />
    ),
  }));

  return (
    <section aria-labelledby="formal-by-level">
      <SectionHeader icon="🇫🇷" title="Formal French by DELF/DALF Level" />
      <p className="mb-m text-sm text-text-secondary">{FORMAL_BY_LEVEL_INTRO}</p>
      <SwipeCarousel slides={slides} ariaLabel="Formal French by level" />
    </section>
  );
}
