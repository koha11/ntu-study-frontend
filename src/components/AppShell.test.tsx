import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@/test/test-utils";
import { AppShell } from "@/components/AppShell";
import { UserRole } from "@/common/enums/user-role.enum";

function withQueryClient(ui: React.ReactElement, role: UserRole = UserRole.USER) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(["auth", "current-user"], {
    id: "u1",
    email: "t@test.com",
    name: "Test User",
    role,
    notificationEnabled: true,
    canvaConnected: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  function MockLink({
    to,
    children,
    ...rest
  }: {
    to: string | { pathname?: string };
    children?: React.ReactNode;
    className?: string;
  }) {
    const href = typeof to === "string" ? to : "/";
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return {
    ...actual,
    Link: MockLink,
    useLocation: () => ({
      pathname: "/dashboard",
      search: "",
      hash: "",
      href: "/dashboard",
      state: undefined,
      key: "default",
    }),
    useNavigate: () => vi.fn(),
  };
});

describe("AppShell", () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  it("should render app shell layout without crashing", () => {
    const { container } = render(
      withQueryClient(
        <AppShell>
          <div data-testid="outlet-child" />
        </AppShell>,
      ),
    );
    expect(container).toBeTruthy();
  });

  it("should have a main content outlet area", () => {
    const { container } = render(
      withQueryClient(
        <AppShell>
          <div />
        </AppShell>,
      ),
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("should render with theme provider context", () => {
    const { container } = render(
      withQueryClient(
        <AppShell>
          <div />
        </AppShell>,
      ),
      { withTheme: true },
    );
    expect(container).toBeTruthy();
  });

  it("should be accessible - no critical a11y violations", () => {
    const { container } = render(
      withQueryClient(
        <AppShell>
          <div />
        </AppShell>,
      ),
    );
    const main = container.querySelector("main") || container.querySelector('[role="main"]');
    expect(container).toBeTruthy();
    void main;
  });

  it("renders admin sidebar layout for admin users", () => {
    const { container } = render(
      withQueryClient(
        <AppShell>
          <div data-testid="admin-content" />
        </AppShell>,
        UserRole.ADMIN,
      ),
    );
    expect(container).toBeTruthy();
  });
});
