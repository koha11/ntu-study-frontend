import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { ThemeProvider } from "@/lib/theme";

/**
 * Tests for ThemeProvider component
 * Validates dark/light theme switching and persistence
 */

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    vi.clearAllMocks();
    document.documentElement.classList.remove("light");
  });

  it("should render children without crashing", () => {
    const { container } = render(
      <ThemeProvider>
        <div data-testid="test-child">Content</div>
      </ThemeProvider>,
      { withTheme: false },
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("should apply theme class to html element", () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
      { withTheme: false },
    );

    // Root should have a theme class or mechanism
    const html = document.documentElement;
    // Dark theme is default, so html should not have 'light' class by default
    expect(html.classList.contains("light")).toBe(false);
  });

  it("should persist theme preference in localStorage", async () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
      { withTheme: false },
    );

    await waitFor(() => {
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        "ntu-study-theme",
        expect.any(String),
      );
    });
  });

  it("should default to dark theme on first load", () => {
    const { container } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>,
      { withTheme: false },
    );

    const html = document.documentElement;
    // Default should be dark (no 'light' class)
    expect(html.classList.contains("light")).toBe(false);
  });
});
