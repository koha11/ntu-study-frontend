import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContributionTab } from "./ContributionTab";
import type { EvaluationRound } from "@/domains/contributions";

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

function renderTab(props: React.ComponentProps<typeof ContributionTab>) {
  return render(<ContributionTab {...props} />, { wrapper: makeWrapper() });
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseGroupEvaluationRounds = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("@/domains/contributions", () => ({
  useGroupEvaluationRounds: (id: string) => mockUseGroupEvaluationRounds(id),
  useOpenEvaluationRound: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useCloseEvaluationRound: () => ({ mutate: vi.fn(), isPending: false }),
  useSubmitRoundRating: () => ({ mutate: vi.fn(), isPending: false }),
  useMyRoundRatings: () => ({ data: [], isLoading: false }),
  useRoundResults: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/domains/contributions/queries", () => ({
  roundResultsQueryOptions: (groupId: string, startedAt: string) => ({
    queryKey: ["round-results", groupId, startedAt],
    queryFn: async () => [],
  }),
}));

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ onChange }: { onChange: (v: string) => void }) => (
    <input
      data-testid="date-picker"
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const makeRound = (overrides: Partial<EvaluationRound> = {}): EvaluationRound => ({
  roundStartedAt: "2026-01-01T00:00:00.000Z",
  dueDate: "2026-01-15T23:59:59.000Z",
  isClosed: false,
  ratingsCreated: 0,
  ...overrides,
});

describe("ContributionTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupEvaluationRounds.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it("shows loading state", () => {
    mockUseGroupEvaluationRounds.mockReturnValue({ data: [], isLoading: true, isError: false });
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(screen.getByText("groups.contribution.loading")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseGroupEvaluationRounds.mockReturnValue({ data: [], isLoading: false, isError: true });
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(screen.getByText("groups.contribution.couldNotLoad")).toBeInTheDocument();
  });

  it("shows empty state when no rounds", () => {
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(screen.getByText("groups.contribution.noRoundsYet")).toBeInTheDocument();
  });

  it("shows title and subtitle", () => {
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(screen.getByText("groups.contribution.title")).toBeInTheDocument();
    expect(screen.getByText("groups.contribution.subtitle")).toBeInTheDocument();
  });

  it("hides Open Evaluation button for non-leaders", () => {
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(
      screen.queryByText("groups.contribution.openEvaluation"),
    ).not.toBeInTheDocument();
  });

  it("shows Open Evaluation button for leaders when group is not locked", () => {
    renderTab({ groupId: "g1", isLeader: true, groupLocked: false });
    expect(
      screen.getByText("groups.contribution.openEvaluation"),
    ).toBeInTheDocument();
  });

  it("hides Open Evaluation button for leaders when group is locked", () => {
    renderTab({ groupId: "g1", isLeader: true, groupLocked: true });
    expect(
      screen.queryByText("groups.contribution.openEvaluation"),
    ).not.toBeInTheDocument();
  });

  it("shows Overall Score button when there are closed rounds", () => {
    mockUseGroupEvaluationRounds.mockReturnValue({
      data: [makeRound({ isClosed: true })],
      isLoading: false,
      isError: false,
    });
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(
      screen.getByText("groups.contribution.viewOverallScore"),
    ).toBeInTheDocument();
  });

  it("hides Overall Score button when no closed rounds", () => {
    mockUseGroupEvaluationRounds.mockReturnValue({
      data: [makeRound({ isClosed: false })],
      isLoading: false,
      isError: false,
    });
    renderTab({ groupId: "g1", isLeader: false, groupLocked: false });
    expect(
      screen.queryByText("groups.contribution.viewOverallScore"),
    ).not.toBeInTheDocument();
  });

  it("opens OpenEvaluationDialog when Open Evaluation is clicked", () => {
    renderTab({ groupId: "g1", isLeader: true, groupLocked: false });
    fireEvent.click(screen.getByText("groups.contribution.openEvaluation"));
    expect(screen.getByText("groups.openEvaluationDialog.title")).toBeInTheDocument();
  });
});
