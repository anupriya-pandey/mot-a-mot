import { deriveExpressionMeaning } from './phraseMeaning';
import { normalizePartOfSpeech } from './toolboxStorage';
import type { VocabularyItem } from '../types/analysis';
import type {
  AmbiguousImportGroup,
  ImportCandidate,
  ImportReviewData,
  ImportReviewSummary,
  RelatedImportEntry,
  RelatedImportOption,
  RelatedSuggestions,
} from '../types/import';
import type { VocabularyEntry } from '../types/toolbox';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function entryKey(lemma: string, partOfSpeech: string): string {
  const pos = normalizePartOfSpeech(partOfSpeech);
  return `${lemma.trim().toLowerCase()}|${pos ?? partOfSpeech}`;
}

function normalizeLemma(lemma: string): string {
  return lemma.trim().toLowerCase();
}

function meaningParts(meaning: string): string[] {
  return meaning
    .split(/[/,;]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function toCandidate(item: VocabularyItem): ImportCandidate {
  return {
    id: generateId(),
    lemma: item.lemma.trim(),
    surface: item.surface?.trim() || item.lemma.trim(),
    meaning: item.meaning.trim(),
    partOfSpeech: item.partOfSpeech.trim(),
    example: item.example?.trim() ?? '',
    examples: item.examples ?? (item.example ? [item.example] : []),
    surfaces: item.surfaces ?? [item.surface ?? item.lemma],
    adjectiveForms: item.adjectiveForms,
  };
}

function findExisting(
  existing: VocabularyEntry[],
  lemma: string,
  partOfSpeech: string,
): VocabularyEntry | undefined {
  const key = entryKey(lemma, partOfSpeech);
  return existing.find((entry) => entryKey(entry.lemma, entry.partOfSpeech) === key);
}

function isInToolbox(
  toolbox: VocabularyEntry[],
  lemma: string,
  partOfSpeech: string,
): boolean {
  return Boolean(findExisting(toolbox, lemma, partOfSpeech));
}

function computeRelatedSuggestions(
  existing: VocabularyEntry,
  incoming: ImportCandidate,
): RelatedSuggestions {
  const existingExamples = new Set(existing.examples.map((example) => example.toLowerCase()));
  const existingMeanings = new Set(meaningParts(existing.meaning));

  const newExamples = (incoming.examples ?? []).filter(
    (example) => example.trim() && !existingExamples.has(example.trim().toLowerCase()),
  );

  const newMeanings = meaningParts(incoming.meaning)
    .filter((part) => !existingMeanings.has(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  const expressions = [...new Set(
    (incoming.examples ?? [])
      .concat(incoming.lemma.includes(' ') ? [incoming.lemma] : [])
      .filter((text) => {
        const lower = text.trim().toLowerCase();
        return text.includes(' ') && !existingExamples.has(lower);
      }),
  )];

  return { examples: newExamples, meanings: newMeanings, expressions };
}

function hasRelatedSuggestions(suggestions: RelatedSuggestions): boolean {
  return (
    suggestions.examples.length > 0 ||
    suggestions.meanings.length > 0 ||
    suggestions.expressions.length > 0
  );
}

function findExampleForPhrase(examples: string[], phrase: string): string {
  const lowerPhrase = phrase.toLowerCase();
  return examples.find((example) => example.toLowerCase().includes(lowerPhrase)) ?? '';
}

function createRelatedCandidate(
  partial: Omit<ImportCandidate, 'id'>,
): ImportCandidate {
  return {
    id: generateId(),
    ...partial,
    examples: partial.examples ?? (partial.example ? [partial.example] : []),
    surfaces: partial.surfaces ?? [partial.surface ?? partial.lemma],
  };
}

function buildRelatedEntries(
  existing: VocabularyEntry,
  incoming: ImportCandidate,
  suggestions: RelatedSuggestions,
  existingToolbox: VocabularyEntry[],
): RelatedImportOption[] {
  const related: RelatedImportOption[] = [];
  const seenKeys = new Set(existingToolbox.map((entry) => entryKey(entry.lemma, entry.partOfSpeech)));

  for (const expression of suggestions.expressions) {
    const trimmed = expression.trim();
    if (!trimmed) continue;

    const candidate = createRelatedCandidate({
      lemma: trimmed,
      surface: trimmed,
      meaning: deriveExpressionMeaning(trimmed, existingToolbox, existing),
      partOfSpeech: 'Expressions',
      example: findExampleForPhrase(incoming.examples ?? [], trimmed) || incoming.example || trimmed,
      examples: incoming.examples ?? [],
      surfaces: [trimmed],
    });

    const key = entryKey(candidate.lemma, candidate.partOfSpeech);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      related.push({ ...candidate, selected: true });
    }
  }

  for (const meaning of suggestions.meanings) {
    const example =
      incoming.example ||
      (incoming.examples ?? []).find((item) => item.trim()) ||
      '';
    const lemma = example.includes(' ') ? example : `${existing.lemma} — ${meaning}`;

    const candidate = createRelatedCandidate({
      lemma,
      surface: incoming.surface || existing.lemma,
      meaning,
      partOfSpeech: 'Expressions',
      example,
      examples: example ? [example] : [],
      surfaces: [existing.lemma],
    });

    const key = entryKey(candidate.lemma, candidate.partOfSpeech);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      related.push({ ...candidate, selected: true });
    }
  }

  for (const example of suggestions.examples) {
    const trimmed = example.trim();
    if (!trimmed) continue;
    if (related.some((entry) => entry.lemma.toLowerCase() === trimmed.toLowerCase())) continue;

    const candidate = createRelatedCandidate({
      lemma: trimmed,
      surface: trimmed,
      meaning: deriveExpressionMeaning(trimmed, existingToolbox, existing),
      partOfSpeech: 'Expressions',
      example: trimmed,
      examples: [trimmed],
      surfaces: [trimmed],
    });

    const key = entryKey(candidate.lemma, candidate.partOfSpeech);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      related.push({ ...candidate, selected: true });
    }
  }

  return related;
}

export function categorizeImportEntries(
  extracted: VocabularyItem[],
  existingToolbox: VocabularyEntry[],
): ImportReviewData {
  const candidates = extracted.map(toCandidate);
  const byLemma = new Map<string, ImportCandidate[]>();

  for (const candidate of candidates) {
    const key = normalizeLemma(candidate.lemma);
    const group = byLemma.get(key) ?? [];
    group.push(candidate);
    byLemma.set(key, group);
  }

  const ready: ImportCandidate[] = [];
  const alreadyIn: ImportCandidate[] = [];
  const ambiguous: AmbiguousImportGroup[] = [];
  const related: RelatedImportEntry[] = [];
  const handledIds = new Set<string>();

  for (const [lemma, group] of byLemma) {
    const distinctKeys = new Set(
      group.map((candidate) => entryKey(candidate.lemma, candidate.partOfSpeech)),
    );

    const isAmbiguousLemma =
      group.length > 1 &&
      (distinctKeys.size > 1 ||
        group.some((candidate, index) => {
          const others = group.filter((_, i) => i !== index);
          const parts = meaningParts(candidate.meaning);
          return others.some((other) => {
            const otherParts = meaningParts(other.meaning);
            return !parts.some((part) => otherParts.includes(part));
          });
        }));

    if (isAmbiguousLemma) {
      const options = group
        .filter(
          (candidate) =>
            !isInToolbox(existingToolbox, candidate.lemma, candidate.partOfSpeech),
        )
        .map((candidate) => ({ ...candidate, selected: true }));

      if (options.length > 1) {
        for (const option of options) handledIds.add(option.id);
        ambiguous.push({ lemma, options });
        continue;
      }
    }

    for (const candidate of group) {
      if (handledIds.has(candidate.id)) continue;

      const existing = findExisting(existingToolbox, candidate.lemma, candidate.partOfSpeech);

      if (!existing) {
        ready.push(candidate);
        continue;
      }

      const suggestions = computeRelatedSuggestions(existing, candidate);

      if (hasRelatedSuggestions(suggestions)) {
        const relatedEntries = buildRelatedEntries(
          existing,
          candidate,
          suggestions,
          existingToolbox,
        );

        if (relatedEntries.length > 0) {
          related.push({
            id: generateId(),
            existing,
            relatedEntries,
          });
        }
      }

      alreadyIn.push(candidate);
    }
  }

  const relatedEntryCount = related.reduce(
    (sum, group) => sum + group.relatedEntries.length,
    0,
  );

  const summary: ImportReviewSummary = {
    newCount: ready.length,
    existingCount: alreadyIn.length,
    ambiguousLemmaCount: ambiguous.length,
    relatedCount: relatedEntryCount,
    totalReviewed:
      ready.length +
      alreadyIn.length +
      ambiguous.reduce((sum, group) => sum + group.options.length, 0) +
      relatedEntryCount,
  };

  return { ready, alreadyIn, ambiguous, related, summary };
}

export function candidateToVocabularyItem(candidate: ImportCandidate): VocabularyItem {
  return {
    lemma: candidate.lemma,
    surface: candidate.surface,
    meaning: candidate.meaning,
    partOfSpeech: candidate.partOfSpeech,
    example: candidate.example,
    examples: candidate.examples,
    surfaces: candidate.surfaces,
    adjectiveForms: candidate.adjectiveForms,
  };
}
