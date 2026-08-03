export const WRITING_STYLES = ['simple', 'natural', 'refined'] as const;

export type WritingStyle = (typeof WRITING_STYLES)[number];

export const WRITING_STYLE_LABELS: Record<WritingStyle, string> = {
  simple: 'Simple',
  natural: 'Natural',
  refined: 'Refined',
};

export const WRITING_STYLE_DESCRIPTIONS: Record<WritingStyle, string> = {
  simple: 'Clear, everyday written French using common vocabulary.',
  natural: 'A smoother, more polished version many native speakers would write.',
  refined: 'A more expressive or formal alternative — only when it genuinely adds value.',
};

export const WRITING_SECTION_INTRO =
  'Each style shows the suggested sentence and what changed from your original — swipe through changes when there is more than one.';
