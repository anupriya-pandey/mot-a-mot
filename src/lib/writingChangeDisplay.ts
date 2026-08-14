import type { CorrectionChange, WritingStyle } from '../types/analysis';
import {
  EVERYDAY_FRENCH_SUBTITLE,
  WRITING_STYLES,
  WRITING_STYLE_LABELS,
} from '../constants/writingStyles';

export interface FixPhraseDisplay {
  phrase: string;
  carryOverFrom?: string;
}

/** Normalize for comparing whether two change phrases are the same fix. */
export function normalizeChangePhrase(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function isSameChangePhrase(a: string, b: string): boolean {
  return normalizeChangePhrase(a) === normalizeChangePhrase(b);
}

/** Fix phrase at a writing layer — only when that layer actually changed the span. */
export function getWritingFixPhraseAtLayer(
  change: CorrectionChange,
  style: WritingStyle,
): FixPhraseDisplay | null {
  const direct = change.byStyle[style]?.trim();
  if (!direct) return null;
  return { phrase: direct };
}

/** When a layer repeats the previous wording, still show the fix from what the learner wrote. */
export function getWritingFixPhraseDisplay(
  change: CorrectionChange,
  style: WritingStyle,
): FixPhraseDisplay | null {
  const direct = change.byStyle[style]?.trim();
  if (direct) return { phrase: direct };

  const styleIndex = WRITING_STYLES.indexOf(style);
  for (let index = styleIndex - 1; index >= 0; index -= 1) {
    const previousStyle = WRITING_STYLES[index];
    const previousPhrase = change.byStyle[previousStyle]?.trim();
    if (previousPhrase) {
      return {
        phrase: previousPhrase,
        carryOverFrom: WRITING_STYLE_LABELS[previousStyle],
      };
    }
  }

  const speaking = change.speakingFrench?.trim();
  if (speaking) {
    return { phrase: speaking, carryOverFrom: EVERYDAY_FRENCH_SUBTITLE };
  }

  return null;
}

export function getChangesForWritingLayer(
  changes: CorrectionChange[],
  style: WritingStyle,
): CorrectionChange[] {
  const filtered = changes.filter((change) => {
    const fix = getWritingFixPhraseDisplay(change, style);
    if (!fix) return false;
    return !isSameChangePhrase(change.youWrote, fix.phrase);
  });

  if (filtered.length > 0) return filtered;

  return changes.filter((change) => Boolean(getWritingFixPhraseDisplay(change, style)));
}

export function getChangesForSpeaking(changes: CorrectionChange[]): CorrectionChange[] {
  const filtered = changes.filter((change) => {
    const speaking = (change.speakingFrench || change.informalFrench)?.trim();
    if (!speaking) return false;
    return !isSameChangePhrase(change.youWrote, speaking);
  });

  if (filtered.length > 0) return filtered;

  return changes.filter((change) => Boolean((change.speakingFrench || change.informalFrench)?.trim()));
}
