import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CanvaTab } from "./CanvaTab";

describe("CanvaTab", () => {
  it("shows no presentation message when canvaFileUrl is missing", () => {
    render(<CanvaTab canvaFileUrl={null} />);

    expect(screen.getByText(/No Canva presentation linked yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("shows no presentation message when canvaFileUrl is undefined", () => {
    render(<CanvaTab />);

    expect(screen.getByText(/No Canva presentation linked yet/i)).toBeInTheDocument();
  });

  it("renders iframe with correct src when URL is provided", () => {
    const url = "https://www.canva.com/design/ABC/view?embed";
    render(<CanvaTab canvaFileUrl={url} />);

    const iframe = screen.getByTitle(/Canva presentation/i);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", url);
  });

  it("iframe has allow fullscreen attribute", () => {
    render(
      <CanvaTab canvaFileUrl="https://www.canva.com/design/ABC/view?embed" />,
    );

    const iframe = screen.getByTitle(/Canva presentation/i);
    expect(iframe).toHaveAttribute("allow", "fullscreen");
  });
});
