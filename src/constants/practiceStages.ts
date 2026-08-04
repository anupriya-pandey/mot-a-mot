import type { PracticeExerciseType, PracticeStageId } from '../types/practice';

export interface PracticeStageDefinition {
  id: PracticeStageId;
  emoji: string;
  title: string;
  description: string;
  minEntries: number;
  exerciseTypes: PracticeExerciseType[];
  comingSoon: boolean;
}

export const PRACTICE_STAGES: PracticeStageDefinition[] = [
  {
    id: 'quick',
    emoji: '🌱',
    title: 'Quick Practice',
    description: 'Fill in the blanks, match meanings, spot errors, and multiple choice.',
    minEntries: 15,
    exerciseTypes: ['fill_blank', 'match_meaning', 'find_error', 'multiple_choice'],
    comingSoon: false,
  },
  {
    id: 'sentence',
    emoji: '🌿',
    title: 'Sentence Builder',
    description: 'Translation, question ↔ answer, and build-a-sentence prompts.',
    minEntries: 40,
    exerciseTypes: ['translation', 'question_answer', 'build_sentence'],
    comingSoon: false,
  },
  {
    id: 'reading',
    emoji: '🌳',
    title: 'Reading & Listening',
    description: 'Short passages built from your vocabulary.',
    minEntries: 75,
    exerciseTypes: [],
    comingSoon: true,
  },
  {
    id: 'conversation',
    emoji: '🌍',
    title: 'Conversations',
    description: 'Role-play, dialogues, and story generation.',
    minEntries: 150,
    exerciseTypes: [],
    comingSoon: true,
  },
];

export const PRACTICE_FOCUS_CATEGORIES = [
  'Verbs',
  'Nouns',
  'Adjectives',
  'Adverbs',
  'Pronouns',
  'Prepositions',
  'Conjunctions',
  'Expressions',
] as const;

export type PracticeFocusCategory = (typeof PRACTICE_FOCUS_CATEGORIES)[number];
