import type { PracticeExerciseType, PracticeStageId } from '../types/practice';

export interface PracticeStageDefinition {
  id: PracticeStageId;
  emoji: string;
  title: string;
  exerciseLabel: string;
  description: string;
  minEntries: number;
  exerciseTypes: PracticeExerciseType[];
  comingSoon: boolean;
}

export const PRACTICE_STAGES: PracticeStageDefinition[] = [
  {
    id: 'quick',
    emoji: '🌱',
    title: 'Spot & Match',
    exerciseLabel: 'Fill-in-the-blank · Match meanings · Match the following · Find the error · Multiple choice',
    description:
      'Quick recognition drills from your toolbox — spot mistakes, match words to meanings, and choose the right answer.',
    minEntries: 15,
    exerciseTypes: ['fill_blank', 'match_meaning', 'match_following', 'find_error', 'multiple_choice'],
    comingSoon: false,
  },
  {
    id: 'sentence',
    emoji: '🌿',
    title: 'Write in French',
    exerciseLabel: 'Translation · Question & answer · Build a sentence',
    description:
      'Production practice — translate into French, answer prompts, and build sentences using the words you have collected.',
    minEntries: 40,
    exerciseTypes: ['translation', 'question_answer', 'build_sentence'],
    comingSoon: false,
  },
  {
    id: 'reading',
    emoji: '🌳',
    title: 'Read & Listen',
    exerciseLabel: 'Reading passages · Listening passages',
    description: 'Short passages built entirely from your toolbox vocabulary.',
    minEntries: 75,
    exerciseTypes: [],
    comingSoon: true,
  },
  {
    id: 'conversation',
    emoji: '🌍',
    title: 'Talk & Play',
    exerciseLabel: 'Conversations · Role-play · Story generation',
    description: 'Role-play scenarios, dialogues, and stories powered by your growing French.',
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
