import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TermsPage } from "./TermsPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) => <a href={to}>{children}</a>,
}));

describe("TermsPage", () => {
  it("renders the page title", () => {
    render(<TermsPage />);
    expect(screen.getByTestId("terms-title")).toHaveTextContent("terms.pageTitle");
  });

  it("renders the last updated date", () => {
    render(<TermsPage />);
    expect(screen.getByTestId("terms-last-updated")).toHaveTextContent("terms.lastUpdated");
  });

  it("renders the intro paragraph", () => {
    render(<TermsPage />);
    expect(screen.getByText("terms.intro")).toBeInTheDocument();
  });

  it("renders all 13 sections", () => {
    render(<TermsPage />);
    const sectionKeys = [
      "s1", "s2", "s3", "s4", "s5", "s6", "s7",
      "s8", "s9", "s10", "s11", "s12", "s13",
    ];
    for (const key of sectionKeys) {
      expect(screen.getByTestId(`terms-section-${key}`)).toBeInTheDocument();
    }
  });

  it("renders section titles and content", () => {
    render(<TermsPage />);
    expect(screen.getByText("terms.s1Title")).toBeInTheDocument();
    expect(screen.getByText("terms.s1Content")).toBeInTheDocument();
    expect(screen.getByText("terms.s13Title")).toBeInTheDocument();
    expect(screen.getByText("terms.s13Content")).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    render(<TermsPage />);
    const link = screen.getByRole("link", { name: /terms\.backToHome/ });
    expect(link).toHaveAttribute("href", "/");
  });
});
