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
    emoji: '🎯',
    title: 'French Skills',
    exerciseLabel:
      'Gender · Conjugation · Meaning · Grammar · Expressions · Fill-in · Matching · Find the errors',
    description: 'Test what you\'ve built in your French Toolbox — varied drills grounded in your vocabulary.',
    minEntries: 15,
    exerciseTypes: [
      'noun_gender',
      'mcq_conjugation',
      'mcq_verb_meaning',
      'mcq_pronoun',
      'mcq_meaning',
      'mcq_grammar',
      'mcq_expression',
      'find_errors_multi',
      'fill_blank',
      'match_following',
      'adjective_transform',
    ],
    comingSoon: false,
  },
  {
    id: 'sentence',
    emoji: '🌿',
    title: 'Write in French',
    exerciseLabel: 'Translation · Question & answer · Build a sentence',
    description: 'Put your French into practice — translate, answer prompts, and build sentences from your toolbox.',
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
