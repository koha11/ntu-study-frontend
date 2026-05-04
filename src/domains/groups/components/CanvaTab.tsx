"use client";

import * as React from "react";
import { Presentation } from "lucide-react";

export interface CanvaTabProps {
  /** View/embed URL from Canva (stored on group record). */
  canvaFileUrl?: string | null;
}

export function CanvaTab({ canvaFileUrl }: CanvaTabProps) {
  const hasUrl = Boolean(canvaFileUrl?.trim());

  if (!hasUrl) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Presentation className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Canva slide</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Preview your group presentation here when it is linked from Canva.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              No Canva presentation linked yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const src = canvaFileUrl!.trim();

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <Presentation className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Canva slide</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Embedded preview of this group&apos;s Canva presentation.
          </p>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/30">
            <iframe
              title="Canva presentation"
              src={src}
              className="h-full min-h-[480px] w-full border-0"
              allow="fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
