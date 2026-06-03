import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { OverallScoreModal } from "./OverallScoreModal";
import type { EvaluationRound } from "@/domains/contributions";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseQueries = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueries: (...args: unknown[]) => mockUseQueries(...args),
  };
});

vi.mock("@/domains/contributions/queries", () => ({
  roundResultsQueryOptions: (groupId: string, startedAt: string) => ({
    queryKey: ["round-results", groupId, startedAt],
    queryFn: async () => [],
  }),
}));

const makeRound = (startedAt: string): EvaluationRound => ({
  roundStartedAt: startedAt,
  dueDate: "2026-01-15T23:59:59.000Z",
  isClosed: true,
  ratedCount: 2,
  totalCount: 5,
});

describe("OverallScoreModal", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueries.mockReturnValue([]);
  });

  it("does not render content when closed", () => {
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[]}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    expect(
      screen.queryByText("groups.contribution.overallScoreTitle"),
    ).not.toBeInTheDocument();
  });

  it("shows loading state when any query is loading", () => {
    mockUseQueries.mockReturnValue([{ isLoading: true, data: undefined }]);
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[makeRound("2026-01-01")]}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(
      screen.getByText("groups.contribution.overallScoreLoading"),
    ).toBeInTheDocument();
  });

  it("shows empty state when no scores", () => {
    mockUseQueries.mockReturnValue([{ isLoading: false, data: [] }]);
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[makeRound("2026-01-01")]}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(
      screen.getByText("groups.contribution.overallScoreEmpty"),
    ).toBeInTheDocument();
  });

  it("renders member scores sorted by average descending", () => {
    mockUseQueries.mockReturnValue([
      {
        isLoading: false,
        data: [
          { assigneeId: "u1", assigneeFullName: "Alice", averageScore: 7 },
          { assigneeId: "u2", assigneeFullName: "Bob", averageScore: 9 },
        ],
      },
    ]);
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[makeRound("2026-01-01")]}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Bob");
    expect(rows[2]).toHaveTextContent("Alice");
  });

  it("uses assigneeId as fallback name when assigneeFullName is empty", () => {
    mockUseQueries.mockReturnValue([
      {
        isLoading: false,
        data: [{ assigneeId: "uid-xyz", assigneeFullName: "", averageScore: 5 }],
      },
    ]);
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[makeRound("2026-01-01")]}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("uid-xyz")).toBeInTheDocument();
  });

  it("skips entries with null averageScore", () => {
    mockUseQueries.mockReturnValue([
      {
        isLoading: false,
        data: [{ assigneeId: "u1", assigneeFullName: "Alice", averageScore: null }],
      },
    ]);
    render(
      <OverallScoreModal
        groupId="g1"
        closedRounds={[makeRound("2026-01-01")]}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(
      screen.getByText("groups.contribution.overallScoreEmpty"),
    ).toBeInTheDocument();
  });
});
