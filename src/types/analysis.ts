import type { CefrLevel } from '../constants/cefrLevels';

export type { CefrLevel };

export interface AdjectiveForms {
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
}

export interface CorrectionChange {
  youWrote: string;
  informalFrench: string;
  /** Buddy-style explanation for the informal phrasing */
  informalExplanation?: string;
  byLevel: Record<CefrLevel, string>;
  /** Buddy-style explanation per DELF/DALF level for this change */
  explanationsByLevel?: Record<CefrLevel, string>;
  /** @deprecated Legacy B1-only field from saved history */
  formalFrench?: string;
}

export interface LevelSuggestion {
  sentence: string;
  english?: string;
  limitation: string;
}

export type FormalByLevel = Record<CefrLevel, LevelSuggestion>;

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
    informal: { sentence: string; english?: string };
    byLevel: FormalByLevel;
  };
  changes: CorrectionChange[];
  explanations: {
    informal: string;
    byLevel: Record<CefrLevel, string>;
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

export type AppScreen = 'landing' | 'loading' | 'results' | 'vocabulary' | 'history';

export type BannerType = 'success' | 'warning' | 'error';
