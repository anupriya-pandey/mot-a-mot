import type { PartOfSpeech } from '../types/toolbox';

export type RecommendationTier = 1 | 2 | 3;

export interface ToolboxRecommendationCandidate {
  lemma: string;
  surface: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  example: string;
  tier: RecommendationTier;
}

/** Curated stretch words — tiered and spread across grammatical functions. */
export const TOOLBOX_RECOMMENDATION_POOL: ToolboxRecommendationCandidate[] = [
  // Tier 1 — essentials
  { lemma: 'bonjour', surface: 'bonjour', meaning: 'hello / good day', partOfSpeech: 'Expressions', example: 'Bonjour, comment ça va ?', tier: 1 },
  { lemma: 'merci', surface: 'merci', meaning: 'thank you', partOfSpeech: 'Expressions', example: 'Merci beaucoup !', tier: 1 },
  { lemma: 'manger', surface: 'manger', meaning: 'to eat', partOfSpeech: 'Verbs', example: 'Je mange une pomme.', tier: 1 },
  { lemma: 'maison', surface: 'maison', meaning: 'house / home', partOfSpeech: 'Nouns', example: 'Je rentre à la maison.', tier: 1 },
  { lemma: 'grand', surface: 'grand', meaning: 'big / tall', partOfSpeech: 'Adjectives', example: 'C\'est un grand parc.', tier: 1 },
  { lemma: 'très', surface: 'très', meaning: 'very', partOfSpeech: 'Adverbs', example: 'Il fait très froid.', tier: 1 },
  { lemma: 'je', surface: 'je', meaning: 'I', partOfSpeech: 'Pronouns', example: 'Je suis prêt.', tier: 1 },
  { lemma: 'le', surface: 'le', meaning: 'the (masculine)', partOfSpeech: 'Articles / Determiners', example: 'Le chat dort.', tier: 1 },
  { lemma: 'un', surface: 'un', meaning: 'a / one', partOfSpeech: 'Articles / Determiners', example: 'J\'ai un livre.', tier: 1 },
  { lemma: 'avec', surface: 'avec', meaning: 'with', partOfSpeech: 'Prepositions', example: 'Je viens avec toi.', tier: 1 },
  { lemma: 'et', surface: 'et', meaning: 'and', partOfSpeech: 'Conjunctions', example: 'Du pain et du fromage.', tier: 1 },
  { lemma: 'pas', surface: 'pas', meaning: 'not (negation)', partOfSpeech: 'Negation Particles', example: 'Je ne sais pas.', tier: 1 },
  { lemma: 'se', surface: 'se', meaning: 'oneself (reflexive)', partOfSpeech: 'Reflexive Pronouns', example: 'Il se lève tôt.', tier: 1 },

  // Tier 2 — expanding
  { lemma: 'réserver', surface: 'réserver', meaning: 'to book / reserve', partOfSpeech: 'Verbs', example: 'Je voudrais réserver une table.', tier: 2 },
  { lemma: 'travail', surface: 'travail', meaning: 'work (noun)', partOfSpeech: 'Nouns', example: 'Mon travail est intéressant.', tier: 2 },
  { lemma: 'important', surface: 'important', meaning: 'important', partOfSpeech: 'Adjectives', example: 'C\'est une décision importante.', tier: 2 },
  { lemma: 'souvent', surface: 'souvent', meaning: 'often', partOfSpeech: 'Adverbs', example: 'Je vais souvent au cinéma.', tier: 2 },
  { lemma: 'nous', surface: 'nous', meaning: 'we', partOfSpeech: 'Pronouns', example: 'Nous partons demain.', tier: 2 },
  { lemma: 'cette', surface: 'cette', meaning: 'this (feminine)', partOfSpeech: 'Articles / Determiners', example: 'Cette idée me plaît.', tier: 2 },
  { lemma: 'pendant', surface: 'pendant', meaning: 'during / for', partOfSpeech: 'Prepositions', example: 'Pendant les vacances.', tier: 2 },
  { lemma: 'parce que', surface: 'parce que', meaning: 'because', partOfSpeech: 'Conjunctions', example: 'Je reste parce que je suis fatigué.', tier: 2 },
  { lemma: 'ne...pas', surface: 'ne...pas', meaning: 'not (negation frame)', partOfSpeech: 'Negation Particles', example: 'Je ne parle pas anglais.', tier: 2 },
  { lemma: 'me', surface: 'me', meaning: 'me (reflexive / object)', partOfSpeech: 'Reflexive Pronouns', example: 'Je me repose.', tier: 2 },
  { lemma: 's\'il vous plaît', surface: 's\'il vous plaît', meaning: 'please (formal)', partOfSpeech: 'Expressions', example: 'Un café, s\'il vous plaît.', tier: 2 },
  { lemma: 'chez', surface: 'chez', meaning: 'at someone\'s place', partOfSpeech: 'Prepositions', example: 'Je dîne chez mes parents.', tier: 2 },

  // Tier 3 — richer repertoire
  { lemma: 'entreprendre', surface: 'entreprendre', meaning: 'to undertake / start', partOfSpeech: 'Verbs', example: 'Elle veut entreprendre un projet.', tier: 3 },
  { lemma: 'opportunité', surface: 'opportunité', meaning: 'opportunity', partOfSpeech: 'Nouns', example: 'C\'est une belle opportunité.', tier: 3 },
  { lemma: 'considérable', surface: 'considérable', meaning: 'considerable / significant', partOfSpeech: 'Adjectives', example: 'Un progrès considérable.', tier: 3 },
  { lemma: 'néanmoins', surface: 'néanmoins', meaning: 'nevertheless', partOfSpeech: 'Adverbs', example: 'Il pleut ; néanmoins, nous sortons.', tier: 3 },
  { lemma: 'celui', surface: 'celui', meaning: 'the one (demonstrative)', partOfSpeech: 'Pronouns', example: 'Celui que j\'aime.', tier: 3 },
  { lemma: 'chaque', surface: 'chaque', meaning: 'each / every', partOfSpeech: 'Articles / Determiners', example: 'Chaque jour compte.', tier: 3 },
  { lemma: 'malgré', surface: 'malgré', meaning: 'despite', partOfSpeech: 'Prepositions', example: 'Malgré la pluie, il sourit.', tier: 3 },
  { lemma: 'bien que', surface: 'bien que', meaning: 'although', partOfSpeech: 'Conjunctions', example: 'Bien qu\'il soit tard, je lis.', tier: 3 },
  { lemma: 'jamais', surface: 'jamais', meaning: 'never', partOfSpeech: 'Negation Particles', example: 'Je n\'ai jamais visité Lyon.', tier: 3 },
  { lemma: 's\'y', surface: 's\'y', meaning: 'there (reflexive / locative)', partOfSpeech: 'Reflexive Pronouns', example: 'Il s\'y sent chez lui.', tier: 3 },
  { lemma: 'avoir l\'air', surface: 'avoir l\'air', meaning: 'to seem / look', partOfSpeech: 'Expressions', example: 'Tu as l\'air fatigué.', tier: 3 },
  { lemma: 'cependant', surface: 'cependant', meaning: 'however', partOfSpeech: 'Adverbs', example: 'C\'est difficile ; cependant, j\'essaie.', tier: 2 },
  { lemma: 'leur', surface: 'leur', meaning: 'their / to them', partOfSpeech: 'Pronouns', example: 'Je leur téléphone ce soir.', tier: 2 },
  { lemma: 'donc', surface: 'donc', meaning: 'therefore / so', partOfSpeech: 'Conjunctions', example: 'Il pleut, donc je reste.', tier: 2 },

  // Extra tier 1–2 picks so Grow Your Toolbox can always offer 10 fresh words
  { lemma: 'boire', surface: 'boire', meaning: 'to drink', partOfSpeech: 'Verbs', example: 'Je bois un café le matin.', tier: 1 },
  { lemma: 'parler', surface: 'parler', meaning: 'to speak', partOfSpeech: 'Verbs', example: 'Nous parlons français en classe.', tier: 1 },
  { lemma: 'aimer', surface: 'aimer', meaning: 'to like / love', partOfSpeech: 'Verbs', example: 'J\'aime cette chanson.', tier: 1 },
  { lemma: 'chat', surface: 'chat', meaning: 'cat', partOfSpeech: 'Nouns', example: 'Le chat dort sur le canapé.', tier: 1 },
  { lemma: 'livre', surface: 'livre', meaning: 'book', partOfSpeech: 'Nouns', example: 'Je lis un livre intéressant.', tier: 1 },
  { lemma: 'petit', surface: 'petit', meaning: 'small / little', partOfSpeech: 'Adjectives', example: 'C\'est un petit village.', tier: 1 },
  { lemma: 'bien', surface: 'bien', meaning: 'well / good', partOfSpeech: 'Adverbs', example: 'Elle chante très bien.', tier: 1 },
  { lemma: 'tu', surface: 'tu', meaning: 'you (informal)', partOfSpeech: 'Pronouns', example: 'Tu viens ce soir ?', tier: 1 },
  { lemma: 'la', surface: 'la', meaning: 'the (feminine)', partOfSpeech: 'Articles / Determiners', example: 'La porte est ouverte.', tier: 1 },
  { lemma: 'de', surface: 'de', meaning: 'of / from', partOfSpeech: 'Prepositions', example: 'Je viens de Lyon.', tier: 1 },
  { lemma: 'ou', surface: 'ou', meaning: 'or', partOfSpeech: 'Conjunctions', example: 'Thé ou café ?', tier: 1 },
  { lemma: 'plus', surface: 'plus', meaning: 'more / no longer', partOfSpeech: 'Negation Particles', example: 'Je n\'en veux plus.', tier: 1 },
  { lemma: 'moi', surface: 'moi', meaning: 'me (stressed)', partOfSpeech: 'Reflexive Pronouns', example: 'Il m\'a parlé à moi.', tier: 1 },
  { lemma: 'au revoir', surface: 'au revoir', meaning: 'goodbye', partOfSpeech: 'Expressions', example: 'Au revoir et à bientôt !', tier: 1 },
  { lemma: 'habiter', surface: 'habiter', meaning: 'to live (reside)', partOfSpeech: 'Verbs', example: 'J\'habite près de la gare.', tier: 2 },
  { lemma: 'travailler', surface: 'travailler', meaning: 'to work', partOfSpeech: 'Verbs', example: 'Je travaille à l\'hôpital.', tier: 2 },
  { lemma: 'école', surface: 'école', meaning: 'school', partOfSpeech: 'Nouns', example: 'Les enfants vont à l\'école.', tier: 2 },
  { lemma: 'heureux', surface: 'heureux', meaning: 'happy', partOfSpeech: 'Adjectives', example: 'Il est heureux aujourd\'hui.', tier: 2 },
  { lemma: 'demain', surface: 'demain', meaning: 'tomorrow', partOfSpeech: 'Adverbs', example: 'Nous partons demain matin.', tier: 2 },
  { lemma: 'vous', surface: 'vous', meaning: 'you (formal / plural)', partOfSpeech: 'Pronouns', example: 'Vous parlez français ?', tier: 2 },
  { lemma: 'des', surface: 'des', meaning: 'some (plural)', partOfSpeech: 'Articles / Determiners', example: 'J\'achète des pommes.', tier: 2 },
  { lemma: 'sans', surface: 'sans', meaning: 'without', partOfSpeech: 'Prepositions', example: 'Je bois du thé sans sucre.', tier: 2 },
  { lemma: 'mais', surface: 'mais', meaning: 'but', partOfSpeech: 'Conjunctions', example: 'Il est tard, mais je lis encore.', tier: 2 },
  { lemma: 'rien', surface: 'rien', meaning: 'nothing', partOfSpeech: 'Negation Particles', example: 'Je ne vois rien.', tier: 2 },
  { lemma: 'en', surface: 'en', meaning: 'of it / some', partOfSpeech: 'Reflexive Pronouns', example: 'J\'en ai besoin.', tier: 2 },
  { lemma: 'de rien', surface: 'de rien', meaning: 'you\'re welcome', partOfSpeech: 'Expressions', example: 'Merci ! — De rien.', tier: 2 },
];
