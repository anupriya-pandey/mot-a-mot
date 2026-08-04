function normalizeLemma(word: string): string {
  return word.trim().toLowerCase().normalize('NFC');
}

const IRREGULAR_PRESENT: Record<string, string[]> = {
  aller: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
  être: ['suis', 'es', 'est', 'sommes', 'êtes', 'etes', 'sont'],
  etre: ['suis', 'es', 'est', 'sommes', 'êtes', 'etes', 'sont'],
  avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
  faire: ['fais', 'fait', 'faisons', 'faites', 'font'],
};

function addRegularPresentForms(lemma: string, forms: Set<string>) {
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

function getTargetWordSurfaceForms(word: string): string[] {
  const lemma = normalizeLemma(word);
  const forms = new Set<string>();
  if (!lemma) return [];

  forms.add(lemma);

  const irregular = IRREGULAR_PRESENT[lemma];
  if (irregular) {
    for (const form of irregular) {
      forms.add(normalizeLemma(form));
    }
  } else {
    addRegularPresentForms(lemma, forms);
  }

  return [...forms].filter(Boolean);
}

function tokenizeFrenchText(text: string): string[] {
  return text
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

export function sentenceUsesTargetWord(sentence: string, targetWord: string): boolean {
  const forms = getTargetWordSurfaceForms(targetWord);
  if (forms.length === 0) return false;

  const tokens = new Set(tokenizeFrenchText(sentence));
  const lower = sentence.toLowerCase().normalize('NFC');

  return forms.some((form) => tokens.has(form) || lower.includes(form));
}

export function detectWordsUsed(sentence: string, targetWords: string[]): string[] {
  return targetWords.filter((word) => sentenceUsesTargetWord(sentence, word));
}
