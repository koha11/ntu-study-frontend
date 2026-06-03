import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { OpenEvaluationDialog } from "./OpenEvaluationDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockMutateAsync = vi.fn();

vi.mock("@/domains/contributions", () => ({
  useOpenEvaluationRound: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    value,
    onChange,
    id,
  }: {
    value: string;
    onChange: (v: string) => void;
    id?: string;
  }) => (
    <input
      id={id}
      data-testid="date-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("OpenEvaluationDialog", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ roundStartedAt: "2026-01-01", dueDate: "2026-01-15", ratingsCreated: 0 });
  });

  it("does not render content when closed", () => {
    render(
      <OpenEvaluationDialog groupId="g1" open={false} onOpenChange={onOpenChange} />,
    );
    expect(screen.queryByText("groups.openEvaluationDialog.title")).not.toBeInTheDocument();
  });

  it("renders dialog content when open", () => {
    render(
      <OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText("groups.openEvaluationDialog.title")).toBeInTheDocument();
    expect(screen.getByText("groups.openEvaluationDialog.description")).toBeInTheDocument();
  });

  it("shows error when Open is clicked without a date", async () => {
    render(<OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("groups.openEvaluationDialog.open"));
    await waitFor(() => {
      expect(
        screen.getByText("groups.openEvaluationDialog.errorNoDate"),
      ).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    render(<OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("common.cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error when date is in the past", async () => {
    render(<OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.click(screen.getByText("groups.openEvaluationDialog.open"));
    await waitFor(() => {
      expect(
        screen.getByText("groups.openEvaluationDialog.errorPastDate"),
      ).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("calls mutateAsync and closes on valid future date", async () => {
    render(<OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2030-12-31" },
    });
    fireEvent.click(screen.getByText("groups.openEvaluationDialog.open"));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: "g1" }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows generic error when mutateAsync throws", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Server error"));
    render(<OpenEvaluationDialog groupId="g1" open onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2030-12-31" },
    });
    fireEvent.click(screen.getByText("groups.openEvaluationDialog.open"));
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
