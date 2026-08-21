import type { VocabularyEntry } from '../types/toolbox';

const VAGUE_MEANING_PATTERNS = [
  /^common expression related to/i,
  /^example phrase related to/i,
  /^related to/i,
];

const FRENCH_ARTICLE_MAP: Record<string, string> = {
  ma: 'my',
  mon: 'my',
  mes: 'my',
  ta: 'your',
  ton: 'your',
  tes: 'your',
  sa: 'his/her',
  son: 'his/her',
  ses: 'his/her',
  notre: 'our',
  nos: 'our',
  votre: 'your',
  vos: 'your',
  leur: 'their',
  leurs: 'their',
  la: 'the',
  le: 'the',
  les: 'the',
  un: 'a',
  une: 'a',
  des: 'some',
  du: 'some',
  de: 'of',
  au: 'to the',
  aux: 'to the',
};

function normalizeLemma(lemma: string): string {
  return lemma.trim().toLowerCase();
}

function primaryMeaning(entry: Pick<VocabularyEntry, 'meaning'>): string {
  return String(entry.meaning ?? '')
    .split(/[;,/]|(\s+or\s+)/i)[0]
    .trim();
}

export function isVagueMeaning(meaning: string): boolean {
  const value = meaning.trim();
  if (!value) return true;
  return VAGUE_MEANING_PATTERNS.some((pattern) => pattern.test(value));
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:'"«»]/g, '');
}

function lookupWordMeaning(word: string, pool: VocabularyEntry[]): string | null {
  const bare = stripPunctuation(word);
  if (!bare) return null;

  const entry = pool.find((item) => normalizeLemma(item.lemma) === normalizeLemma(bare));
  if (!entry) return null;

  const meaning = primaryMeaning(entry);
  if (isVagueMeaning(meaning)) return null;
  return meaning.replace(/^to\s+/i, '').trim();
}

function translateWordChunk(frenchPart: string, pool: VocabularyEntry[]): string | null {
  const words = frenchPart.trim().split(/\s+/).filter(Boolean);
  const parts: string[] = [];

  for (const word of words) {
    const bare = stripPunctuation(word);
    const lower = bare.toLowerCase();
    if (!bare) continue;

    if (FRENCH_ARTICLE_MAP[lower]) {
      parts.push(FRENCH_ARTICLE_MAP[lower]);
      continue;
    }

    const meaning = lookupWordMeaning(bare, pool);
    if (!meaning) return null;
    parts.push(meaning);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

export function inferPhraseMeaningFromPool(phrase: string, pool: VocabularyEntry[]): string | null {
  const clean = phrase.trim().replace(/[.!?]+$/, '');
  if (!clean) return null;

  const jeDois = clean.match(/^je\s+dois\s+(.+)$/i);
  if (jeDois) {
    const translated = translateWordChunk(jeDois[1], pool);
    return translated ? `I have to ${translated}` : null;
  }

  const jeVais = clean.match(/^je\s+vais\s+(.+)$/i);
  if (jeVais) {
    const translated = translateWordChunk(jeVais[1], pool);
    return translated ? `I am going to ${translated}` : null;
  }

  const ilFaut = clean.match(/^il\s+faut\s+(.+)$/i);
  if (ilFaut) {
    const translated = translateWordChunk(ilFaut[1], pool);
    return translated ? `It is necessary to ${translated}` : null;
  }

  const jeSuis = clean.match(/^je\s+suis\s+(.+)$/i);
  if (jeSuis) {
    const translated = translateWordChunk(jeSuis[1], pool);
    return translated ? `I am ${translated}` : null;
  }

  return null;
}

export function deriveExpressionMeaning(
  phrase: string,
  pool: VocabularyEntry[],
  anchor?: VocabularyEntry,
): string {
  const inferred = inferPhraseMeaningFromPool(phrase, pool);
  if (inferred) return inferred;

  if (anchor) {
    const anchorMeaning = primaryMeaning(anchor);
    if (!isVagueMeaning(anchorMeaning) && /^to\s+/i.test(anchorMeaning)) {
      return `I ${anchorMeaning.replace(/^to\s+/i, '')}`;
    }
    if (!isVagueMeaning(anchorMeaning)) {
      return anchorMeaning;
    }
  }

  return phrase;
}
