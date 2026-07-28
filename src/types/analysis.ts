export interface CorrectionChange {
  youWrote: string;
  betterFrench: string;
  why: string;
}

export interface AnalysisResult {
  understood: string;
  everydayMeaning?: string;
  correctedSentence: string;
  changes: CorrectionChange[];
  grammarNotes: string;
  ratings: {
    grammar: number;
    naturalness: number;
  };
}

export type AppScreen = 'landing' | 'loading' | 'results';

export type BannerType = 'success' | 'warning' | 'error';
