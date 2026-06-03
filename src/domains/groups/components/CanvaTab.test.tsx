import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { CanvaTab } from "./CanvaTab";

vi.mock("@/domains/groups", () => ({
  useCanvaPreview: vi.fn(),
}));

import { useCanvaPreview } from "@/domains/groups";

const mockUseCanvaPreview = vi.mocked(useCanvaPreview);

const twoPages = [
  { index: 1, thumbnailUrl: "https://cdn.canva.com/thumb1.jpg" },
  { index: 2, thumbnailUrl: "https://cdn.canva.com/thumb2.jpg" },
];

describe("CanvaTab", () => {
  it("shows no presentation message when hasDesign is false", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={false} />);

    expect(screen.getByText(/No Canva presentation linked yet/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.getByText(/Loading slides/i)).toBeInTheDocument();
  });

  it("shows error message when fetch fails", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.getByText(/Could not load slides/i)).toBeInTheDocument();
  });

  it("shows empty state when pages array is empty", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.getByText(/No slides found/i)).toBeInTheDocument();
  });

  it("renders the first slide and slide count", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.getByAltText(/Slide 1 of 2/i)).toHaveAttribute("src", twoPages[0].thumbnailUrl);
    expect(screen.getByText(/2 slides/i)).toBeInTheDocument();
  });

  it("shows Edit in Canva link pointing to the edit URL", () => {
    const editUrl = "https://www.canva.com/design/ABC/edit";
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    const link = screen.getByRole("link", { name: /edit in canva/i });
    expect(link).toHaveAttribute("href", editUrl);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not show Edit in Canva link when editUrl is null", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.queryByRole("link", { name: /edit in canva/i })).not.toBeInTheDocument();
  });

  it("renders thumbnail strip when there are multiple slides", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    expect(screen.getByLabelText(/Go to slide 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Go to slide 2/i)).toBeInTheDocument();
  });

  it("advances to next slide when next button is clicked", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    fireEvent.click(screen.getByLabelText(/Next slide/i));

    expect(screen.getByAltText(/Slide 2 of 2/i)).toBeInTheDocument();
  });

  it("goes back to previous slide when prev button is clicked", () => {
    mockUseCanvaPreview.mockReturnValue({
      data: { editUrl: null, pages: twoPages },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCanvaPreview>);

    render(<CanvaTab groupId="g1" hasDesign={true} />);

    fireEvent.click(screen.getByLabelText(/Next slide/i));
    fireEvent.click(screen.getByLabelText(/Previous slide/i));

    expect(screen.getByAltText(/Slide 1 of 2/i)).toBeInTheDocument();
  });
});
