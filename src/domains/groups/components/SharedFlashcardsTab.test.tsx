import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SharedFlashcardsTab } from "./SharedFlashcardsTab";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockShareSet = vi.fn();
const mockUnshareSet = vi.fn();

vi.mock("@/domains/flashcards/queries", () => ({
  groupSharedFlashcardsQueryOptions: (groupId: string) => ({
    queryKey: ["group-shared-flashcards", groupId],
    queryFn: async () => [],
  }),
  flashcardsListQueryOptions: () => ({
    queryKey: ["flashcards-list"],
    queryFn: async () => [],
  }),
  useShareFlashcardSetMutation: () => ({ mutate: mockShareSet, isPending: false }),
  useUnshareFlashcardSetMutation: () => ({ mutate: mockUnshareSet, isPending: false }),
}));

vi.mock("@/domains/flashcards/components/StudyMode", () => ({
  StudyMode: ({ onClose }: { setId: string; onClose: () => void }) => (
    <div data-testid="study-mode">
      <button onClick={onClose}>Close Study</button>
    </div>
  ),
}));

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  };
});

const makeSharedSet = (id: string, name: string, ownerId = "owner-1") => ({
  shareId: `share-${id}`,
  setId: id,
  name,
  subject: "Math",
  cardCount: 5,
  ownerId,
});

const makeMySet = (id: string, name: string) => ({
  id,
  name,
  subject: "Science",
  cardCount: 3,
  created_at: "2026-01-01T00:00:00.000Z",
});

describe("SharedFlashcardsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return { data: [], isLoading: false };
      }
      return { data: [], isLoading: false };
    });
  });

  it("shows loading state for shared sets", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return { data: [], isLoading: true };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    expect(screen.getByText("groups.sharedFlashcards.loading")).toBeInTheDocument();
  });

  it("shows empty state when no sets are shared", () => {
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    expect(
      screen.getByText("groups.sharedFlashcards.noSetsShared"),
    ).toBeInTheDocument();
  });

  it("renders shared set names", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [makeSharedSet("s1", "Vocab Set"), makeSharedSet("s2", "Grammar Set")],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    expect(screen.getByText("Vocab Set")).toBeInTheDocument();
    expect(screen.getByText("Grammar Set")).toBeInTheDocument();
  });

  it("shows Study button for each shared set", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [makeSharedSet("s1", "Vocab Set")],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    expect(screen.getByText("groups.sharedFlashcards.study")).toBeInTheDocument();
  });

  it("shows Remove button only for owned sets", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [
            makeSharedSet("s1", "My Set", "current-user"),
            makeSharedSet("s2", "Others Set", "other-user"),
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="current-user" />);
    expect(screen.getAllByRole("button").filter(b => b.classList.contains("text-destructive"))).toHaveLength(1);
  });

  it("calls unshareSet when Remove button is clicked", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [makeSharedSet("s1", "My Set", "current-user")],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="current-user" />);
    const removeBtn = screen.getAllByRole("button").find(b => b.classList.contains("text-destructive"));
    fireEvent.click(removeBtn!);
    expect(mockUnshareSet).toHaveBeenCalledWith(
      expect.objectContaining({ setId: "s1", groupId: "g1" }),
      expect.anything(),
    );
  });

  it("opens StudyMode when Study is clicked for a set with cards", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [makeSharedSet("s1", "Vocab Set")],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    fireEvent.click(screen.getByText("groups.sharedFlashcards.study"));
    expect(screen.getByTestId("study-mode")).toBeInTheDocument();
  });

  it("closes StudyMode when onClose is called", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return {
          data: [makeSharedSet("s1", "Vocab Set")],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    fireEvent.click(screen.getByText("groups.sharedFlashcards.study"));
    expect(screen.getByTestId("study-mode")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Study"));
    expect(screen.queryByTestId("study-mode")).not.toBeInTheDocument();
  });

  it("opens share dialog when Share a Set button is clicked", () => {
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    fireEvent.click(screen.getByText("groups.sharedFlashcards.shareASet"));
    expect(
      screen.getByText("groups.sharedFlashcards.shareDialogTitle"),
    ).toBeInTheDocument();
  });

  it("shows my sets in share dialog", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return { data: [], isLoading: false };
      }
      return {
        data: [makeMySet("set1", "My Flashcard Set")],
        isLoading: false,
      };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    fireEvent.click(screen.getByText("groups.sharedFlashcards.shareASet"));
    expect(screen.getByText("My Flashcard Set")).toBeInTheDocument();
  });

  it("calls shareSet when Share button is clicked in dialog", () => {
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "group-shared-flashcards") {
        return { data: [], isLoading: false };
      }
      return {
        data: [makeMySet("set1", "My Flashcard Set")],
        isLoading: false,
      };
    });
    render(<SharedFlashcardsTab groupId="g1" currentUserId="u1" />);
    fireEvent.click(screen.getByText("groups.sharedFlashcards.shareASet"));
    fireEvent.click(screen.getByText("groups.sharedFlashcards.share"));
    expect(mockShareSet).toHaveBeenCalledWith(
      expect.objectContaining({ setId: "set1", groupId: "g1" }),
      expect.anything(),
    );
  });
});
