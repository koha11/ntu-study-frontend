import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateFlashcardSetPage } from "./CreateFlashcardSetPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    asChild,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
    asChild?: boolean;
  }) =>
    asChild ? (
      <span>{children}</span>
    ) : (
      <button onClick={onClick} disabled={disabled} type={(type as "button" | "submit") ?? "button"}>
        {children}
      </button>
    ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    id,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    id?: string;
  }) => <input id={id} value={value} onChange={onChange} placeholder={placeholder} />,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    id,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    id?: string;
  }) => <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn().mockResolvedValue(undefined),
}));

const mockCreateSet = vi.fn();
const mockAddCard = vi.fn();
const mockPatchSet = vi.fn();
const mockPatchCard = vi.fn();
const mockRemoveCard = vi.fn();

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../flashcards-api", () => ({
  fetchFlashcardSets: vi.fn().mockResolvedValue([]),
  fetchFlashcardSetById: vi.fn().mockResolvedValue(null),
  createFlashcardSet: (...args: unknown[]) => mockCreateSet(...args),
  addFlashcard: (...args: unknown[]) => mockAddCard(...args),
  updateFlashcardSet: (...args: unknown[]) => mockPatchSet(...args),
  updateFlashcard: (...args: unknown[]) => mockPatchCard(...args),
  deleteFlashcard: (...args: unknown[]) => mockRemoveCard(...args),
}));

vi.mock("./ImportFlashcardsModal", () => ({
  ImportFlashcardsModal: ({
    open,
    onOpenChange,
    onAppend,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAppend: (cards: { term: string; definition: string }[]) => void;
  }) =>
    open ? (
      <div data-testid="import-modal">
        <button onClick={() => { onAppend([{ term: "ImportedQ", definition: "ImportedA" }]); onOpenChange(false); }}>
          Do Import
        </button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/shared/adapters/query-keys", () => ({
  flashcardKeys: {
    all: ["flashcards"] as const,
    lists: () => ["flashcards", "list"] as const,
    list: (filters?: unknown) => ["flashcards", "list", { filters }] as const,
    details: () => ["flashcards", "detail"] as const,
    detail: (id: string) => ["flashcards", "detail", id] as const,
    cards: (id: string) => ["flashcards", "detail", id, "cards"] as const,
    groupShared: (groupId: string) => ["flashcards", "group-shared", groupId] as const,
  },
}));

function renderPage(props: React.ComponentProps<typeof CreateFlashcardSetPage> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateFlashcardSetPage {...props} />
    </QueryClientProvider>,
  );
}

describe("CreateFlashcardSetPage – create mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSet.mockResolvedValue({ id: "new-set-1" });
    mockAddCard.mockResolvedValue({});
  });

  it("renders page title for create mode", () => {
    renderPage();
    expect(screen.getByText("flashcards.createPage.createTitle")).toBeInTheDocument();
  });

  it("renders title input placeholder", () => {
    renderPage();
    expect(
      screen.getByPlaceholderText("flashcards.createPage.titlePlaceholder"),
    ).toBeInTheDocument();
  });

  it("shows error when saving without a title", async () => {
    renderPage();
    fireEvent.click(screen.getAllByText("flashcards.createPage.createSet")[0]);
    expect(await screen.findByText("flashcards.createPage.errorNoTitle")).toBeInTheDocument();
  });

  it("shows error when saving with title but no filled cards", async () => {
    renderPage();
    const titleInput = screen.getByPlaceholderText("flashcards.createPage.titlePlaceholder");
    fireEvent.change(titleInput, { target: { value: "My Set" } });
    fireEvent.click(screen.getAllByText("flashcards.createPage.createSet")[0]);
    expect(await screen.findByText("flashcards.createPage.errorNoCards")).toBeInTheDocument();
  });

  it("renders at least two card rows initially", () => {
    renderPage();
    const fronts = screen.getAllByPlaceholderText("flashcards.createPage.enterTerm");
    expect(fronts.length).toBeGreaterThanOrEqual(2);
  });

  it("adds a new card row when Add Card is clicked", () => {
    renderPage();
    const before = screen.getAllByPlaceholderText("flashcards.createPage.enterTerm").length;
    fireEvent.click(screen.getByText("flashcards.createPage.addCard"));
    const after = screen.getAllByPlaceholderText("flashcards.createPage.enterTerm").length;
    expect(after).toBe(before + 1);
  });

  it("opens import modal when Import is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByText("flashcards.createPage.import"));
    expect(screen.getByTestId("import-modal")).toBeInTheDocument();
  });

  it("populates rows from import modal", () => {
    renderPage();
    fireEvent.click(screen.getByText("flashcards.createPage.import"));
    fireEvent.click(screen.getByText("Do Import"));
    expect(screen.queryByTestId("import-modal")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("ImportedQ")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ImportedA")).toBeInTheDocument();
  });

  it("calls createFlashcardSet on valid save", async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("flashcards.createPage.titlePlaceholder"), {
      target: { value: "Biology" },
    });
    const fronts = screen.getAllByPlaceholderText("flashcards.createPage.enterTerm");
    const backs = screen.getAllByPlaceholderText("flashcards.createPage.enterDefinition");
    fireEvent.change(fronts[0], { target: { value: "What is DNA?" } });
    fireEvent.change(backs[0], { target: { value: "Deoxyribonucleic acid" } });

    fireEvent.click(screen.getAllByText("flashcards.createPage.createSet")[0]);

    await vi.waitFor(() => {
      expect(mockCreateSet).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Biology" }),
        expect.any(String),
      );
    });
    expect(mockAddCard).toHaveBeenCalled();
  });
});

describe("CreateFlashcardSetPage – edit mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while fetching set", async () => {
    const mod = await import("../flashcards-api");
    vi.mocked(mod.fetchFlashcardSetById).mockReturnValue(new Promise(() => {}));

    renderPage({ editSetId: "set-1" });
    expect(screen.getByText("flashcards.createPage.loadingSet")).toBeInTheDocument();
  });
});
