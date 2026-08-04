export function normalizeLemmaKey(word) {
  return String(word ?? '').trim().toLowerCase().normalize('NFC');
}

function tokenizeFrenchText(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[«»"'.!,;:?]/g, ' ')
    .split(/\s+/)
    .flatMap((token) => {
      const cleaned = token.trim();
      if (!cleaned) return [];

      const elision = cleaned.match(/^(l|d|j|n|m|t|s|c|qu)'(.+)$/);
      if (elision) {
        return [elision[1], elision[2]];
      }

      return [cleaned];
    })
    .filter(Boolean);
}

const IRREGULAR_PRESENT = {
  aller: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
  être: ['suis', 'es', 'est', 'sommes', 'êtes', 'etes', 'sont'],
  etre: ['suis', 'es', 'est', 'sommes', 'êtes', 'etes', 'sont'],
  avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
  faire: ['fais', 'fait', 'faisons', 'faites', 'font'],
  venir: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
  prendre: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
  pouvoir: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
  vouloir: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
  savoir: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
  voir: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
  dire: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
  devoir: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'],
  mettre: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
  tenir: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'],
  partir: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
  sortir: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'],
  dormir: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
  ouvrir: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
  écrire: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
  ecrire: ['ecris', 'ecris', 'ecrit', 'ecrivons', 'ecrivez', 'ecrivent'],
  lire: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
  boire: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'],
  connaître: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'],
  connaitre: ['connais', 'connais', 'connait', 'connaissons', 'connaissez', 'connaissent'],
};

function addRegularPresentForms(lemma, forms) {
  if (lemma.endsWith('er')) {
    const stem = lemma.slice(0, -2);
    for (const ending of ['e', 'es', 'e', 'ons', 'ez', 'ent']) {
      forms.add(stem + ending);
    }
    return;
  }

  if (lemma.endsWith('ir')) {
    const stem = lemma.slice(0, -2);
    for (const ending of ['is', 'is', 'it', 'issons', 'issez', 'issent']) {
      forms.add(stem + ending);
    }
    return;
  }

  if (lemma.endsWith('re')) {
    const stem = lemma.slice(0, -2);
    for (const ending of ['s', 's', '', 'ons', 'ez', 'ent']) {
      forms.add(stem + ending);
    }
  }
}

export function getTargetWordSurfaceForms(word) {
  const lemma = normalizeLemmaKey(word);
  const forms = new Set();

  if (!lemma) return [];

  forms.add(lemma);

  const irregular = IRREGULAR_PRESENT[lemma];
  if (irregular) {
    for (const form of irregular) {
      forms.add(normalizeLemmaKey(form));
    }
  } else {
    addRegularPresentForms(lemma, forms);
  }

  if (lemma.startsWith("j'")) {
    forms.add(normalizeLemmaKey(lemma.slice(2)));
  }

  return [...forms].filter(Boolean);
}

export function sentenceUsesTargetWord(sentence, targetWord) {
  const forms = getTargetWordSurfaceForms(targetWord);
  if (forms.length === 0) return false;

  const tokens = new Set(tokenizeFrenchText(sentence));
  const lower = String(sentence ?? '').toLowerCase().normalize('NFC');

  return forms.some((form) => {
    if (!form) return false;
    if (tokens.has(form)) return true;
    if (lower.includes(form)) return true;
    if (form.startsWith("j'") && lower.includes(form.slice(2))) return true;
    return false;
  });
}

export function sentenceUsesAllTargetWords(sentence, targetWords) {
  if (!targetWords?.length) return true;
  return targetWords.every((word) => sentenceUsesTargetWord(sentence, word));
}
