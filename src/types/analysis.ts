import type { WritingStyle } from '../constants/writingStyles';

export type { WritingStyle };

export interface AdjectiveForms {
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
}

export interface CorrectionChange {
  youWrote: string;
  /** Fix phrase from the everyday speaking suggestion */
  speakingFrench: string;
  /** Buddy-style explanation for the speaking phrasing */
  speakingExplanation?: string;
  byStyle: Record<WritingStyle, string>;
  /** Buddy-style explanation per writing style for this change */
  explanationsByStyle?: Record<WritingStyle, string>;
  /** @deprecated Legacy fields from saved history */
  informalFrench?: string;
  formalFrench?: string;
  byLevel?: Record<string, string>;
  explanationsByLevel?: Record<string, string>;
  informalExplanation?: string;
}

export interface StyleSuggestion {
  sentence: string;
  english?: string;
  explanation: string;
  /** True when identical to the previous writing style */
  sameAsPrevious?: boolean;
  /** False when the full intended meaning could not fit this style */
  coversFullMeaning?: boolean;
  /** Note when meaning is partial or style is limited */
  note?: string;
}

export type WritingByStyle = Record<WritingStyle, StyleSuggestion>;

export interface VocabularyItem {
  lemma: string;
  surface: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  surfaces?: string[];
  examples?: string[];
  adjectiveForms?: AdjectiveForms;
}

export interface AnalysisResult {
  understood: string;
  suggestions: {
    speaking: { sentence: string; english?: string };
    writing: WritingByStyle;
  };
  changes: CorrectionChange[];
  explanations: {
    speaking: string;
    writing: Record<WritingStyle, string>;
  };
  userVocabulary: VocabularyItem[];
  suggestedAdditions: VocabularyItem[];
  ratings: {
    grammar: number;
    naturalness: number;
  };
}

export type SentenceLanguage = 'french' | 'english';

export interface ClarificationInput {
  mode: 'english' | 'french';
  text: string;
}

export interface AnalyzeRequest {
  sentence: string;
  clarification?: ClarificationInput;
}

export type AppScreen =
  | 'landing'
  | 'loading'
  | 'results'
  | 'vocabulary'
  | 'history'
  | 'import'
  | 'import-review'
  | 'import-success';

export type BannerType = 'success' | 'warning' | 'error';
