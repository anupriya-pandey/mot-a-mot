export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: 'DELF A1',
  A2: 'DELF A2',
  B1: 'DELF B1',
  B2: 'DELF B2',
  C1: 'DALF C1',
  C2: 'DALF C2',
};

export const FORMAL_BY_LEVEL_INTRO =
  'Polite French calibrated to each DELF/DALF level. Start at A1 — swipe or tap → to see A2, B1, B2, C1, and C2.';
