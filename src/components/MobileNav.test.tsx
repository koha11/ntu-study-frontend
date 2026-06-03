import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { MobileNav } from "./MobileNav";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/assets/ntu_long_logo.png", () => ({ default: "ntu-logo.png" }));

const mockNavigate = vi.fn();
const mockLocation = { pathname: "/dashboard", hash: "" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    onClick,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
  }) => (
    <div data-testid="sheet-root" data-open={String(open)}>
      {children}
    </div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
}));

describe("MobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/dashboard";
    mockLocation.hash = "";
  });

  describe("hamburger button", () => {
    it("renders the hamburger button with accessible label", () => {
      render(<MobileNav isAdmin={false} />);
      expect(
        screen.getByRole("button", { name: "Open navigation menu" }),
      ).toBeInTheDocument();
    });

    it("sheet starts closed", () => {
      render(<MobileNav isAdmin={false} />);
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "false");
    });

    it("opens the sheet when hamburger is clicked", () => {
      render(<MobileNav isAdmin={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "true");
    });
  });

  describe("student navigation (isAdmin=false)", () => {
    it("renders the NTU logo", () => {
      render(<MobileNav isAdmin={false} />);
      expect(screen.getByAltText("NTU Study")).toBeInTheDocument();
    });

    it("renders all six student nav items", () => {
      render(<MobileNav isAdmin={false} />);
      expect(screen.getByText("sidebar.dashboard")).toBeInTheDocument();
      expect(screen.getByText("sidebar.groups")).toBeInTheDocument();
      expect(screen.getByText("sidebar.tasks")).toBeInTheDocument();
      expect(screen.getByText("sidebar.flashcards")).toBeInTheDocument();
      expect(screen.getByText("sidebar.notifications")).toBeInTheDocument();
      expect(screen.getByText("sidebar.settings")).toBeInTheDocument();
    });

    it("does not render admin sections", () => {
      render(<MobileNav isAdmin={false} />);
      expect(screen.queryByText("adminSidebar.overview")).not.toBeInTheDocument();
      expect(screen.queryByText("adminSidebar.users")).not.toBeInTheDocument();
      expect(screen.queryByText("adminSidebar.groups")).not.toBeInTheDocument();
    });

    it("closes the sheet when a student nav link is clicked", () => {
      render(<MobileNav isAdmin={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "true");
      fireEvent.click(screen.getByText("sidebar.groups"));
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "false");
    });

    it("links point to correct routes", () => {
      render(<MobileNav isAdmin={false} />);
      expect(screen.getByText("sidebar.dashboard").closest("a")).toHaveAttribute("href", "/dashboard");
      expect(screen.getByText("sidebar.groups").closest("a")).toHaveAttribute("href", "/groups");
      expect(screen.getByText("sidebar.tasks").closest("a")).toHaveAttribute("href", "/tasks");
      expect(screen.getByText("sidebar.flashcards").closest("a")).toHaveAttribute("href", "/flashcards");
    });
  });

  describe("admin navigation (isAdmin=true)", () => {
    it("renders the admin console title and tagline", () => {
      render(<MobileNav isAdmin={true} />);
      expect(screen.getByText("adminSidebar.title")).toBeInTheDocument();
      expect(screen.getByText("adminSidebar.tagline")).toBeInTheDocument();
    });

    it("renders all three admin sections", () => {
      render(<MobileNav isAdmin={true} />);
      expect(screen.getByText("adminSidebar.overview")).toBeInTheDocument();
      expect(screen.getByText("adminSidebar.users")).toBeInTheDocument();
      expect(screen.getByText("adminSidebar.groups")).toBeInTheDocument();
    });

    it("does not render student nav items", () => {
      render(<MobileNav isAdmin={true} />);
      expect(screen.queryByText("sidebar.dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.tasks")).not.toBeInTheDocument();
    });

    it("calls navigate with users hash when users section clicked", () => {
      render(<MobileNav isAdmin={true} />);
      fireEvent.click(screen.getByText("adminSidebar.users"));
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin", hash: "users" });
    });

    it("calls navigate with groups hash when groups section clicked", () => {
      render(<MobileNav isAdmin={true} />);
      fireEvent.click(screen.getByText("adminSidebar.groups"));
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin", hash: "groups" });
    });

    it("calls navigate with empty hash for overview section", () => {
      render(<MobileNav isAdmin={true} />);
      fireEvent.click(screen.getByText("adminSidebar.overview"));
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin", hash: "" });
    });

    it("closes the sheet after admin section click", () => {
      render(<MobileNav isAdmin={true} />);
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "true");
      fireEvent.click(screen.getByText("adminSidebar.users"));
      expect(screen.getByTestId("sheet-root")).toHaveAttribute("data-open", "false");
    });
  });

  describe("active link styles (student)", () => {
    it("applies active class to dashboard link on exact /dashboard match", () => {
      mockLocation.pathname = "/dashboard";
      render(<MobileNav isAdmin={false} />);
      const link = screen.getByText("sidebar.dashboard").closest("a");
      expect(link?.className).toContain("text-sidebar-accent-foreground");
    });

    it("does not apply active class to dashboard when on /groups", () => {
      mockLocation.pathname = "/groups";
      render(<MobileNav isAdmin={false} />);
      const link = screen.getByText("sidebar.dashboard").closest("a");
      expect(link?.className).toContain("text-sidebar-foreground/70");
    });

    it("applies active class to groups link when path starts with /groups", () => {
      mockLocation.pathname = "/groups/abc";
      render(<MobileNav isAdmin={false} />);
      const link = screen.getByText("sidebar.groups").closest("a");
      expect(link?.className).toContain("text-sidebar-accent-foreground");
    });

    it("does not apply active class to tasks when on /groups", () => {
      mockLocation.pathname = "/groups";
      render(<MobileNav isAdmin={false} />);
      const link = screen.getByText("sidebar.tasks").closest("a");
      expect(link?.className).toContain("text-sidebar-foreground/70");
    });
  });

  describe("active link styles (admin)", () => {
    it("marks overview active when on /admin with no hash", () => {
      mockLocation.pathname = "/admin";
      mockLocation.hash = "";
      render(<MobileNav isAdmin={true} />);
      const btn = screen.getByText("adminSidebar.overview").closest("button");
      expect(btn?.className).toContain("text-warning");
    });

    it("marks users active when on /admin#users", () => {
      mockLocation.pathname = "/admin";
      mockLocation.hash = "#users";
      render(<MobileNav isAdmin={true} />);
      const btn = screen.getByText("adminSidebar.users").closest("button");
      expect(btn?.className).toContain("text-warning");
    });

    it("does not mark any section active when not on /admin", () => {
      mockLocation.pathname = "/dashboard";
      mockLocation.hash = "";
      render(<MobileNav isAdmin={true} />);
      const btn = screen.getByText("adminSidebar.overview").closest("button");
      expect(btn?.className).not.toContain("text-warning");
    });
  });
});
