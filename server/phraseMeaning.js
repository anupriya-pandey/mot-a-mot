const VAGUE_MEANING_PATTERNS = [
  /^common expression related to/i,
  /^example phrase related to/i,
  /^related to/i,
];

const FRENCH_ARTICLE_MAP = {
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

const PHRASE_MEANING_DISTRACTORS = [
  'I have to leave now',
  'I am going to the store',
  'She wants to eat dinner',
  'We need to study tonight',
  'He must finish his homework',
  'They are going to the park',
];

function normalizeLemma(lemma) {
  return String(lemma ?? '').trim().toLowerCase().normalize('NFC');
}

export function primaryMeaning(entry) {
  return String(entry?.meaning ?? '')
    .split(/[;,/]|(\s+or\s+)/i)[0]
    .trim();
}

export function isVagueMeaning(meaning) {
  const value = String(meaning ?? '').trim();
  if (!value) return true;
  return VAGUE_MEANING_PATTERNS.some((pattern) => pattern.test(value));
}

export function isPhraseLemma(lemma) {
  return String(lemma ?? '').trim().split(/\s+/).length >= 2;
}

export function isPhraseLikeEnglish(meaning) {
  const value = String(meaning ?? '').trim();
  if (!value) return false;
  const words = value.split(/\s+/);
  return (
    words.length >= 3 ||
    /^I (am|have|must|need|want|going|would|can|should)\b/i.test(value) ||
    /^It is\b/i.test(value) ||
    /^We (are|have|need|must)\b/i.test(value) ||
    /^She (is|has|wants|needs)\b/i.test(value) ||
    /^He (is|has|wants|needs|must)\b/i.test(value)
  );
}

function stripPunctuation(word) {
  return String(word ?? '').replace(/[.,!?;:'"«»]/g, '');
}

function lookupWordMeaning(word, pool) {
  const bare = stripPunctuation(word);
  if (!bare) return null;

  const key = normalizeLemma(bare);
  const entry = pool.find((item) => normalizeLemma(item.lemma) === key);
  if (!entry) return null;

  const meaning = primaryMeaning(entry);
  if (isVagueMeaning(meaning)) return null;
  return meaning.replace(/^to\s+/i, '').trim();
}

function translateWordChunk(frenchPart, pool) {
  const words = frenchPart.trim().split(/\s+/).filter(Boolean);
  const parts = [];

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

export function inferPhraseMeaningFromPool(phrase, pool) {
  const clean = String(phrase ?? '').trim().replace(/[.!?]+$/, '');
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

  const jeVeux = clean.match(/^je\s+veux\s+(.+)$/i);
  if (jeVeux) {
    const translated = translateWordChunk(jeVeux[1], pool);
    return translated ? `I want to ${translated}` : null;
  }

  return null;
}

export function resolveMeaningForQuiz(entry, pool) {
  const stored = primaryMeaning(entry);
  if (stored && !isVagueMeaning(stored)) {
    if (isPhraseLemma(entry.lemma) && !isPhraseLikeEnglish(stored)) {
      const inferred = inferPhraseMeaningFromPool(entry.lemma, pool);
      if (inferred) return inferred;
      return null;
    }
    return stored;
  }

  if (isPhraseLemma(entry.lemma)) {
    return inferPhraseMeaningFromPool(entry.lemma, pool);
  }

  return null;
}

export function buildPhraseMeaningDistractors(entry, pool, correctMeaning) {
  const used = new Set([correctMeaning.toLowerCase()]);
  const distractors = [];
  const phraseMode = isPhraseLemma(entry.lemma);

  for (const candidate of pool) {
    if (candidate.lemma === entry.lemma) continue;

    const meaning = resolveMeaningForQuiz(candidate, pool);
    if (!meaning || isVagueMeaning(meaning)) continue;

    const key = meaning.toLowerCase();
    if (used.has(key)) continue;

    if (phraseMode && !isPhraseLikeEnglish(meaning)) continue;
    if (!phraseMode && isPhraseLikeEnglish(meaning) && isPhraseLemma(candidate.lemma)) continue;

    used.add(key);
    distractors.push(meaning);
    if (distractors.length >= 3) break;
  }

  if (phraseMode) {
    for (const fallback of PHRASE_MEANING_DISTRACTORS) {
      if (distractors.length >= 3) break;
      const key = fallback.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      distractors.push(fallback);
    }
  }

  return distractors;
}
