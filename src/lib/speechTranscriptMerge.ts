export function normalizeSpeechPiece(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function mergeTranscriptSegment(base: string, incoming: string): string {
  const basePart = normalizeSpeechPiece(base);
  const incomingPart = normalizeSpeechPiece(incoming);

  if (!incomingPart) return basePart;
  if (!basePart) return incomingPart;

  const baseLower = basePart.toLowerCase();
  const incomingLower = incomingPart.toLowerCase();

  if (incomingLower === baseLower) return basePart;
  if (incomingLower.startsWith(baseLower)) return incomingPart;
  if (baseLower.startsWith(incomingLower)) return basePart;
  if (baseLower.endsWith(incomingLower)) return basePart;
  if (baseLower.includes(incomingLower)) return basePart;

  const baseWords = basePart.split(' ');
  if (incomingPart.split(' ').length === 1) {
    const lastWord = baseWords[baseWords.length - 1]?.toLowerCase();
    if (lastWord === incomingLower) return basePart;
  }

  return `${basePart} ${incomingPart}`.trim();
}

export function mergeSpeechPieces(pieces: string[]): string {
  let merged = '';

  for (const piece of pieces) {
    const normalized = normalizeSpeechPiece(piece);
    if (!normalized) continue;
    merged = mergeTranscriptSegment(merged, normalized);
  }

  return merged.trim();
}

export function mergeSpeechResults(results: SpeechRecognitionResultList): string {
  const pieces: string[] = [];

  for (let index = 0; index < results.length; index += 1) {
    pieces.push(results[index][0]?.transcript ?? '');
  }

  return mergeSpeechPieces(pieces);
}
