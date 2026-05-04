import { describe, it, expect } from "vitest";
import { parsePastedFlashcards } from "./parse-pasted-flashcards";

describe("parsePastedFlashcards", () => {
  it("parses tab-separated terms on each line (Quizlet-style)", () => {
    const text = "Word 1\tDefinition 1\nWord 2\tDefinition 2\nWord 3\tDefinition 3";
    const rows = parsePastedFlashcards(text, "tab", "newline");
    expect(rows).toEqual([
      { term: "Word 1", definition: "Definition 1" },
      { term: "Word 2", definition: "Definition 2" },
      { term: "Word 3", definition: "Definition 3" },
    ]);
  });

  it("handles Windows newlines", () => {
    const text = "A\tB\r\nC\tD";
    const rows = parsePastedFlashcards(text, "tab", "newline");
    expect(rows).toEqual([
      { term: "A", definition: "B" },
      { term: "C", definition: "D" },
    ]);
  });

  it("parses comma between term and definition", () => {
    const text = "a,b\nc,d";
    const rows = parsePastedFlashcards(text, "comma", "newline");
    expect(rows).toEqual([
      { term: "a", definition: "b" },
      { term: "c", definition: "d" },
    ]);
  });

  it("splits cards by semicolon", () => {
    const text = "x\ty; p\tq";
    const rows = parsePastedFlashcards(text, "tab", "semicolon");
    expect(rows).toEqual([
      { term: "x", definition: "y" },
      { term: "p", definition: "q" },
    ]);
  });

  it("supports custom term/definition delimiter", () => {
    const text = "one | two\nthree | four";
    const rows = parsePastedFlashcards(
      text,
      { kind: "custom", value: " | " },
      "newline",
    );
    expect(rows).toEqual([
      { term: "one", definition: "two" },
      { term: "three", definition: "four" },
    ]);
  });

  it("supports custom card delimiter", () => {
    const text = "a\tb###c\td";
    const rows = parsePastedFlashcards(text, "tab", { kind: "custom", value: "###" });
    expect(rows).toEqual([
      { term: "a", definition: "b" },
      { term: "c", definition: "d" },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parsePastedFlashcards("", "tab", "newline")).toEqual([]);
  });

  it("skips lines without delimiter", () => {
    const text = "a\tb\nno delimiter\nx\ty";
    const rows = parsePastedFlashcards(text, "tab", "newline");
    expect(rows).toEqual([
      { term: "a", definition: "b" },
      { term: "x", definition: "y" },
    ]);
  });

  it("skips empty term or definition", () => {
    expect(parsePastedFlashcards("\tonlydef", "tab", "newline")).toEqual([]);
    expect(parsePastedFlashcards("onlyterm\t", "tab", "newline")).toEqual([]);
  });
});
