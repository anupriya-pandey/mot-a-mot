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
