/**
 * Parse pasted bulk text into term/definition pairs using delimiter options.
 */

export type TermDefDelimiter = "tab" | "comma" | { kind: "custom"; value: string };

export type CardDelimiter = "newline" | "semicolon" | { kind: "custom"; value: string };

export type ParsedFlashcardRow = { term: string; definition: string };

function termDefSeparator(d: TermDefDelimiter): string {
  if (d === "tab") return "\t";
  if (d === "comma") return ",";
  return d.value;
}

function splitIntoCards(text: string, cardSep: CardDelimiter): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  if (cardSep === "newline") {
    return normalized.split("\n");
  }
  if (cardSep === "semicolon") {
    return normalized.split(";");
  }
  return normalized.split(cardSep.value);
}

function splitTermDefinition(segment: string, sep: string): ParsedFlashcardRow | null {
  const s = segment.trim();
  if (!s) return null;
  const idx = sep.length ? s.indexOf(sep) : -1;
  if (idx < 0) return null;
  const term = s.slice(0, idx).trim();
  const definition = s.slice(idx + sep.length).trim();
  if (!term || !definition) return null;
  return { term, definition };
}

/**
 * Parse pasted text into flashcard rows. Invalid segments are skipped.
 */
export function parsePastedFlashcards(
  text: string,
  termDef: TermDefDelimiter,
  cardSep: CardDelimiter,
): ParsedFlashcardRow[] {
  const td = termDefSeparator(termDef);
  const rawSegments = splitIntoCards(text, cardSep);
  const out: ParsedFlashcardRow[] = [];
  for (const seg of rawSegments) {
    const row = splitTermDefinition(seg, td);
    if (row) out.push(row);
  }
  return out;
}
