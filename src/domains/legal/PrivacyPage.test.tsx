import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PrivacyPage } from "./PrivacyPage";

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

describe("PrivacyPage", () => {
  it("renders the page title", () => {
    render(<PrivacyPage />);
    expect(screen.getByTestId("privacy-title")).toHaveTextContent("privacy.pageTitle");
  });

  it("renders the last updated date", () => {
    render(<PrivacyPage />);
    expect(screen.getByTestId("privacy-last-updated")).toHaveTextContent("privacy.lastUpdated");
  });

  it("renders the intro paragraph", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("privacy.intro")).toBeInTheDocument();
  });

  it("renders all 11 sections", () => {
    render(<PrivacyPage />);
    const sectionKeys = [
      "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11",
    ];
    for (const key of sectionKeys) {
      expect(screen.getByTestId(`privacy-section-${key}`)).toBeInTheDocument();
    }
  });

  it("renders section titles and content", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("privacy.s1Title")).toBeInTheDocument();
    expect(screen.getByText("privacy.s1Content")).toBeInTheDocument();
    expect(screen.getByText("privacy.s11Title")).toBeInTheDocument();
    expect(screen.getByText("privacy.s11Content")).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    render(<PrivacyPage />);
    const link = screen.getByRole("link", { name: /privacy\.backToHome/ });
    expect(link).toHaveAttribute("href", "/");
  });
});
