const POS_MAP = {
  noun: 'Noun',
  nouns: 'Noun',
  verb: 'Verb',
  verbs: 'Verb',
  adjective: 'Adjective',
  adjectives: 'Adjective',
  adverb: 'Adverb',
  adverbs: 'Adverb',
  pronoun: 'Pronoun',
  pronouns: 'Pronoun',
  'article / determiner': 'Article / Determiner',
  article: 'Article / Determiner',
  determiner: 'Article / Determiner',
  preposition: 'Preposition',
  prepositions: 'Preposition',
  conjunction: 'Conjunction',
  conjunctions: 'Conjunction',
  expression: 'Expression',
  expressions: 'Expression',
  'negation particle': 'Negation Particle',
  'negation particles': 'Negation Particle',
  'reflexive pronoun': 'Reflexive Pronoun',
  'reflexive pronouns': 'Reflexive Pronoun',
};

function normalizeLemmaKey(lemma) {
  return lemma.trim().toLowerCase().replace(/\s+/g, ' ');
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function normalizePartOfSpeechLabel(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (POS_MAP[normalized]) return POS_MAP[normalized];
  if (normalized.includes('negation')) return 'Negation Particle';
  if (normalized.includes('reflexive')) return 'Reflexive Pronoun';
  if (normalized.includes('verb')) return 'Verb';
  if (normalized.includes('noun')) return 'Noun';
  if (normalized.includes('adjective')) return 'Adjective';
  if (normalized.includes('adverb')) return 'Adverb';
  if (normalized.includes('pronoun')) return 'Pronoun';
  if (normalized.includes('preposition')) return 'Preposition';
  if (normalized.includes('conjunction')) return 'Conjunction';
  if (normalized.includes('expression')) return 'Expression';
  return null;
}

export function isInvalidItem(item) {
  const lemma = String(item?.lemma ?? '').trim();
  const meaning = String(item?.meaning ?? '').trim();
  const surface = String(item?.surface ?? '').trim();
  const lowerLemma = lemma.toLowerCase();
  const pos = normalizePartOfSpeechLabel(item?.partOfSpeech) ?? '';

  if (!lemma || !meaning) return true;
  if (lemma.includes('...')) return true;
  if (/^ne\s+.+\s+pas$/i.test(lemma)) return true;

  if (pos === 'Verb') {
    if (/\bpas\b/i.test(lemma)) return true;
    if (/^n'?[\w-]+/i.test(surface) && /\bpas\b/i.test(surface)) return true;
    if (/^(do not|does not|don't|did not|will not|cannot|can't|to not)\b/i.test(meaning)) {
      return true;
    }
  }

  return false;
}

function meaningParts(meaning) {
  return meaning
    .split(/[/,;]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function formatMeaning(parts) {
  return [...parts]
    .sort((a, b) => a.localeCompare(b))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

function buildAdjectiveForms(item) {
  const nested = item.adjectiveForms;
  if (nested?.masculineSingular?.trim()) {
    return {
      masculineSingular: nested.masculineSingular.trim(),
      feminineSingular: nested.feminineSingular?.trim() ?? '',
      masculinePlural: nested.masculinePlural?.trim() ?? '',
      femininePlural: nested.femininePlural?.trim() ?? '',
    };
  }

  const mSg = item.masculineSingular?.trim();
  if (!mSg) return null;

  return {
    masculineSingular: mSg,
    feminineSingular: item.feminineSingular?.trim() ?? '',
    masculinePlural: item.masculinePlural?.trim() ?? '',
    femininePlural: item.femininePlural?.trim() ?? '',
  };
}

function mergeAdjectiveForms(existing, incoming) {
  if (!incoming) return existing ?? null;
  if (!existing) return incoming;
  return {
    masculineSingular: existing.masculineSingular || incoming.masculineSingular,
    feminineSingular: existing.feminineSingular || incoming.feminineSingular,
    masculinePlural: existing.masculinePlural || incoming.masculinePlural,
    femininePlural: existing.femininePlural || incoming.femininePlural,
  };
}

export const EXPORT_NA = 'N/A';

function normalizeExportCell(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return EXPORT_NA;
  if (/^n\/?a$/i.test(trimmed)) return EXPORT_NA;
  return trimmed;
}

export function normalizeExportForms(raw, partOfSpeech) {
  if (!raw || typeof raw !== 'object') return null;

  const forms = {
    mascSingular: normalizeExportCell(raw.mascSingular),
    mascPlural: normalizeExportCell(raw.mascPlural),
    femSingular: normalizeExportCell(raw.femSingular),
    femPlural: normalizeExportCell(raw.femPlural),
  };

  const hasRealForm = Object.values(forms).some((value) => value !== EXPORT_NA);
  if (!hasRealForm) {
    return partOfSpeech === 'Noun' || partOfSpeech === 'Adjective' ? forms : null;
  }

  return forms;
}

function mergeExportForms(existing, incoming) {
  if (!incoming) return existing ?? null;
  if (!existing) return incoming;

  const pick = (current, next) => {
    if (next !== EXPORT_NA) return next;
    return current;
  };

  return {
    mascSingular: pick(existing.mascSingular, incoming.mascSingular),
    mascPlural: pick(existing.mascPlural, incoming.mascPlural),
    femSingular: pick(existing.femSingular, incoming.femSingular),
    femPlural: pick(existing.femPlural, incoming.femPlural),
  };
}

export function sanitizeVocabulary(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const map = new Map();

  for (const item of rawItems) {
    if (isInvalidItem(item)) continue;

    const partOfSpeech = normalizePartOfSpeechLabel(item.partOfSpeech);
    if (!partOfSpeech) continue;

    const lemma = item.lemma.trim();
    const key = `${normalizeLemmaKey(lemma)}|${partOfSpeech}`;

    const bucket =
      map.get(key) ??
      ({
        lemma,
        partOfSpeech,
        meanings: new Set(),
        surfaces: new Set(),
        examples: new Set(),
        adjectiveForms: null,
        exportForms: null,
      });

    for (const part of meaningParts(item.meaning)) bucket.meanings.add(part);
    if (item.surface?.trim()) bucket.surfaces.add(item.surface.trim());
    bucket.surfaces.add(lemma);
    if (item.example?.trim()) bucket.examples.add(item.example.trim());

    if (partOfSpeech === 'Adjective') {
      bucket.adjectiveForms = mergeAdjectiveForms(bucket.adjectiveForms, buildAdjectiveForms(item));
    }

    bucket.exportForms = mergeExportForms(
      bucket.exportForms,
      normalizeExportForms(item.exportForms, partOfSpeech),
    );

    map.set(key, bucket);
  }

  return [...map.values()].map((bucket) => {
    const surfaces = uniqueStrings([...bucket.surfaces]);
    const examples = uniqueStrings([...bucket.examples]);
    const primarySurface =
      surfaces.find((surface) => surface.toLowerCase() !== bucket.lemma.toLowerCase()) ?? bucket.lemma;

    return {
      lemma: bucket.lemma,
      surface: primarySurface,
      meaning: formatMeaning(bucket.meanings),
      partOfSpeech: bucket.partOfSpeech,
      example: examples[0] ?? '',
      surfaces,
      examples,
      ...(bucket.adjectiveForms ? { adjectiveForms: bucket.adjectiveForms } : {}),
      ...(bucket.exportForms ? { exportForms: bucket.exportForms } : {}),
    };
  });
}
