import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { ThemeToggle } from "./ThemeToggle";

const mockToggle = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("@/lib/theme", () => ({
  useTheme: () => mockUseTheme(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ThemeToggle", () => {
  it("renders light-mode state (isDark=false)", () => {
    mockUseTheme.mockReturnValue({ theme: "light", toggle: mockToggle });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("renders dark-mode state (isDark=true)", () => {
    mockUseTheme.mockReturnValue({ theme: "dark", toggle: mockToggle });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to light mode");
  });

  it("calls toggle when button is clicked", () => {
    mockUseTheme.mockReturnValue({ theme: "light", toggle: mockToggle });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
