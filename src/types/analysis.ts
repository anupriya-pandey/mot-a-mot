export interface AdjectiveForms {
  masculineSingular: string;
  feminineSingular: string;
  masculinePlural: string;
  femininePlural: string;
}

export interface CorrectionChange {
  youWrote: string;
  informalFrench: string;
  formalFrench: string;
}

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
    informal: { sentence: string };
    formal: { sentence: string };
  };
  changes: CorrectionChange[];
  explanations: {
    informal: string;
    formal: string;
  };
  vocabulary: VocabularyItem[];
  ratings: {
    grammar: number;
    naturalness: number;
  };
}

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
