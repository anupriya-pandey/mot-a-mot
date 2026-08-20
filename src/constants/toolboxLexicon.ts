import type { PartOfSpeech } from '../types/toolbox';
import {
  TOOLBOX_RECOMMENDATION_POOL,
  type RecommendationTier,
  type ToolboxRecommendationCandidate,
} from './toolboxRecommendationPool';

export type { RecommendationTier, ToolboxRecommendationCandidate };

type LexiconSeed = [lemma: string, meaning: string, partOfSpeech: PartOfSpeech, tier: RecommendationTier];

function buildExample(lemma: string, partOfSpeech: PartOfSpeech): string {
  switch (partOfSpeech) {
    case 'Verbs':
      return `Je ${lemma.endsWith('er') ? lemma.replace(/er$/, 'e') : lemma} …`;
    case 'Nouns':
      return `Voici ${/^[aeiouhâêîôùûéèëïü]/i.test(lemma) ? "l'" : 'le '}${lemma}.`;
    case 'Adjectives':
      return `C'est ${/^[aeiouhâêîôùûéèëïü]/i.test(lemma) ? "l'" : ''}${lemma}.`;
    case 'Adverbs':
      return `Il parle ${lemma}.`;
    case 'Pronouns':
      return `${lemma.charAt(0).toUpperCase()}${lemma.slice(1)} …`;
    case 'Articles / Determiners':
      return `${lemma.charAt(0).toUpperCase()}${lemma.slice(1)} …`;
    case 'Prepositions':
      return `Je vais ${lemma} …`;
    case 'Conjunctions':
      return `… ${lemma} …`;
    case 'Expressions':
      return `${lemma.charAt(0).toUpperCase()}${lemma.slice(1)} !`;
    case 'Negation Particles':
      return `Je ne … ${lemma}.`;
    case 'Reflexive Pronouns':
      return `… ${lemma} …`;
    default:
      return `${lemma.charAt(0).toUpperCase()}${lemma.slice(1)}.`;
  }
}

function seedsToCandidates(seeds: LexiconSeed[]): ToolboxRecommendationCandidate[] {
  return seeds.map(([lemma, meaning, partOfSpeech, tier]) => ({
    lemma,
    surface: lemma,
    meaning,
    partOfSpeech,
    tier,
    example: buildExample(lemma, partOfSpeech),
  }));
}

/** Dynamically expanded A1–B2 lexicon — scored against the learner's toolbox at runtime. */
const DYNAMIC_LEXICON_SEEDS: LexiconSeed[] = [
  // Verbs — tier 1
  ['avoir', 'to have', 'Verbs', 1],
  ['aller', 'to go', 'Verbs', 1],
  ['faire', 'to do / make', 'Verbs', 1],
  ['venir', 'to come', 'Verbs', 1],
  ['prendre', 'to take', 'Verbs', 1],
  ['vouloir', 'to want', 'Verbs', 1],
  ['pouvoir', 'to be able to', 'Verbs', 1],
  ['devoir', 'to have to / must', 'Verbs', 1],
  ['savoir', 'to know (fact)', 'Verbs', 1],
  ['dire', 'to say', 'Verbs', 1],
  ['mettre', 'to put', 'Verbs', 1],
  ['passer', 'to pass / spend', 'Verbs', 1],
  ['donner', 'to give', 'Verbs', 1],
  ['demander', 'to ask', 'Verbs', 1],
  ['trouver', 'to find', 'Verbs', 1],
  ['regarder', 'to watch', 'Verbs', 1],
  ['écouter', 'to listen', 'Verbs', 1],
  ['chercher', 'to look for', 'Verbs', 1],
  ['attendre', 'to wait', 'Verbs', 1],
  ['comprendre', 'to understand', 'Verbs', 1],
  // Verbs — tier 2
  ['apprendre', 'to learn', 'Verbs', 2],
  ['enseigner', 'to teach', 'Verbs', 2],
  ['répondre', 'to answer', 'Verbs', 2],
  ['expliquer', 'to explain', 'Verbs', 2],
  ['préparer', 'to prepare', 'Verbs', 2],
  ['ouvrir', 'to open', 'Verbs', 2],
  ['fermer', 'to close', 'Verbs', 2],
  ['commencer', 'to begin', 'Verbs', 2],
  ['continuer', 'to continue', 'Verbs', 2],
  ['arrêter', 'to stop', 'Verbs', 2],
  ['rester', 'to stay', 'Verbs', 2],
  ['partir', 'to leave', 'Verbs', 2],
  ['arriver', 'to arrive', 'Verbs', 2],
  ['tomber', 'to fall', 'Verbs', 2],
  ['monter', 'to go up', 'Verbs', 2],
  ['descendre', 'to go down', 'Verbs', 2],
  ['porter', 'to carry / wear', 'Verbs', 2],
  ['essayer', 'to try', 'Verbs', 2],
  ['utiliser', 'to use', 'Verbs', 2],
  ['préférer', 'to prefer', 'Verbs', 2],
  // Verbs — tier 3
  ['réussir', 'to succeed', 'Verbs', 3],
  ['échouer', 'to fail', 'Verbs', 3],
  ['améliorer', 'to improve', 'Verbs', 3],
  ['organiser', 'to organise', 'Verbs', 3],
  ['participer', 'to participate', 'Verbs', 3],
  ['recommander', 'to recommend', 'Verbs', 3],
  ['suggérer', 'to suggest', 'Verbs', 3],
  ['accepter', 'to accept', 'Verbs', 3],
  ['refuser', 'to refuse', 'Verbs', 3],
  ['développer', 'to develop', 'Verbs', 3],

  // Nouns — tier 1
  ['eau', 'water', 'Nouns', 1],
  ['jour', 'day', 'Nouns', 1],
  ['temps', 'time / weather', 'Nouns', 1],
  ['homme', 'man', 'Nouns', 1],
  ['femme', 'woman', 'Nouns', 1],
  ['enfant', 'child', 'Nouns', 1],
  ['ami', 'friend (m)', 'Nouns', 1],
  ['amie', 'friend (f)', 'Nouns', 1],
  ['famille', 'family', 'Nouns', 1],
  ['travail', 'work', 'Nouns', 1],
  ['pays', 'country', 'Nouns', 1],
  ['rue', 'street', 'Nouns', 1],
  ['porte', 'door', 'Nouns', 1],
  ['table', 'table', 'Nouns', 1],
  ['chaise', 'chair', 'Nouns', 1],
  ['chien', 'dog', 'Nouns', 1],
  ['oiseau', 'bird', 'Nouns', 1],
  ['fruit', 'fruit', 'Nouns', 1],
  ['pomme', 'apple', 'Nouns', 1],
  ['orange', 'orange', 'Nouns', 1],
  // Nouns — tier 2
  ['magasin', 'shop', 'Nouns', 2],
  ['boulangerie', 'bakery', 'Nouns', 2],
  ['banque', 'bank', 'Nouns', 2],
  ['gare', 'train station', 'Nouns', 2],
  ['aéroport', 'airport', 'Nouns', 2],
  ['hôtel', 'hotel', 'Nouns', 2],
  ['université', 'university', 'Nouns', 2],
  ['bureau', 'office / desk', 'Nouns', 2],
  ['professeur', 'teacher', 'Nouns', 2],
  ['docteur', 'doctor', 'Nouns', 2],
  ['voisin', 'neighbour', 'Nouns', 2],
  ['voisine', 'neighbour (f)', 'Nouns', 2],
  ['oncle', 'uncle', 'Nouns', 2],
  ['tante', 'aunt', 'Nouns', 2],
  ['frère', 'brother', 'Nouns', 2],
  ['soeur', 'sister', 'Nouns', 2],
  ['mère', 'mother', 'Nouns', 2],
  ['père', 'father', 'Nouns', 2],
  ['film', 'film / movie', 'Nouns', 2],
  ['musique', 'music', 'Nouns', 2],
  // Nouns — tier 3
  ['environnement', 'environment', 'Nouns', 3],
  ['expérience', 'experience', 'Nouns', 3],
  ['information', 'information', 'Nouns', 3],
  ['décision', 'decision', 'Nouns', 3],
  ['discussion', 'discussion', 'Nouns', 3],
  ['réunion', 'meeting', 'Nouns', 3],
  ['organisation', 'organisation', 'Nouns', 3],
  ['situation', 'situation', 'Nouns', 3],
  ['condition', 'condition', 'Nouns', 3],
  ['relation', 'relationship', 'Nouns', 3],

  // Adjectives
  ['nouveau', 'new', 'Adjectives', 1],
  ['bon', 'good', 'Adjectives', 1],
  ['mauvais', 'bad', 'Adjectives', 1],
  ['beau', 'beautiful', 'Adjectives', 1],
  ['belle', 'beautiful (f)', 'Adjectives', 1],
  ['long', 'long', 'Adjectives', 1],
  ['court', 'short', 'Adjectives', 1],
  ['blanc', 'white', 'Adjectives', 1],
  ['noir', 'black', 'Adjectives', 1],
  ['rouge', 'red', 'Adjectives', 1],
  ['bleu', 'blue', 'Adjectives', 1],
  ['vert', 'green', 'Adjectives', 1],
  ['riche', 'rich', 'Adjectives', 2],
  ['pauvre', 'poor', 'Adjectives', 2],
  ['propre', 'clean', 'Adjectives', 2],
  ['sale', 'dirty', 'Adjectives', 2],
  ['proche', 'near / close', 'Adjectives', 2],
  ['loin', 'far', 'Adjectives', 2],
  ['possible', 'possible', 'Adjectives', 2],
  ['impossible', 'impossible', 'Adjectives', 2],
  ['nécessaire', 'necessary', 'Adjectives', 3],
  ['suffisant', 'sufficient', 'Adjectives', 3],

  // Adverbs
  ['peu', 'little / few', 'Adverbs', 1],
  ['beaucoup', 'a lot', 'Adverbs', 1],
  ['aussi', 'also / too', 'Adverbs', 1],
  ['très', 'very', 'Adverbs', 1],
  ['plus', 'more', 'Adverbs', 1],
  ['moins', 'less', 'Adverbs', 1],
  ['encore', 'still / again', 'Adverbs', 1],
  ['déjà', 'already', 'Adverbs', 2],
  ['bientôt', 'soon', 'Adverbs', 2],
  ['parfois', 'sometimes', 'Adverbs', 2],
  ['souvent', 'often', 'Adverbs', 2],
  ['rarement', 'rarely', 'Adverbs', 2],
  ['ensemble', 'together', 'Adverbs', 2],
  ['seulement', 'only', 'Adverbs', 2],
  ['probablement', 'probably', 'Adverbs', 3],
  ['certainement', 'certainly', 'Adverbs', 3],

  // Pronouns
  ['moi', 'me', 'Pronouns', 1],
  ['toi', 'you (stressed)', 'Pronouns', 1],
  ['lui', 'him', 'Pronouns', 1],
  ['eux', 'them (m)', 'Pronouns', 2],
  ['celui', 'the one (m)', 'Pronouns', 3],
  ['celle', 'the one (f)', 'Pronouns', 3],
  ['ceux', 'the ones (m pl)', 'Pronouns', 3],
  ['celles', 'the ones (f pl)', 'Pronouns', 3],

  // Articles / determiners
  ['du', 'some (m)', 'Articles / Determiners', 1],
  ['de la', 'some (f)', 'Articles / Determiners', 1],
  ['au', 'to the (m)', 'Articles / Determiners', 1],
  ['aux', 'to the (pl)', 'Articles / Determiners', 2],
  ['chaque', 'each / every', 'Articles / Determiners', 2],
  ['plusieurs', 'several', 'Articles / Determiners', 2],
  ['quelque', 'some', 'Articles / Determiners', 3],
  ['aucun', 'none / not any', 'Articles / Determiners', 3],

  // Prepositions
  ['à', 'to / at', 'Prepositions', 1],
  ['en', 'in', 'Prepositions', 1],
  ['vers', 'towards', 'Prepositions', 2],
  ['contre', 'against', 'Prepositions', 2],
  ['depuis', 'since', 'Prepositions', 2],
  ['jusqu\'à', 'until', 'Prepositions', 2],
  ['selon', 'according to', 'Prepositions', 3],
  ['malgré', 'despite', 'Prepositions', 3],

  // Conjunctions
  ['ou', 'or', 'Conjunctions', 1],
  ['donc', 'therefore', 'Conjunctions', 2],
  ['puis', 'then', 'Conjunctions', 2],
  ['alors', 'so / then', 'Conjunctions', 2],
  ['tandis que', 'while', 'Conjunctions', 3],
  ['lorsque', 'when', 'Conjunctions', 3],

  // Expressions
  ['s\'il te plaît', 'please (informal)', 'Expressions', 1],
  ['enchanté', 'nice to meet you', 'Expressions', 1],
  ['à demain', 'see you tomorrow', 'Expressions', 1],
  ['bonne nuit', 'good night', 'Expressions', 1],
  ['bon appétit', 'enjoy your meal', 'Expressions', 1],
  ['bonne chance', 'good luck', 'Expressions', 2],
  ['bon voyage', 'have a good trip', 'Expressions', 2],
  ['félicitations', 'congratulations', 'Expressions', 3],

  // Negation
  ['ne...jamais', 'never', 'Negation Particles', 2],
  ['ne...plus', 'no longer', 'Negation Particles', 2],
  ['ne...rien', 'nothing', 'Negation Particles', 2],

  // Reflexive
  ['m\'', 'me (before vowel)', 'Reflexive Pronouns', 1],
  ['t\'', 'you (before vowel)', 'Reflexive Pronouns', 1],
  ['s\'', 'oneself (before vowel)', 'Reflexive Pronouns', 1],
];

const FEATURED_KEYS = new Set(
  TOOLBOX_RECOMMENDATION_POOL.map((item) => `${item.lemma.trim().toLowerCase()}|${item.partOfSpeech}`),
);

function mergeLexicon(): ToolboxRecommendationCandidate[] {
  const merged = new Map<string, ToolboxRecommendationCandidate>();

  for (const candidate of seedsToCandidates(DYNAMIC_LEXICON_SEEDS)) {
    merged.set(`${candidate.lemma.trim().toLowerCase()}|${candidate.partOfSpeech}`, candidate);
  }

  for (const candidate of TOOLBOX_RECOMMENDATION_POOL) {
    merged.set(`${candidate.lemma.trim().toLowerCase()}|${candidate.partOfSpeech}`, candidate);
  }

  return [...merged.values()];
}

/** Full dynamic lexicon — curated picks override generated entries with richer examples. */
export const TOOLBOX_DYNAMIC_LEXICON = mergeLexicon();

export function isFeaturedRecommendation(candidate: ToolboxRecommendationCandidate): boolean {
  return FEATURED_KEYS.has(`${candidate.lemma.trim().toLowerCase()}|${candidate.partOfSpeech}`);
}

export function lexiconSize(): number {
  return TOOLBOX_DYNAMIC_LEXICON.length;
}
