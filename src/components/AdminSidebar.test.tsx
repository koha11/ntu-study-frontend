import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { AdminSidebar } from "./AdminSidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNavigate = vi.fn();
const mockLocation = { pathname: "/admin", hash: "" };

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin console title", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("adminSidebar.title")).toBeInTheDocument();
  });

  it("renders all navigation sections", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("adminSidebar.overview")).toBeInTheDocument();
    expect(screen.getByText("adminSidebar.users")).toBeInTheDocument();
    expect(screen.getByText("adminSidebar.groups")).toBeInTheDocument();
  });

  it("navigates when overview section is clicked", () => {
    render(<AdminSidebar />);
    fireEvent.click(screen.getByText("adminSidebar.overview"));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("navigates when users section is clicked", () => {
    render(<AdminSidebar />);
    fireEvent.click(screen.getByText("adminSidebar.users"));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
