import type { VocabularyItem } from './analysis';
import type { VocabularyEntry } from './toolbox';

export interface ImportCandidate extends VocabularyItem {
  id: string;
}

export interface AmbiguousImportOption extends ImportCandidate {
  selected: boolean;
}

export interface AmbiguousImportGroup {
  lemma: string;
  options: AmbiguousImportOption[];
}

export interface RelatedSuggestions {
  examples: string[];
  meanings: string[];
  expressions: string[];
}

export interface RelatedImportOption extends ImportCandidate {
  selected: boolean;
}

export interface RelatedImportEntry {
  id: string;
  existing: VocabularyEntry;
  relatedEntries: RelatedImportOption[];
}

export interface ImportReviewSummary {
  newCount: number;
  existingCount: number;
  ambiguousLemmaCount: number;
  relatedCount: number;
  totalReviewed: number;
}

export interface ImportReviewData {
  ready: ImportCandidate[];
  alreadyIn: ImportCandidate[];
  ambiguous: AmbiguousImportGroup[];
  related: RelatedImportEntry[];
  summary: ImportReviewSummary;
}

export interface ImportApplyResult {
  added: number;
  skipped: number;
  totalEntries: number;
}

export interface ImportExtractionResponse {
  entries: VocabularyItem[];
}
