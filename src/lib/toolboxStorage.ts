import type { AdjectiveForms, ExportForms, VocabularyItem } from '../types/analysis';
import {
  PARTS_OF_SPEECH,
  type CategoryCounts,
  type PartOfSpeech,
  type VocabularyEntry,
} from '../types/toolbox';
import { STORAGE_KEYS } from './storageKeys';
import { notifyUserDataChanged } from './syncNotifier';
import { safeGetItem, safeSetJson } from './safeStorage';
import {
  enrichVocabularyEntry,
  mergeGenderNounPairs,
  inferAdjectiveForms,
} from './vocabForms';

const STORAGE_KEY = STORAGE_KEYS.toolbox;

/** Valid French negation frames shown in Grow recommendations (e.g. ne...pas). */
const VALID_NEGATION_FRAME_LEMMA = /^ne\.\.\.[a-zàâäéèêëïîôùûüçœæ'-]+$/i;

function isValidNegationFrameLemma(lemma: string): boolean {
  return VALID_NEGATION_FRAME_LEMMA.test(lemma.trim());
}

const POS_ALIASES: Record<string, PartOfSpeech> = {
  noun: 'Nouns',
  nouns: 'Nouns',
  verb: 'Verbs',
  verbs: 'Verbs',
  adjective: 'Adjectives',
  adjectives: 'Adjectives',
  adverb: 'Adverbs',
  adverbs: 'Adverbs',
  pronoun: 'Pronouns',
  pronouns: 'Pronouns',
  'article / determiner': 'Articles / Determiners',
  'articles / determiners': 'Articles / Determiners',
  article: 'Articles / Determiners',
  determiner: 'Articles / Determiners',
  preposition: 'Prepositions',
  prepositions: 'Prepositions',
  conjunction: 'Conjunctions',
  conjunctions: 'Conjunctions',
  expression: 'Expressions',
  expressions: 'Expressions',
  'negation particle': 'Negation Particles',
  'negation particles': 'Negation Particles',
  'reflexive pronoun': 'Reflexive Pronouns',
  'reflexive pronouns': 'Reflexive Pronouns',
};

function entryKey(entry: Pick<VocabularyEntry, 'lemma' | 'partOfSpeech'>): string {
  const pos = normalizePartOfSpeech(String(entry.partOfSpeech)) ?? entry.partOfSpeech;
  return `${entry.lemma.trim().toLowerCase()}|${pos}`;
}

function uniqueStrings(values: string[]): string[] {
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

function meaningParts(meaning: string): string[] {
  return meaning
    .split(/[/,;]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function mergeMeanings(existing: string, incoming: string): string {
  const parts = new Set([...meaningParts(existing), ...meaningParts(incoming)]);
  return [...parts]
    .sort((a, b) => a.localeCompare(b))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

function mergeExportForms(existing?: ExportForms, incoming?: ExportForms): ExportForms | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;

  const pick = (current: string, next: string) => (next !== 'N/A' ? next : current);

  return {
    mascSingular: pick(existing.mascSingular, incoming.mascSingular),
    mascPlural: pick(existing.mascPlural, incoming.mascPlural),
    femSingular: pick(existing.femSingular, incoming.femSingular),
    femPlural: pick(existing.femPlural, incoming.femPlural),
  };
}

function mergeAdjectiveForms(
  existing?: AdjectiveForms,
  incoming?: AdjectiveForms,
): AdjectiveForms | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return {
    masculineSingular: existing.masculineSingular || incoming.masculineSingular,
    feminineSingular: existing.feminineSingular || incoming.feminineSingular,
    masculinePlural: existing.masculinePlural || incoming.masculinePlural,
    femininePlural: existing.femininePlural || incoming.femininePlural,
  };
}

function isInvalidStoredEntry(entry: VocabularyEntry): boolean {
  const lemma = entry.lemma.toLowerCase();
  if (lemma.includes('...') && !isValidNegationFrameLemma(entry.lemma)) return true;
  if (/^ne\s+.+\s+pas$/.test(lemma)) return true;
  if (entry.partOfSpeech === 'Verbs' && /\bpas\b/.test(lemma)) return true;
  if (entry.partOfSpeech === 'Verbs' && /^(do not|don't|cannot|can't)\b/i.test(entry.meaning)) {
    return true;
  }
  return false;
}

function consolidateEntries(entries: VocabularyEntry[]): VocabularyEntry[] {
  const map = new Map<string, VocabularyEntry>();

  for (const entry of entries) {
    if (isInvalidStoredEntry(entry)) continue;

    const key = entryKey(entry);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...entry,
        surfaces: uniqueStrings(entry.surfaces),
        examples: uniqueStrings(entry.examples),
      });
      continue;
    }

    existing.meaning = mergeMeanings(existing.meaning, entry.meaning);
    existing.surfaces = uniqueStrings([...existing.surfaces, ...entry.surfaces]);
    existing.examples = uniqueStrings([...existing.examples, ...entry.examples]);
    existing.adjectiveForms = mergeAdjectiveForms(existing.adjectiveForms, entry.adjectiveForms);
    existing.exportForms = mergeExportForms(existing.exportForms, entry.exportForms);
  }

  return [...map.values()]
    .map((entry) => enrichVocabularyEntry(entry))
    .sort((a, b) => a.lemma.localeCompare(b.lemma, 'fr'));
}

function finalizeToolbox(entries: VocabularyEntry[]): VocabularyEntry[] {
  return mergeGenderNounPairs(entries.map((entry) => enrichVocabularyEntry(entry))).sort((a, b) =>
    a.lemma.localeCompare(b.lemma, 'fr'),
  );
}

export function normalizePartOfSpeech(value: string): PartOfSpeech | null {
  const normalized = value.trim().toLowerCase();
  if (POS_ALIASES[normalized]) return POS_ALIASES[normalized];

  if (normalized.includes('verb')) return 'Verbs';
  if (normalized.includes('noun')) return 'Nouns';
  if (normalized.includes('adjective')) return 'Adjectives';
  if (normalized.includes('negation')) return 'Negation Particles';
  if (normalized.includes('reflexive')) return 'Reflexive Pronouns';

  const match = PARTS_OF_SPEECH.find((category) => category.toLowerCase() === normalized);
  return match ?? null;
}

export function loadToolbox(): VocabularyEntry[] {
  try {
    let raw = safeGetItem(STORAGE_KEY);

    if (!raw) {
      const legacy = safeGetItem('mot-a-mot-toolbox-v2');
      if (legacy) {
        const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
        if (Array.isArray(parsed)) {
          const migrated: VocabularyEntry[] = parsed.map((item) => ({
            lemma: String(item.lemma ?? item.french ?? '').trim(),
            meaning: String(item.meaning ?? item.english ?? '').trim(),
            partOfSpeech: (item.partOfSpeech as PartOfSpeech) ?? 'Nouns',
            surfaces: uniqueStrings(
              Array.isArray(item.surfaces)
                ? (item.surfaces as string[])
                : [String(item.lemma ?? item.french ?? '')],
            ),
            examples: uniqueStrings(
              Array.isArray(item.examples)
                ? (item.examples as string[])
                : [String(item.exampleSentence ?? item.example ?? '')],
            ),
            adjectiveForms: item.adjectiveForms as AdjectiveForms | undefined,
          }));
          const consolidated = finalizeToolbox(migrated.filter((e) => e.lemma && e.meaning));
          saveToolbox(consolidated);
          return consolidated;
        }
      }
      return [];
    }

    const parsed = JSON.parse(raw) as VocabularyEntry[];
    if (!Array.isArray(parsed)) return [];
    return finalizeToolbox(consolidateEntries(parsed));
  } catch {
    return [];
  }
}

function saveToolbox(entries: VocabularyEntry[]): void {
  safeSetJson(STORAGE_KEY, finalizeToolbox(consolidateEntries(entries)));
  notifyUserDataChanged();
}

export function mergeToolboxSnapshots(
  local: VocabularyEntry[],
  remote: VocabularyEntry[],
): VocabularyEntry[] {
  return finalizeToolbox(consolidateEntries([...local, ...remote]));
}

export function removeVocabularyEntry(lemma: string, partOfSpeech: PartOfSpeech): boolean {
  const key = entryKey({ lemma, partOfSpeech });
  const existing = consolidateEntries(loadToolbox());
  const next = existing.filter((entry) => entryKey(entry) !== key);
  if (next.length === existing.length) return false;
  saveToolbox(next);
  return true;
}

export function isVocabularyInToolbox(lemma: string, partOfSpeech: PartOfSpeech): boolean {
  const key = entryKey({ lemma, partOfSpeech });
  return loadToolbox().some((entry) => entryKey(entry) === key);
}

export function addVocabularyItem(item: VocabularyItem): boolean {
  addVocabulary([item]);
  const pos = normalizePartOfSpeech(item.partOfSpeech);
  if (!pos) return false;
  return isVocabularyInToolbox(item.lemma, pos);
}

export function addVocabulary(items: VocabularyItem[]): number {
  const existing = consolidateEntries(loadToolbox());
  const indexByKey = new Map(existing.map((entry, index) => [entryKey(entry), index]));
  let added = 0;
  let changed = false;

  for (const item of items) {
    const partOfSpeech = normalizePartOfSpeech(item.partOfSpeech);
    if (!partOfSpeech) continue;

    const lemma = item.lemma.trim();
    const meaning = item.meaning.trim();
    if (!lemma || !meaning) continue;

    const incomingSurfaces = uniqueStrings([
      ...(item.surfaces ?? []),
      item.surface,
      lemma,
    ]);
    const incomingExamples = uniqueStrings([...(item.examples ?? []), item.example]);

    const key = entryKey({ lemma, partOfSpeech });
    const existingIndex = indexByKey.get(key);

    if (existingIndex !== undefined) {
      const current = existing[existingIndex];
      const nextMeaning = mergeMeanings(current.meaning, meaning);
      const nextSurfaces = uniqueStrings([...current.surfaces, ...incomingSurfaces]);
      const nextExamples = uniqueStrings([...current.examples, ...incomingExamples]);
      const nextForms = mergeAdjectiveForms(current.adjectiveForms, item.adjectiveForms);
      const nextExportForms = mergeExportForms(current.exportForms, item.exportForms);

      if (
        nextMeaning !== current.meaning ||
        nextSurfaces.length !== current.surfaces.length ||
        nextExamples.length !== current.examples.length ||
        JSON.stringify(nextForms) !== JSON.stringify(current.adjectiveForms) ||
        JSON.stringify(nextExportForms) !== JSON.stringify(current.exportForms)
      ) {
        current.meaning = nextMeaning;
        current.surfaces = nextSurfaces;
        current.examples = nextExamples;
        current.adjectiveForms = nextForms;
        current.exportForms = nextExportForms;
        changed = true;
      }
      continue;
    }

    const entry: VocabularyEntry = enrichVocabularyEntry({
      lemma,
      meaning,
      partOfSpeech,
      surfaces: incomingSurfaces,
      examples: incomingExamples,
      adjectiveForms:
        partOfSpeech === 'Adjectives' ? inferAdjectiveForms(lemma, item.adjectiveForms) : item.adjectiveForms,
      exportForms: item.exportForms,
    });

    indexByKey.set(key, existing.length);
    existing.push(entry);
    added += 1;
    changed = true;
  }

  if (changed) {
    saveToolbox(existing);
  }

  return added;
}

export function getCategoryCounts(): CategoryCounts {
  const counts = Object.fromEntries(PARTS_OF_SPEECH.map((pos) => [pos, 0])) as CategoryCounts;

  for (const entry of loadToolbox()) {
    counts[entry.partOfSpeech] += 1;
  }

  return counts;
}

export function getVocabularyByCategory(category: PartOfSpeech): VocabularyEntry[] {
  return loadToolbox().filter((entry) => entry.partOfSpeech === category);
}

export function getTotalVocabularyCount(): number {
  return loadToolbox().length;
}

export function applyToolboxImport(items: VocabularyItem[]): {
  added: number;
  totalEntries: number;
} {
  const existingKeys = new Set(loadToolbox().map((entry) => entryKey(entry)));
  let added = 0;

  for (const item of items) {
    const partOfSpeech = normalizePartOfSpeech(item.partOfSpeech);
    if (!partOfSpeech) continue;

    const key = entryKey({ lemma: item.lemma, partOfSpeech });
    if (existingKeys.has(key)) continue;

    addVocabulary([item]);
    added += 1;
    existingKeys.add(key);
  }

  return {
    added,
    totalEntries: getTotalVocabularyCount(),
  };
}

/** Clear bad legacy data — run once if toolbox looks wrong */
export function resetToolbox(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('mot-a-mot-toolbox-v2');
  localStorage.removeItem('mot-a-mot-toolbox-v1');
}
