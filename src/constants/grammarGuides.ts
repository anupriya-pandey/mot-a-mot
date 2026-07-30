import type { PartOfSpeech } from '../types/toolbox';

export interface GrammarGuide {
  title: PartOfSpeech;
  summary: string;
}

export const GRAMMAR_GUIDES: Record<PartOfSpeech, GrammarGuide> = {
  Nouns: {
    title: 'Nouns',
    summary:
      'Nouns name people, places, things, or ideas (chat, maison, bonheur). In French, every noun has a gender — masculine or feminine — and usually a plural form. Gender affects articles and adjectives around the noun, so it is worth learning nouns with their article (le/la).',
  },
  Verbs: {
    title: 'Verbs',
    summary:
      'Verbs describe actions or states (manger, être, vouloir). French verbs change form depending on who is doing the action and when — this is called conjugation. Regular verbs follow patterns (-er, -ir, -re); many common verbs are irregular and must be memorized.',
  },
  Adjectives: {
    title: 'Adjectives',
    summary:
      'Adjectives describe nouns (grand, petite, intéressant). In French, most adjectives agree in gender and number with the noun they modify — so you may see four forms (masculine/feminine, singular/plural). Some adjectives go before the noun, others after it.',
  },
  Adverbs: {
    title: 'Adverbs',
    summary:
      'Adverbs describe how, when, where, or how much something happens (rapidement, souvent, bien, ici). They modify verbs, adjectives, or other adverbs. Many French adverbs are formed by adding -ment to an adjective (lent → lentement). Adverbs usually stay the same regardless of gender or number.',
  },
  Pronouns: {
    title: 'Pronouns',
    summary:
      'Pronouns replace nouns so you do not repeat the same word (je, tu, il, elle, nous, vous, ils). French has several types — subject (je), direct object (me, le), indirect object (lui), and stressed/emphatic (moi, toi). Choosing the right pronoun is one of the trickiest parts of French grammar.',
  },
  'Articles / Determiners': {
    title: 'Articles / Determiners',
    summary:
      'These small words come before nouns and tell you whether something is specific or general (le, la, les, un, une, des, mon, cette). French has definite articles (the), indefinite articles (a/an), and possessives (my, your). The article often reveals the noun\'s gender.',
  },
  Prepositions: {
    title: 'Prepositions',
    summary:
      'Prepositions show relationships between words — place, time, direction, or cause (à, de, en, dans, sur, avec). French prepositions rarely match English one-to-one: for example, en and dans both relate to "in," but they are used in different situations.',
  },
  Conjunctions: {
    title: 'Conjunctions',
    summary:
      'Conjunctions connect words, phrases, or clauses (et, mais, ou, parce que, quand). Coordinating conjunctions join equal parts (et, mais). Subordinating conjunctions introduce dependent clauses and often trigger specific verb moods (que + subjunctive, parce que + indicative).',
  },
  Expressions: {
    title: 'Expressions',
    summary:
      'Expressions are fixed phrases whose meaning is not obvious from individual words (avoir faim = to be hungry, ça marche = that works). They are essential for sounding natural. Learn them as whole units rather than translating word by word.',
  },
  'Negation Particles': {
    title: 'Negation Particles',
    summary:
      'French negation usually wraps around the verb with ne … pas (Je ne sais pas). Other particles include plus (no longer), jamais (never), and rien (nothing). In everyday spoken French, ne is often dropped, but you should still learn the full written form.',
  },
  'Reflexive Pronouns': {
    title: 'Reflexive Pronouns',
    summary:
      'Reflexive pronouns (me, te, se, nous, vous) go with reflexive verbs when the subject acts on themselves (se laver = to wash oneself, s\'appeler = to be called). The pronoun matches the subject: je me lave, tu te laves, il se lave.',
  },
};
