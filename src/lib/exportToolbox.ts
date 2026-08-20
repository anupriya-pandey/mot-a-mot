import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ExportForms } from '../types/analysis';
import { inferAdjectiveForms } from './vocabForms';
import { PARTS_OF_SPEECH, type PartOfSpeech, type VocabularyEntry } from '../types/toolbox';

export const EXPORT_NA = 'N/A';

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

function cell(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return EXPORT_NA;
  if (/^n\/?a$/i.test(trimmed)) return EXPORT_NA;
  return trimmed;
}

function isLikelyProperNoun(lemma: string, meaning: string): boolean {
  const trimmed = lemma.trim();
  if (/^[A-ZÀ-ÖØ-Þ]/.test(trimmed) && trimmed !== trimmed.toLowerCase()) {
    return true;
  }
  return /proper noun|city|country|place name|capital of|given name|surname/i.test(meaning);
}

function isLikelyFeminineNoun(lemma: string): boolean {
  const lower = lemma.trim().toLowerCase();
  if (!lower) return false;

  return (
    /(?:euse|trice|tion|sion|té|esse|ette|ière|ance|ence|ure|ade|ée|ie|e)$/u.test(lower) &&
    !/(?:age|isme|eau|ment)$/u.test(lower)
  );
}

function inferPlural(singular: string): string {
  const trimmed = singular.trim();
  if (!trimmed || trimmed === EXPORT_NA) return EXPORT_NA;

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

function emptyForms(): ExportForms {
  return {
    mascSingular: EXPORT_NA,
    mascPlural: EXPORT_NA,
    femSingular: EXPORT_NA,
    femPlural: EXPORT_NA,
  };
}

function buildLegacyNounForms(entry: VocabularyEntry): ExportForms {
  if (entry.exportForms) {
    return {
      mascSingular: cell(entry.exportForms.mascSingular),
      mascPlural: cell(entry.exportForms.mascPlural),
      femSingular: cell(entry.exportForms.femSingular),
      femPlural: cell(entry.exportForms.femPlural),
    };
  }

  const forms = emptyForms();
  const lemma = entry.lemma.trim();

  if (isLikelyProperNoun(lemma, entry.meaning)) {
    if (entry.nounGenderForms) {
      forms.mascSingular = cell(entry.nounGenderForms.masculine);
      if (entry.nounGenderForms.feminine) {
        forms.femSingular = cell(entry.nounGenderForms.feminine);
      } else if (isLikelyFeminineNoun(lemma)) {
        forms.femSingular = lemma;
      } else {
        forms.mascSingular = forms.mascSingular === EXPORT_NA ? lemma : forms.mascSingular;
      }
    } else if (isLikelyFeminineNoun(lemma)) {
      forms.femSingular = lemma;
    } else {
      forms.mascSingular = lemma;
    }
    return forms;
  }

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

  if (isLikelyFeminineNoun(lemma)) {
    forms.femSingular = lemma;
    forms.femPlural = inferPlural(lemma);
    return forms;
  }

  forms.mascSingular = lemma;
  forms.mascPlural = inferPlural(lemma);
  return forms;
}

function buildLegacyAdjectiveForms(entry: VocabularyEntry): ExportForms {
  if (entry.exportForms) {
    return {
      mascSingular: cell(entry.exportForms.mascSingular),
      mascPlural: cell(entry.exportForms.mascPlural),
      femSingular: cell(entry.exportForms.femSingular),
      femPlural: cell(entry.exportForms.femPlural),
    };
  }

  const inferred = inferAdjectiveForms(entry.lemma, entry.adjectiveForms);
  if (!inferred) return emptyForms();

  return {
    mascSingular: cell(inferred.masculineSingular),
    mascPlural: cell(inferred.masculinePlural),
    femSingular: cell(inferred.feminineSingular),
    femPlural: cell(inferred.femininePlural),
  };
}

function buildFormsForEntry(entry: VocabularyEntry): ExportForms {
  if (entry.exportForms) {
    return {
      mascSingular: cell(entry.exportForms.mascSingular),
      mascPlural: cell(entry.exportForms.mascPlural),
      femSingular: cell(entry.exportForms.femSingular),
      femPlural: cell(entry.exportForms.femPlural),
    };
  }

  if (entry.partOfSpeech === 'Nouns') {
    return buildLegacyNounForms(entry);
  }
  if (entry.partOfSpeech === 'Adjectives') {
    return buildLegacyAdjectiveForms(entry);
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
