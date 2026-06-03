import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

const MOBILE_BREAKPOINT = 768;

function mockMatchMedia(innerWidth: number) {
  Object.defineProperty(window, "innerWidth", {
    value: innerWidth,
    writable: true,
    configurable: true,
  });

  let storedListener: ((e: MediaQueryListEvent) => void) | null = null;
  const mql = {
    matches: innerWidth < MOBILE_BREAKPOINT,
    addEventListener: vi.fn((_type: string, cb: (e: MediaQueryListEvent) => void) => {
      storedListener = cb;
    }),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    mql,
    triggerResize: (newWidth: number) => {
      Object.defineProperty(window, "innerWidth", {
        value: newWidth,
        writable: true,
        configurable: true,
      });
      storedListener?.({} as MediaQueryListEvent);
    },
  };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when innerWidth is at breakpoint (768)", () => {
    mockMatchMedia(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns false when innerWidth is above breakpoint", () => {
    mockMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when innerWidth is below breakpoint", () => {
    mockMatchMedia(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns true for innerWidth of 767", () => {
    mockMatchMedia(767);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates to true when window resizes below breakpoint", () => {
    const { triggerResize } = mockMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      triggerResize(375);
    });

    expect(result.current).toBe(true);
  });

  it("updates to false when window resizes above breakpoint", () => {
    const { triggerResize } = mockMatchMedia(375);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);

    act(() => {
      triggerResize(1024);
    });

    expect(result.current).toBe(false);
  });

  it("removes event listener on unmount", () => {
    const { mql } = mockMatchMedia(1024);
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledOnce();
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("registers event listener for change events", () => {
    const { mql } = mockMatchMedia(1024);
    renderHook(() => useIsMobile());

    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});