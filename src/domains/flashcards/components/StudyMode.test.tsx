import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { StudyMode } from "./StudyMode";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const mockCompleteStudy = vi.fn();
const mockUseFlashcardDetails = vi.fn();

vi.mock("@/domains/flashcards", () => ({
  useFlashcardDetails: (id: string) => mockUseFlashcardDetails(id),
  useCompleteFlashcardStudy: () => ({ mutate: mockCompleteStudy }),
}));

const makeSet = (cards: { front: string; back: string }[]) => ({
  id: "set-1",
  name: "My Flashcard Set",
  subject: "Science",
  cards,
});

describe("StudyMode", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFlashcardDetails.mockReturnValue({ data: makeSet([]), isLoading: false });
  });

  it("shows loading state while data is fetching", () => {
    mockUseFlashcardDetails.mockReturnValue({ data: undefined, isLoading: true });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(
      screen.getByText("flashcards.studyMode.loadingCards"),
    ).toBeInTheDocument();
  });

  it("shows loading state when data is not yet available", () => {
    mockUseFlashcardDetails.mockReturnValue({ data: undefined, isLoading: false });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(
      screen.getByText("flashcards.studyMode.loadingCards"),
    ).toBeInTheDocument();
  });

  it("shows empty state when set has no cards", () => {
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(screen.getByText("flashcards.studyMode.noCards")).toBeInTheDocument();
  });

  it("calls onClose directly from empty state close button", () => {
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "flashcards.studyMode.close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the first card front initially", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Question 1", back: "Answer 1" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();
  });

  it("shows set name and subject", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Q", back: "A" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(screen.getByText("My Flashcard Set")).toBeInTheDocument();
    expect(screen.getByText(/Science/)).toBeInTheDocument();
  });

  it("flips to show back when card is clicked", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Question 1", back: "Answer 1" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.click(screen.getByText("Question 1"));
    expect(screen.getByText("Answer 1")).toBeInTheDocument();
    expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
  });

  it("navigates to next card on Next button click", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /flashcards\.studyMode\.next/ }));
    expect(screen.getByText("Q2")).toBeInTheDocument();
  });

  it("previous button is disabled on first card", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(
      screen.getByRole("button", { name: /flashcards\.studyMode\.previous/ }),
    ).toBeDisabled();
  });

  it("navigates to previous card on Prev button click", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /flashcards\.studyMode\.next/ }));
    fireEvent.click(screen.getByRole("button", { name: /flashcards\.studyMode\.previous/ }));
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });

  it("shows Finish button on last card", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Only card", back: "Answer" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    expect(
      screen.getByRole("button", { name: /flashcards\.studyMode\.finish/ }),
    ).toBeInTheDocument();
  });

  it("calls completeStudy and onClose when Finish is clicked", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Card", back: "Ans" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /flashcards\.studyMode\.finish/ }));
    expect(mockCompleteStudy).toHaveBeenCalledWith(
      expect.objectContaining({ setId: "set-1" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("calls completeStudy and onClose when X button is clicked", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Q1", back: "A1" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    const closeBtn = screen.getByRole("button", { name: "" });
    fireEvent.click(closeBtn);
    expect(mockCompleteStudy).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("flips card on Space key press", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([{ front: "Q1", back: "A1" }]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  it("navigates forward on ArrowRight key press", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Q2")).toBeInTheDocument();
  });

  it("navigates back on ArrowLeft key press after advancing", () => {
    mockUseFlashcardDetails.mockReturnValue({
      data: makeSet([
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ]),
      isLoading: false,
    });
    render(<StudyMode setId="set-1" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });
});
