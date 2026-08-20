import type { AnalysisResult } from '../types/analysis';
import type { ImportReviewData } from '../types/import';
import type {
  PracticeQuestionFeedback,
  PracticePrompt,
  PracticeSessionPlan,
} from '../types/practice';
import type { PracticeReadiness } from '../lib/practiceReadiness';
import type { SearchHistoryEntry } from '../types/history';
import type { CategoryCounts, VocabularyEntry } from '../types/toolbox';

export const DEMO_SENTENCE = 'Je peux pas venir aujourd\u2019hui.';

export const DEMO_CHECK_RESULT: AnalysisResult = {
  understood: 'You\u2019re telling someone you can\u2019t come today.',
  suggestions: {
    speaking: {
      sentence: 'Je ne peux pas venir aujourd\u2019hui.',
      english: 'I can\u2019t come today.',
    },
    writing: {
      simple: {
        sentence: 'Je ne peux pas venir aujourd\u2019hui.',
        english: 'I can\u2019t come today.',
        explanation:
          'Foundation keeps the full meaning with straightforward grammar \u2014 including ne in negation.',
      },
      natural: {
        sentence: 'Je ne peux pas venir aujourd\u2019hui.',
        english: 'I can\u2019t come today.',
        explanation: 'Same natural phrasing here \u2014 the main fix is adding ne before the verb.',
        sameAsPrevious: true,
      },
      refined: {
        sentence: 'Je ne pourrai pas venir aujourd\u2019hui.',
        english: 'I won\u2019t be able to come today.',
        explanation:
          'Fluent adds a future nuance while keeping your meaning \u2014 useful when plans are still uncertain.',
      },
    },
  },
  changes: [
    {
      youWrote: 'peux pas',
      speakingFrench: 'ne peux pas',
      speakingExplanation: 'In French negation, ne goes before the verb: je ne peux pas.',
      byStyle: {
        simple: 'ne peux pas',
        natural: 'ne peux pas',
        refined: 'ne pourrai pas',
      },
      explanationsByStyle: {
        simple: 'Add ne before the verb in a negative sentence.',
        natural: 'Add ne before the verb in a negative sentence.',
        refined: 'Future tense fits when you mean you won\u2019t be able to come.',
      },
    },
  ],
  explanations: {
    speaking:
      'Everyday French keeps your message short and natural. The key fix is adding ne in the negation.',
    writing: {
      simple: 'Foundation makes sure the sentence is clear and grammatically complete.',
      natural: 'Expanding keeps the same meaning with slightly richer structure when helpful.',
      refined: 'Fluent can add nuance \u2014 here a future form \u2014 without changing your intent.',
    },
  },
  userVocabulary: [],
  suggestedAdditions: [
    {
      lemma: 'venir',
      surface: 'venir',
      meaning: 'to come',
      partOfSpeech: 'Verb',
      example: 'Je ne peux pas venir ce soir.',
    },
  ],
  ratings: { grammar: 72, naturalness: 78 },
};

export const DEMO_IMPORT_TEXT_PARTIAL = `Les verbes
être — to be
aller — to go
bonjour`;

export const DEMO_IMPORT_TEXT_FULL = `Les verbes
être — to be
aller — to go
faire — to do
bonjour — hello

Je suis très fatiguée aujourd'hui parce que je travaille beaucoup.`;

export const DEMO_IMPORT_REVIEW: ImportReviewData = {
  ready: [
    {
      id: 'ready-1',
      lemma: 'aller',
      surface: 'aller',
      meaning: 'to go',
      partOfSpeech: 'Verb',
      example: 'Je vais au marché demain.',
    },
    {
      id: 'ready-2',
      lemma: 'faire',
      surface: 'faire',
      meaning: 'to do / to make',
      partOfSpeech: 'Verb',
      example: 'Je fais mes devoirs.',
    },
  ],
  alreadyIn: [
    {
      id: 'dup-1',
      lemma: 'être',
      surface: 'être',
      meaning: 'to be',
      partOfSpeech: 'Verb',
      example: 'Je suis fatiguée.',
    },
    {
      id: 'dup-2',
      lemma: 'bonjour',
      surface: 'bonjour',
      meaning: 'hello',
      partOfSpeech: 'Expression',
      example: 'Bonjour!',
    },
  ],
  ambiguous: [
    {
      lemma: 'entre',
      options: [
        {
          id: 'amb-1',
          lemma: 'entre',
          surface: 'entre',
          meaning: 'between (preposition)',
          partOfSpeech: 'Preposition',
          example: 'Entre toi et moi.',
          selected: true,
        },
        {
          id: 'amb-2',
          lemma: 'entrer',
          surface: 'entre',
          meaning: 'to enter (verb)',
          partOfSpeech: 'Verb',
          example: 'Il entre dans la maison.',
          selected: false,
        },
      ],
    },
  ],
  related: [
    {
      id: 'rel-1',
      existing: {
        lemma: 'travailler',
        meaning: 'to work',
        partOfSpeech: 'Verbs',
        surfaces: ['travaille', 'travailler'],
        examples: ['Je travaille beaucoup.'],
      },
      relatedEntries: [
        {
          id: 'rel-new-1',
          lemma: 'travail',
          surface: 'travail',
          meaning: 'work (noun)',
          partOfSpeech: 'Noun',
          example: 'Mon travail est intéressant.',
          selected: true,
        },
      ],
    },
  ],
  summary: {
    newCount: 4,
    existingCount: 2,
    ambiguousLemmaCount: 1,
    relatedCount: 1,
    totalReviewed: 7,
  },
};

export const DEMO_TOOLBOX_COUNTS: CategoryCounts = {
  Nouns: 12,
  Verbs: 8,
  Adjectives: 6,
  Adverbs: 4,
  Pronouns: 3,
  'Articles / Determiners': 2,
  Prepositions: 5,
  Conjunctions: 2,
  Expressions: 4,
  'Negation Particles': 2,
  'Reflexive Pronouns': 1,
};

export const DEMO_TOOLBOX_ENTRIES: VocabularyEntry[] = [
  {
    lemma: 'acteur',
    meaning: 'actor',
    partOfSpeech: 'Nouns',
    surfaces: ['acteur', 'actrice'],
    examples: ['Il est acteur.'],
    nounGenderForms: { masculine: 'acteur', feminine: 'actrice' },
  },
];

export const DEMO_PRACTICE_READINESS: PracticeReadiness = {
  score: 100,
  label: 'Ready to practice',
  unlocked: true,
  factors: {
    entries: { score: 100, current: 49, target: 25, label: 'Entries' },
    categories: { score: 100, current: 6, target: 5, label: 'Category diversity' },
    verbs: { score: 100, current: 8, target: 5, label: 'Verbs' },
  },
  representedCategories: ['Verbs', 'Nouns', 'Adjectives', 'Pronouns', 'Prepositions', 'Adverbs'],
  missingCategories: [],
};

export const DEMO_PRACTICE_SESSION: PracticeSessionPlan = {
  stage: 'quick',
  focusCategory: 'all',
  estimatedMinutes: '5',
  prompts: [
    {
      id: 'demo-q1',
      index: 1,
      stage: 'quick',
      type: 'fill_blank',
      title: 'Complete the sentence',
      instruction: 'Fill in the blank with the correct form of aller.',
      targetWords: ['aller'],
      hints: ['Think about a movement verb in the present tense.'],
      correctAnswer: 'vais',
      sentenceWithBlank: 'Je ___ au marché demain.',
      explanation: 'Use the present tense of aller: je vais.',
    },
  ],
};

export const DEMO_PRACTICE_PROMPT: PracticePrompt = DEMO_PRACTICE_SESSION.prompts[0];

export const DEMO_PRACTICE_WRONG_FEEDBACK: PracticeQuestionFeedback = {
  correct: false,
  userAnswer: 'va',
  correctAnswer: 'vais',
  explanation:
    'With je, aller becomes vais \u2014 not va. Remember: je vais, tu vas, il/elle va.',
};

export const DEMO_PRACTICE_CORRECT_FEEDBACK: PracticeQuestionFeedback = {
  correct: true,
  userAnswer: 'vais',
  correctAnswer: 'vais',
  explanation: 'Correct! Je vais is the right present-tense form of aller.',
};

export const DEMO_HISTORY_ENTRIES: SearchHistoryEntry[] = [
  {
    id: 'hist-1',
    sentence: DEMO_SENTENCE,
    sourceSentence: DEMO_SENTENCE,
    sentenceLanguage: 'french',
    result: DEMO_CHECK_RESULT,
    createdAt: '2026-08-20T14:30:00.000Z',
  },
  {
    id: 'hist-2',
    sentence: 'J\u2019aimerais réserver une table pour deux personnes.',
    sourceSentence: 'J\u2019aimerais réserver une table pour deux personnes.',
    sentenceLanguage: 'french',
    result: {
      ...DEMO_CHECK_RESULT,
      ratings: { grammar: 85, naturalness: 88 },
    },
    createdAt: '2026-08-18T10:15:00.000Z',
  },
];

export const DEMO_NOOP = () => undefined;
export const DEMO_NOOP_ASYNC = async () => true;
