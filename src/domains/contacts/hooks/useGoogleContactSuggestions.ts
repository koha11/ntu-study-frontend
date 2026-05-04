import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { contactKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import { fetchContactSuggestions } from "../contacts-api";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useGoogleContactSuggestions(search: string, enabled: boolean) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const queryEnabled =
    enabled && debouncedSearch.length >= 2 && Boolean(getAccessToken());

  return useQuery({
    queryKey: contactKeys.suggestions(debouncedSearch),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return fetchContactSuggestions(token, debouncedSearch);
    },
    enabled: queryEnabled,
    staleTime: 90_000,
  });
}
