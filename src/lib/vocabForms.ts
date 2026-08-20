import type { AdjectiveForms } from '../types/analysis';
import type { NounGenderForms, VocabularyEntry } from '../types/toolbox';

const IRREGULAR_ADJECTIVES: Record<string, AdjectiveForms> = {
  beau: { masculineSingular: 'beau', feminineSingular: 'belle', masculinePlural: 'beaux', femininePlural: 'belles' },
  nouveau: {
    masculineSingular: 'nouveau',
    feminineSingular: 'nouvelle',
    masculinePlural: 'nouveaux',
    femininePlural: 'nouvelles',
  },
  vieux: {
    masculineSingular: 'vieux',
    feminineSingular: 'vieille',
    masculinePlural: 'vieux',
    femininePlural: 'vieilles',
  },
  blanc: {
    masculineSingular: 'blanc',
    feminineSingular: 'blanche',
    masculinePlural: 'blancs',
    femininePlural: 'blanches',
  },
  long: {
    masculineSingular: 'long',
    feminineSingular: 'longue',
    masculinePlural: 'longs',
    femininePlural: 'longues',
  },
  gentil: {
    masculineSingular: 'gentil',
    feminineSingular: 'gentille',
    masculinePlural: 'gentils',
    femininePlural: 'gentilles',
  },
};

function hasCompleteAdjectiveForms(forms?: AdjectiveForms): boolean {
  if (!forms) return false;
  return Boolean(
    forms.masculineSingular?.trim() &&
      forms.feminineSingular?.trim() &&
      forms.masculinePlural?.trim() &&
      forms.femininePlural?.trim(),
  );
}

export function inferAdjectiveForms(lemma: string, existing?: AdjectiveForms): AdjectiveForms | undefined {
  const trimmed = lemma.trim();
  if (!trimmed) return existing;

  const key = trimmed.toLowerCase();
  if (IRREGULAR_ADJECTIVES[key]) {
    return { ...IRREGULAR_ADJECTIVES[key], ...existing };
  }

  if (hasCompleteAdjectiveForms(existing)) {
    return existing;
  }

  if (key.endsWith('eux')) {
    const stem = trimmed.slice(0, -3);
    return {
      masculineSingular: trimmed,
      feminineSingular: existing?.feminineSingular ?? `${stem}euse`,
      masculinePlural: existing?.masculinePlural ?? trimmed,
      femininePlural: existing?.femininePlural ?? `${stem}euses`,
    };
  }

  if (key.endsWith('e')) {
    return {
      masculineSingular: existing?.masculineSingular ?? trimmed,
      feminineSingular: existing?.feminineSingular ?? trimmed,
      masculinePlural: existing?.masculinePlural ?? `${trimmed}s`,
      femininePlural: existing?.femininePlural ?? `${trimmed}s`,
    };
  }

  if (key.endsWith('f')) {
    const stem = trimmed.slice(0, -1);
    return {
      masculineSingular: existing?.masculineSingular ?? trimmed,
      feminineSingular: existing?.feminineSingular ?? `${stem}ve`,
      masculinePlural: existing?.masculinePlural ?? `${trimmed}s`,
      femininePlural: existing?.femininePlural ?? `${stem}ves`,
    };
  }

  return {
    masculineSingular: existing?.masculineSingular ?? trimmed,
    feminineSingular: existing?.feminineSingular ?? `${trimmed}e`,
    masculinePlural: existing?.masculinePlural ?? `${trimmed}s`,
    femininePlural: existing?.femininePlural ?? `${trimmed}es`,
  };
}

function normalizeLemmaKey(lemma: string): string {
  return lemma.trim().toLowerCase().normalize('NFC');
}

function meaningRoot(meaning: string): string {
  return meaning
    .split(/[/,;]/)[0]
    .trim()
    .toLowerCase();
}

function isFemininePair(masculine: string, feminine: string): boolean {
  const m = normalizeLemmaKey(masculine);
  const f = normalizeLemmaKey(feminine);
  if (m === f) return false;

  const patterns: Array<[string, string]> = [
    ['teur', 'trice'],
    ['eur', 'euse'],
    ['er', 'ère'],
    ['er', 'ere'],
    ['eau', 'elle'],
    ['ou', 'olle'],
    ['ien', 'ienne'],
    ['ain', 'aine'],
    ['on', 'onne'],
    ['en', 'enne'],
  ];

  for (const [mSuffix, fSuffix] of patterns) {
    if (m.endsWith(mSuffix) && f === m.slice(0, -mSuffix.length) + fSuffix) {
      return true;
    }
  }

  if (f === `${m}e`) return true;
  return false;
}

export function mergeGenderNounPairs(entries: VocabularyEntry[]): VocabularyEntry[] {
  const nouns = entries.filter((entry) => entry.partOfSpeech === 'Nouns');
  const rest = entries.filter((entry) => entry.partOfSpeech !== 'Nouns');
  const used = new Set<string>();
  const merged: VocabularyEntry[] = [];

  for (const entry of nouns) {
    const key = `${normalizeLemmaKey(entry.lemma)}|${entry.partOfSpeech}`;
    if (used.has(key)) continue;

    const partner = nouns.find((candidate) => {
      if (candidate.lemma === entry.lemma) return false;
      if (used.has(`${normalizeLemmaKey(candidate.lemma)}|${candidate.partOfSpeech}`)) return false;
      if (meaningRoot(candidate.meaning) !== meaningRoot(entry.meaning)) return false;
      return (
        isFemininePair(entry.lemma, candidate.lemma) || isFemininePair(candidate.lemma, entry.lemma)
      );
    });

    if (!partner) {
      merged.push(entry);
      used.add(key);
      continue;
    }

    const masculine =
      isFemininePair(entry.lemma, partner.lemma) ? entry : partner;
    const feminine =
      masculine.lemma === entry.lemma ? partner : entry;

    const nounGenderForms: NounGenderForms = {
      masculine: masculine.lemma,
      feminine: feminine.lemma,
    };

    const surfaces = uniqueFormList([
      ...masculine.surfaces,
      ...feminine.surfaces,
      masculine.lemma,
      feminine.lemma,
    ]);

    merged.push({
      ...masculine,
      meaning: mergeShortMeanings(masculine.meaning, feminine.meaning),
      surfaces,
      examples: uniqueFormList([...masculine.examples, ...feminine.examples]),
      nounGenderForms,
    });

    used.add(`${normalizeLemmaKey(masculine.lemma)}|Nouns`);
    used.add(`${normalizeLemmaKey(feminine.lemma)}|Nouns`);
  }

  return [...rest, ...merged];
}

function mergeShortMeanings(a: string, b: string): string {
  const parts = new Set(
    `${a} / ${b}`
      .split(/[/,;]/)
      .map((part) => part.trim())
      .filter(Boolean),
  );
  return [...parts].join(' / ');
}

function uniqueFormList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function enrichVocabularyEntry(entry: VocabularyEntry): VocabularyEntry {
  let next = { ...entry };

  if (entry.partOfSpeech === 'Adjectives') {
    const adjectiveForms = inferAdjectiveForms(entry.lemma, entry.adjectiveForms);
    if (adjectiveForms) {
      next = {
        ...next,
        adjectiveForms,
        surfaces: uniqueFormList([
          ...entry.surfaces,
          entry.lemma,
          adjectiveForms.masculineSingular,
          adjectiveForms.feminineSingular,
          adjectiveForms.masculinePlural,
          adjectiveForms.femininePlural,
        ]),
      };
    }
  }

  if (entry.partOfSpeech === 'Nouns' && entry.nounGenderForms) {
    next = {
      ...next,
      surfaces: uniqueFormList([
        ...next.surfaces,
        entry.nounGenderForms.masculine,
        entry.nounGenderForms.feminine ?? '',
      ]),
    };
  }

  return next;
}

export function getAllSurfaceForms(entry: VocabularyEntry): string[] {
  const forms = uniqueFormList([entry.lemma, ...entry.surfaces]);

  if (entry.adjectiveForms) {
    forms.push(
      entry.adjectiveForms.masculineSingular,
      entry.adjectiveForms.feminineSingular,
      entry.adjectiveForms.masculinePlural,
      entry.adjectiveForms.femininePlural,
    );
  }

  if (entry.nounGenderForms) {
    forms.push(entry.nounGenderForms.masculine);
    if (entry.nounGenderForms.feminine) {
      forms.push(entry.nounGenderForms.feminine);
    }
  }

  return uniqueFormList(forms);
}
