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
}

export type CategoryCounts = Record<PartOfSpeech, number>;
