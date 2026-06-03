import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { FlashcardsPage } from "./FlashcardsPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `${key}:${String(opts.name)}`;
      return key;
    },
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={params ? `${to}/${JSON.stringify(params)}` : to}>{children}</a>,
}));

const mockDeleteFlashcardSet = vi.fn();
const mockUseFlashcardsList = vi.fn();

vi.mock("@/domains/flashcards", () => ({
  useFlashcardsList: () => mockUseFlashcardsList(),
  useDeleteFlashcardSet: () => ({
    mutate: mockDeleteFlashcardSet,
    isPending: false,
  }),
}));

vi.mock("./StudyMode", () => ({
  StudyMode: ({ setId, onClose }: { setId: string; onClose: () => void }) => (
    <div data-testid={`study-mode-${setId}`}>
      <button type="button" onClick={onClose}>
        Close Study
      </button>
    </div>
  ),
}));

function makeSet(overrides = {}) {
  return {
    id: "set-1",
    name: "Biology Basics",
    subject: "Biology",
    cardCount: 10,
    nextReviewAt: "2026-06-01T08:00:00.000Z",
    ownerId: "u1",
    cards: [],
    ...overrides,
  };
}

describe("FlashcardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFlashcardsList.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows loading state while fetching", () => {
    mockUseFlashcardsList.mockReturnValue({ data: [], isLoading: true });

    render(<FlashcardsPage />);

    expect(screen.getByText("flashcards.loading")).toBeInTheDocument();
  });

  it("renders page title", () => {
    render(<FlashcardsPage />);

    expect(screen.getByText("flashcards.pageTitle")).toBeInTheDocument();
  });

  it("renders new-set link", () => {
    render(<FlashcardsPage />);

    const link = screen.getByRole("link", { name: /flashcards\.newSet/ });
    expect(link).toHaveAttribute("href", "/flashcards/new");
  });

  it("renders flashcard set cards", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "s1", name: "Algebra" }), makeSet({ id: "s2", name: "Chemistry" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Chemistry")).toBeInTheDocument();
  });

  it("shows card count badge", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ cardCount: 15 })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it("shows subject or dash when subject is empty", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ subject: "" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows subject when present", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ subject: "Physics" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText("Physics")).toBeInTheDocument();
  });

  it("shows formatted next review date", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ nextReviewAt: "2026-06-15T10:00:00.000Z" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText(/flashcards\.nextReview/)).toBeInTheDocument();
  });

  it("shows notScheduled when nextReviewAt is null", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ nextReviewAt: null })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    expect(screen.getByText(/flashcards\.notScheduled/)).toBeInTheDocument();
  });

  it("disables study button when cardCount is 0", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ cardCount: 0 })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    const studyBtn = screen.getByRole("button", { name: "flashcards.study" });
    expect(studyBtn).toBeDisabled();
  });

  it("enables study button when cardCount > 0", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ cardCount: 5 })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    const studyBtn = screen.getByRole("button", { name: "flashcards.study" });
    expect(studyBtn).not.toBeDisabled();
  });

  it("opens StudyMode when study button is clicked", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "set-abc", cardCount: 5 })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "flashcards.study" }));

    expect(screen.getByTestId("study-mode-set-abc")).toBeInTheDocument();
  });

  it("opens StudyMode via studySetParam prop", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "param-set" })],
      isLoading: false,
    });

    render(<FlashcardsPage studySetParam="param-set" clearStudyParam={vi.fn()} />);

    expect(screen.getByTestId("study-mode-param-set")).toBeInTheDocument();
  });

  it("calls clearStudyParam when studySetParam is set", () => {
    const clearMock = vi.fn();
    mockUseFlashcardsList.mockReturnValue({ data: [], isLoading: false });

    render(<FlashcardsPage studySetParam="any-id" clearStudyParam={clearMock} />);

    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it("closes StudyMode when close button is clicked", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "set-close", cardCount: 5 })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "flashcards.study" }));
    expect(screen.getByTestId("study-mode-set-close")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Study"));
    expect(screen.queryByTestId("study-mode-set-close")).not.toBeInTheDocument();
  });

  it("opens delete confirmation dialog when trash icon is clicked", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ name: "Algebra" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: /flashcards\.deleteSet:Algebra/ }));

    expect(screen.getByText("flashcards.deleteTitle")).toBeInTheDocument();
  });

  it("shows set name in delete dialog description", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ name: "Chemistry Basics" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /flashcards\.deleteSet:Chemistry Basics/ }),
    );

    expect(screen.getByText(/flashcards\.deleteDesc:Chemistry Basics/)).toBeInTheDocument();
  });

  it("calls deleteFlashcardSet when delete button is clicked in dialog", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "del-set", name: "Old Set" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: /flashcards\.deleteSet:Old Set/ }));
    fireEvent.click(screen.getByRole("button", { name: "flashcards.delete" }));

    expect(mockDeleteFlashcardSet).toHaveBeenCalledWith("del-set", expect.any(Object));
  });

  it("closes dialog when cancel button is clicked", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ name: "Algebra" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: /flashcards\.deleteSet:Algebra/ }));
    expect(screen.getByText("flashcards.deleteTitle")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "flashcards.cancel" }));
    expect(screen.queryByText("flashcards.deleteTitle")).not.toBeInTheDocument();
  });

  it("shows edit button linking to edit page", () => {
    mockUseFlashcardsList.mockReturnValue({
      data: [makeSet({ id: "edit-set" })],
      isLoading: false,
    });

    render(<FlashcardsPage />);

    const editLink = screen.getByRole("link", { name: "flashcards.edit" });
    expect(editLink).toHaveAttribute("href", expect.stringContaining("edit-set"));
  });
});
