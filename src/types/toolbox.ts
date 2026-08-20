import type { AdjectiveForms } from './analysis';

export const PARTS_OF_SPEECH = [
  'Nouns',
  'Verbs',
  'Adjectives',
  'Adverbs',
  'Pronouns',
  'Articles / Determiners',
  'Prepositions',
  'Conjunctions',
  'Expressions',
  'Negation Particles',
  'Reflexive Pronouns',
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export interface VocabularyEntry {
  lemma: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  surfaces: string[];
  examples: string[];
  adjectiveForms?: AdjectiveForms;
  /** Masculine/feminine noun pair on one card (e.g. acteur / actrice) */
  nounGenderForms?: NounGenderForms;
}

export interface NounGenderForms {
  masculine: string;
  feminine?: string;
}

export type CategoryCounts = Record<PartOfSpeech, number>;
