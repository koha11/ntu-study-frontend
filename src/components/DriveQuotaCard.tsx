"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  fetchDriveQuota,
  refreshDriveQuota,
} from "@/domains/drive/drive-quota-api";
import {
  driveQuotaPercent,
  formatDriveQuotaUsageLine,
  formatDriveUsedOnlyLine,
} from "@/domains/drive/format-drive-quota";
import { Button } from "@/components/ui/button";

export function DriveQuotaCard() {
  const queryClient = useQueryClient();
  const token = getAccessToken();

  const quotaQuery = useQuery({
    queryKey: ["drive-quota"],
    queryFn: () => fetchDriveQuota(token!),
    enabled: Boolean(token),
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshDriveQuota(token!),
    onSuccess: (data) => {
      queryClient.setQueryData(["drive-quota"], data);
    },
  });

  const busy =
    quotaQuery.isFetching ||
    quotaQuery.isPending ||
    refreshMutation.isPending;

  const data = quotaQuery.data;
  const hasUsed =
    data?.used_bytes != null &&
    data.used_bytes !== "";
  const hasTotal =
    data?.total_bytes != null &&
    data.total_bytes !== "";
  const showBar = hasUsed && hasTotal;

  const percent = showBar
    ? driveQuotaPercent(data!.used_bytes, data!.total_bytes)
    : 0;

  if (!token) {
    return (
      <div className="m-3 rounded-xl border border-sidebar-border bg-gradient-surface p-4">
        <div className="text-xs font-medium text-sidebar-foreground">Drive quota</div>
        <p
          className="mt-2 text-[10px] text-muted-foreground"
          data-testid="drive-quota-unavailable"
        >
          Sign in to view Drive storage.
        </p>
      </div>
    );
  }

  return (
    <div className="m-3 rounded-xl border border-sidebar-border bg-gradient-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-sidebar-foreground">Drive quota</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-sidebar-foreground"
          aria-label="Refresh quota"
          disabled={busy}
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        </Button>
      </div>

      {quotaQuery.isPending ? (
        <div
          className="mt-2 h-8 animate-pulse rounded-md bg-muted/60"
          data-testid="drive-quota-loading"
        />
      ) : null}

      {!quotaQuery.isPending && quotaQuery.isError ? (
        <p className="mt-2 text-[10px] text-destructive" data-testid="drive-quota-error">
          Could not load quota.
        </p>
      ) : null}

      {!quotaQuery.isPending &&
      !quotaQuery.isError &&
      !hasUsed &&
      !hasTotal ? (
        <p
          className="mt-2 text-[10px] text-muted-foreground"
          data-testid="drive-quota-unavailable"
        >
          Refresh to sync Drive usage from Google. Set your storage limit in Settings.
        </p>
      ) : null}

      {!quotaQuery.isPending && !quotaQuery.isError && hasUsed && !hasTotal ? (
        <p
          className="mt-1.5 text-[10px] text-muted-foreground"
          data-testid="drive-quota-usage"
        >
          {formatDriveUsedOnlyLine(data!.used_bytes)}
        </p>
      ) : null}

      {!quotaQuery.isPending && !quotaQuery.isError && showBar ? (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-primary transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div
            className="mt-1.5 text-[10px] text-muted-foreground"
            data-testid="drive-quota-usage"
          >
            {formatDriveQuotaUsageLine(data!.used_bytes, data!.total_bytes)}
          </div>
        </>
      ) : null}
    </div>
  );
}
