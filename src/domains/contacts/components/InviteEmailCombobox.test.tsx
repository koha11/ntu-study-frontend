import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InviteEmailCombobox } from "./InviteEmailCombobox";

const suggestionState = {
  data: [] as {
    email: string;
    display_name: string | null;
    photo_url: string | null;
  }[],
  isFetching: false,
  isError: false,
  error: null as Error | null,
};

vi.mock("../hooks/useGoogleContactSuggestions", () => ({
  useGoogleContactSuggestions: () => suggestionState,
}));

function wrapper(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("InviteEmailCombobox", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    suggestionState.data = [];
    suggestionState.isFetching = false;
    suggestionState.isError = false;
    suggestionState.error = null;
  });

  it("renders email input", () => {
    render(
      wrapper(
        <InviteEmailCombobox
          value=""
          onChange={() => {}}
          fetchEnabled
        />,
      ),
    );
    expect(screen.getByPlaceholderText("member@ntu.edu.vn")).toBeInTheDocument();
  });

  it("shows contact rows when hook returns matches", () => {
    suggestionState.data = [
      {
        email: "friend@school.edu",
        display_name: "Friend Name",
        photo_url: null,
      },
    ];
    render(
      wrapper(
        <InviteEmailCombobox
          value="fr"
          onChange={() => {}}
          fetchEnabled
        />,
      ),
    );

    fireEvent.focus(screen.getByPlaceholderText("member@ntu.edu.vn"));

    expect(screen.getByText("Friend Name")).toBeInTheDocument();
    expect(screen.getByText("friend@school.edu")).toBeInTheDocument();
  });

  it("calls onChange with email when a row is selected", () => {
    suggestionState.data = [
      { email: "pick@me.com", display_name: "Pick", photo_url: null },
    ];
    const onChange = vi.fn();
    render(
      wrapper(
        <InviteEmailCombobox value="pi" onChange={onChange} fetchEnabled />,
      ),
    );

    fireEvent.focus(screen.getByPlaceholderText("member@ntu.edu.vn"));
    fireEvent.click(screen.getByText("pick@me.com"));

    expect(onChange).toHaveBeenCalledWith("pick@me.com");
  });
});
