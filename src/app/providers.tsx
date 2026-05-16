import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import "@/i18n";

/**
 * Global Providers Composition
 *
 * Wraps the entire application with required context providers.
 * This will be extended in Phase 4 to include QueryClientProvider
 * and other global services.
 *
 */

interface ProvidersProps {
  children: React.ReactNode;
}

// Singleton QueryClient instance (exported for route guards / non-React callers)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Automatically retry failed queries once
      retry: 1,
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Garbage collect unused data after 30 minutes
      gcTime: 1000 * 60 * 30,
    },
    mutations: {
      // Retry mutations once on network error
      retry: 1,
    },
  },
});

export function AppProviders({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Provider Order Matters
 *
 * 1. QueryClientProvider (outermost)
 *    - Must wrap entire app
 *    - Manages server state and caching
 *
 * 2. ThemeProvider
 *    - Manages CSS theme variables
 *    - Needed for styled components
 *
 * 3. Children
 *    - Route components and other app content
 */
