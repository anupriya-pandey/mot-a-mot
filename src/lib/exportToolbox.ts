import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { inferAdjectiveForms } from './vocabForms';
import { PARTS_OF_SPEECH, type PartOfSpeech, type VocabularyEntry } from '../types/toolbox';

export const EXPORT_HEADERS = [
  'No.',
  'Grammatical Function',
  'Word (French)',
  'Meaning (English)',
  'Masc. Singular',
  'Masc. Plural',
  'Fem. Singular',
  'Fem. Plural',
] as const;

export type ExportRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

function inferPlural(singular: string): string {
  const trimmed = singular.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z')) {
    return trimmed;
  }
  if (lower.endsWith('al')) {
    return `${trimmed.slice(0, -2)}aux`;
  }
  if (lower.endsWith('au') || lower.endsWith('eu') || lower.endsWith('ou')) {
    return `${trimmed}x`;
  }
  return `${trimmed}s`;
}

function isLikelyFeminineNoun(lemma: string): boolean {
  const lower = lemma.trim().toLowerCase();
  if (!lower) return false;

  return (
    /(?:euse|trice|tion|sion|té|esse|ette|ière|ance|ence|ure|ade|ée|ie|e)$/u.test(lower) &&
    !/(?:age|isme|eau|ment)$/u.test(lower)
  );
}

function emptyForms(): { mascSingular: string; mascPlural: string; femSingular: string; femPlural: string } {
  return { mascSingular: '', mascPlural: '', femSingular: '', femPlural: '' };
}

function buildNounForms(entry: VocabularyEntry) {
  const forms = emptyForms();

  if (entry.nounGenderForms) {
    const { masculine, feminine } = entry.nounGenderForms;
    forms.mascSingular = masculine;
    forms.mascPlural = inferPlural(masculine);
    if (feminine) {
      forms.femSingular = feminine;
      forms.femPlural = inferPlural(feminine);
    }
    return forms;
  }

  const lemma = entry.lemma.trim();
  if (isLikelyFeminineNoun(lemma)) {
    forms.femSingular = lemma;
    forms.femPlural = inferPlural(lemma);
    return forms;
  }

  forms.mascSingular = lemma;
  forms.mascPlural = inferPlural(lemma);
  return forms;
}

function buildAdjectiveForms(entry: VocabularyEntry) {
  const inferred = inferAdjectiveForms(entry.lemma, entry.adjectiveForms);
  if (!inferred) return emptyForms();

  return {
    mascSingular: inferred.masculineSingular,
    mascPlural: inferred.masculinePlural,
    femSingular: inferred.feminineSingular,
    femPlural: inferred.femininePlural,
  };
}

function buildFormsForEntry(entry: VocabularyEntry) {
  if (entry.partOfSpeech === 'Nouns') {
    return buildNounForms(entry);
  }
  if (entry.partOfSpeech === 'Adjectives') {
    return buildAdjectiveForms(entry);
  }
  return emptyForms();
}

function categoryOrder(a: PartOfSpeech, b: PartOfSpeech): number {
  return PARTS_OF_SPEECH.indexOf(a) - PARTS_OF_SPEECH.indexOf(b);
}

export function buildExportRows(
  entries: VocabularyEntry[],
  category?: PartOfSpeech,
): ExportRow[] {
  const filtered = category
    ? entries.filter((entry) => entry.partOfSpeech === category)
    : [...entries];

  const sorted = filtered.sort((a, b) => {
    const byCategory = categoryOrder(a.partOfSpeech, b.partOfSpeech);
    if (byCategory !== 0) return byCategory;
    return a.lemma.localeCompare(b.lemma, 'fr');
  });

  return sorted.map((entry, index) => {
    const forms = buildFormsForEntry(entry);
    return [
      index + 1,
      entry.partOfSpeech,
      entry.lemma,
      entry.meaning,
      forms.mascSingular,
      forms.mascPlural,
      forms.femSingular,
      forms.femPlural,
    ];
  });
}

function safeSheetName(name: string): string {
  return name.slice(0, 31).replace(/[\\/?*[\]:]/g, '');
}

function safeFilenamePart(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function exportToolboxToExcel(
  entries: VocabularyEntry[],
  options?: { category?: PartOfSpeech; filename?: string },
) {
  const rows = buildExportRows(entries, options?.category);
  const workbook = XLSX.utils.book_new();
  const sheetName = options?.category ? safeSheetName(options.category) : 'All vocabulary';
  const sheet = XLSX.utils.aoa_to_sheet([[...EXPORT_HEADERS], ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  const defaultName = options?.category
    ? `mot-a-mot-${safeFilenamePart(options.category)}.xlsx`
    : 'mot-a-mot-toolbox.xlsx';

  XLSX.writeFile(workbook, options?.filename ?? defaultName);
}

export function exportToolboxToPdf(
  entries: VocabularyEntry[],
  options?: { category?: PartOfSpeech; filename?: string },
) {
  const rows = buildExportRows(entries, options?.category);
  const doc = new jsPDF({ orientation: rows.length > 20 ? 'landscape' : 'portrait' });
  const title = options?.category
    ? `Mot-à-Mot — ${options.category}`
    : 'Mot-à-Mot — French Toolbox';

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Exported ${new Date().toLocaleDateString()}`, 14, 26);

  if (rows.length === 0) {
    doc.text('No vocabulary entries to export yet.', 14, 40);
  } else {
    autoTable(doc, {
      startY: 34,
      head: [[...EXPORT_HEADERS]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 78, 216] },
      margin: { left: 10, right: 10 },
    });
  }

  const defaultName = options?.category
    ? `mot-a-mot-${safeFilenamePart(options.category)}.pdf`
    : 'mot-a-mot-toolbox.pdf';

  doc.save(options?.filename ?? defaultName);
}
