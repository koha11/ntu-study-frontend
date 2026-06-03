import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { AcceptInvitationPage } from "./AcceptInvitationPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.groupName) return `Join ${String(opts.groupName)}`;
      if (opts?.email) return `Signed in as ${String(opts.email)}`;
      if (opts?.defaultValue) return String(opts.defaultValue);
      return key;
    },
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="full-name-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useParams: vi.fn(),
}));

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: (...args: unknown[]) => mockUseQuery(...args) };
});

const mockAcceptMutate = vi.fn();
vi.mock("@/domains/invitations/queries", () => ({
  invitationValidateQueryOptions: (token: string) => ({ queryKey: ["invite", token] }),
  useAcceptInvitationMutation: () => ({
    mutate: mockAcceptMutate,
    isPending: false,
  }),
}));

const mockUseCurrentUser = vi.fn();
vi.mock("@/domains/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const { useParams } = await import("@tanstack/react-router");

function setupValidInvitation(overrides = {}) {
  mockUseQuery.mockReturnValue({
    data: {
      valid: true,
      invitation: {
        email: "test@ntu.edu",
        group_id: "g1",
        group: { name: "Study Group Alpha" },
        expires_at: "2026-12-31T00:00:00.000Z",
        ...overrides,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
  });
}

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ token: "invite-abc" });
    mockUseCurrentUser.mockReturnValue({ data: null });
    mockUseQuery.mockReturnValue({ data: null, isLoading: true, isError: false });
  });

  it("shows loading state while validating", () => {
    render(<AcceptInvitationPage />);
    expect(screen.getByText("invitations.loading")).toBeInTheDocument();
  });

  it("shows error block on isError", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Token expired"),
    });

    render(<AcceptInvitationPage />);
    expect(screen.getByText("Token expired")).toBeInTheDocument();
    expect(screen.getByText("invitations.unavailable")).toBeInTheDocument();
  });

  it("shows invalid block when validation.valid is false", () => {
    mockUseQuery.mockReturnValue({
      data: { valid: false, reason: "expired" },
      isLoading: false,
      isError: false,
    });

    render(<AcceptInvitationPage />);
    expect(screen.getByText("invitations.unavailable")).toBeInTheDocument();
  });

  it("renders the invitation page for a valid token", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    expect(screen.getByText("invitations.title")).toBeInTheDocument();
    expect(screen.getByText("Join Study Group Alpha")).toBeInTheDocument();
  });

  it("shows invited email when present", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    expect(screen.getByText("test@ntu.edu")).toBeInTheDocument();
  });

  it("shows expiry date", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    const expiresText = screen.getByText(/invitations\.expires/);
    expect(expiresText).toBeInTheDocument();
  });

  it("shows the accept button", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    expect(screen.getByRole("button", { name: "invitations.accept" })).toBeInTheDocument();
  });

  it("calls acceptMutate when accept button is clicked", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    fireEvent.click(screen.getByRole("button", { name: "invitations.accept" }));

    expect(mockAcceptMutate).toHaveBeenCalledWith(
      expect.objectContaining({ token: "invite-abc" }),
      expect.any(Object),
    );
  });

  it("includes fullName in mutate call when entered", () => {
    setupValidInvitation();

    render(<AcceptInvitationPage />);

    fireEvent.change(screen.getByTestId("full-name-input"), {
      target: { value: "Alice Nguyen" },
    });
    fireEvent.click(screen.getByRole("button", { name: "invitations.accept" }));

    expect(mockAcceptMutate).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "Alice Nguyen" }),
      expect.any(Object),
    );
  });

  it("shows sign-in tip when no profile is set", () => {
    setupValidInvitation();
    mockUseCurrentUser.mockReturnValue({ data: null });

    render(<AcceptInvitationPage />);

    expect(screen.getByText("invitations.signInTip")).toBeInTheDocument();
  });

  it("shows signed-in-as message when emails match", () => {
    setupValidInvitation({ email: "alice@ntu.edu" });
    mockUseCurrentUser.mockReturnValue({
      data: { email: "alice@ntu.edu", name: "Alice" },
    });

    render(<AcceptInvitationPage />);

    expect(screen.getByText("Signed in as alice@ntu.edu")).toBeInTheDocument();
  });

  it("shows email mismatch warning when logged-in email differs", () => {
    setupValidInvitation({ email: "other@ntu.edu" });
    mockUseCurrentUser.mockReturnValue({
      data: { email: "alice@ntu.edu", name: "Alice" },
    });

    render(<AcceptInvitationPage />);

    expect(screen.getByText("invitations.signInDifferent")).toBeInTheDocument();
  });

  it("shows link to go to groups in invalid block", () => {
    mockUseQuery.mockReturnValue({
      data: { valid: false, reason: "already_accepted" },
      isLoading: false,
      isError: false,
    });

    render(<AcceptInvitationPage />);

    expect(screen.getByText("invitations.goToGroups")).toBeInTheDocument();
  });
});
