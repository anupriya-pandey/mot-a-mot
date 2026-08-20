import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PARTS_OF_SPEECH, type PartOfSpeech, type VocabularyEntry } from '../types/toolbox';

function formatForms(entry: VocabularyEntry): string {
  if (entry.nounGenderForms) {
    const { masculine, feminine } = entry.nounGenderForms;
    return feminine ? `${masculine} / ${feminine}` : masculine;
  }

  if (entry.adjectiveForms) {
    const f = entry.adjectiveForms;
    return `m.sg. ${f.masculineSingular}, f.sg. ${f.feminineSingular}, m.pl. ${f.masculinePlural}, f.pl. ${f.femininePlural}`;
  }

  const extra = entry.surfaces.filter((s) => s.toLowerCase() !== entry.lemma.toLowerCase());
  return extra.length > 0 ? extra.join(', ') : '—';
}

function rowsForCategory(entries: VocabularyEntry[], category: PartOfSpeech) {
  return entries
    .filter((entry) => entry.partOfSpeech === category)
    .sort((a, b) => a.lemma.localeCompare(b.lemma, 'fr'))
    .map((entry) => [entry.lemma, entry.meaning, formatForms(entry)]);
}

export function exportToolboxToExcel(entries: VocabularyEntry[], filename = 'mot-a-mot-toolbox.xlsx') {
  const workbook = XLSX.utils.book_new();

  for (const category of PARTS_OF_SPEECH) {
    const rows = rowsForCategory(entries, category);
    if (rows.length === 0) continue;

    const sheet = XLSX.utils.aoa_to_sheet([['French', 'English', 'Forms'], ...rows]);
    const safeName = category.slice(0, 31).replace(/[\\/?*[\]]/g, '');
    XLSX.utils.book_append_sheet(workbook, sheet, safeName);
  }

  if (workbook.SheetNames.length === 0) {
    const sheet = XLSX.utils.aoa_to_sheet([['French', 'English', 'Forms']]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Toolbox');
  }

  XLSX.writeFile(workbook, filename);
}

export function exportToolboxToPdf(entries: VocabularyEntry[], filename = 'mot-a-mot-toolbox.pdf') {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Mot-à-Mot — French Toolbox', 14, 18);
  doc.setFontSize(10);
  doc.text(`Exported ${new Date().toLocaleDateString()}`, 14, 26);

  let startY = 34;

  for (const category of PARTS_OF_SPEECH) {
    const rows = rowsForCategory(entries, category);
    if (rows.length === 0) continue;

    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.text(category, 14, startY);
    startY += 4;

    autoTable(doc, {
      startY: startY + 2,
      head: [['French', 'English', 'Forms']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 78, 216] },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (startY === 34) {
    doc.text('No vocabulary entries to export yet.', 14, 40);
  }

  doc.save(filename);
}
