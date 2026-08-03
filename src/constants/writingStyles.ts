export const WRITING_STYLES = ['simple', 'natural', 'refined'] as const;

export type WritingStyle = (typeof WRITING_STYLES)[number];

/** User-facing layer names — internal keys remain simple/natural/refined for API stability */
export const WRITING_STYLE_LABELS: Record<WritingStyle, string> = {
  simple: 'Foundation',
  natural: 'Expanding',
  refined: 'Fluent',
};

export const WRITING_STYLE_LAYERS: Record<WritingStyle, string> = {
  simple: 'Layer 1',
  natural: 'Layer 2',
  refined: 'Layer 3',
};

export const WRITING_STYLE_DESCRIPTIONS: Record<WritingStyle, string> = {
  simple: 'Clear, correct writing using common vocabulary.',
  natural:
    'Introduces richer vocabulary and more varied sentence structures while keeping the same meaning.',
  refined:
    'Uses polished, natural written French where it genuinely adds value. If a simpler version is already the best choice, we\'ll tell you.',
};

export const WRITING_SECTION_INTRO =
  'Express the same idea using progressively richer vocabulary and sentence structures. Choose the version that matches your current comfort level.';

export const EVERYDAY_FRENCH_TITLE = 'Everyday French';
export const EVERYDAY_FRENCH_SUBTITLE = 'Conversation';
export const EVERYDAY_FRENCH_DESCRIPTION =
  'How a native speaker would naturally say it in conversation.';

export function getSameAsPreviousMessage(style: WritingStyle, previousLabel: string): string {
  if (style === 'refined') {
    return 'This expression is already the most natural way to say it. No richer wording adds value here.';
  }
  return `Same as ${previousLabel} — already the most natural written version at this layer.`;
}
