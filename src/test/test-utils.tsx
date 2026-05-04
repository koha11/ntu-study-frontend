import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme";

/**
 * Custom render function that wraps components with necessary providers
 * for testing. Use this instead of RTL's render() for components that
 * depend on theme or router context.
 */

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  withTheme?: boolean;
}

/**
 * AllTheProviders - Wrapper that composes all application-level providers
 */
const AllTheProviders = ({
  children,
  withTheme = true,
}: {
  children: ReactNode;
  withTheme?: boolean;
}) => {
  let wrapped: ReactNode = children;

  if (withTheme) {
    wrapped = <ThemeProvider>{wrapped}</ThemeProvider>;
  }

  return <>{wrapped}</>;
};

/**
 * Custom render - use this for most component tests
 */
export const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { withTheme = true, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders withTheme={withTheme}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from testing-library, but use our custom render
export * from "@testing-library/react";
export { customRender as render };

/**
 * Common test utilities
 */

/**
 * Helper to wait for element to disappear (useful for async operations)
 */
export async function waitForElementToBeRemoved(
  element: HTMLElement,
  options?: { timeout?: number },
) {
  return new Promise((resolve, reject) => {
    const timeout = options?.timeout || 1000;
    const observer = new MutationObserver(() => {
      if (!document.body.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timeout waiting for element to be removed"));
    }, timeout);
  });
}

/**
 * Mock query key factory for consistent test query keys
 */
export const mockQueryKeys = {
  all: ["mock"],
  groups: () => [...mockQueryKeys.all, "groups"],
  groupDetail: (id: string) => [...mockQueryKeys.groups(), id],
  tasks: () => [...mockQueryKeys.all, "tasks"],
  flashcards: () => [...mockQueryKeys.all, "flashcards"],
};
