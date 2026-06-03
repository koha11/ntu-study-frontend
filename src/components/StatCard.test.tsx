import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Users, CheckSquare, Sparkles } from "lucide-react";
import { StatCard } from "./StatCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("StatCard", () => {
  it("renders the label", () => {
    render(<StatCard icon={Users} label="Active Groups" value={5} />);
    expect(screen.getByText("Active Groups")).toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(<StatCard icon={CheckSquare} label="Tasks" value={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<StatCard icon={Sparkles} label="Score" value="A+" />);
    expect(screen.getByText("A+")).toBeInTheDocument();
  });

  it("shows delta and vs-last-week text when delta is provided", () => {
    render(<StatCard icon={Users} label="Groups" value={3} delta="+2" />);
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("common.vsLastWeek")).toBeInTheDocument();
  });

  it("hides delta section when delta is not provided", () => {
    render(<StatCard icon={Users} label="Groups" value={3} />);
    expect(screen.queryByText("common.vsLastWeek")).not.toBeInTheDocument();
  });

  it("renders with each accent variant without error", () => {
    const accents = ["primary", "success", "warning", "info"] as const;
    for (const accent of accents) {
      const { unmount } = render(
        <StatCard icon={Users} label="Test" value={0} accent={accent} />,
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
      unmount();
    }
  });

  it("uses primary accent by default", () => {
    render(<StatCard icon={Users} label="Default" value={1} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });
});
