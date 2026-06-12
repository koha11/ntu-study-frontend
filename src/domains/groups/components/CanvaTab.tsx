"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvaPreview } from "@/domains/groups";

export interface CanvaTabProps {
  groupId: string;
  hasDesign: boolean;
  canvaFileUrl?: string | null;
}

export function CanvaTab({ groupId, hasDesign, canvaFileUrl }: CanvaTabProps) {
  const { data, isLoading, isError } = useCanvaPreview(groupId);
  const [current, setCurrent] = React.useState(0);

  const pages = data?.pages ?? [];
  const total = pages.length;

  const prev = () => setCurrent((i) => Math.max(0, i - 1));
  const next = () => setCurrent((i) => Math.min(total - 1, i + 1));

  // Reset slide index when design data changes
  React.useEffect(() => {
    setCurrent(0);
  }, [groupId]);

  if (!hasDesign) {
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

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Canva slide</h3>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              · {total} slide{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {data?.editUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={data.editUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Edit in Canva
            </a>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-64 items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading slides…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
          Could not load slides.
        </div>
      )}

      {/* No pages */}
      {data && total === 0 && (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
          No slides found.
        </div>
      )}

      {/* Embedded presentation */}
      {canvaFileUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <iframe
            src={canvaFileUrl.includes("?") ? `${canvaFileUrl}&embed` : `${canvaFileUrl}?embed`}
            className="h-120 w-full"
            allowFullScreen
            title="Canva presentation"
          />
        </div>
      )}

      {/* Slide viewer */}
      {total > 0 && (
        <div className="space-y-3">
          {/* Main slide */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
            <img
              key={pages[current]?.thumbnailUrl}
              src={pages[current]?.thumbnailUrl}
              alt={`Slide ${current + 1} of ${total}`}
              className="w-full object-contain"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm tabular-nums text-muted-foreground">
              {current + 1} / {total}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={next}
              disabled={current === total - 1}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnail strip */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pages.map((page, i) => (
                <button
                  key={page.index}
                  onClick={() => setCurrent(i)}
                  className={
                    "relative shrink-0 overflow-hidden rounded border-2 transition-colors " +
                    (i === current
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100")
                  }
                  aria-label={`Go to slide ${i + 1}`}
                  aria-pressed={i === current}
                >
                  <img
                    src={page.thumbnailUrl}
                    alt={`Slide ${i + 1}`}
                    className="h-14 w-auto object-contain"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5 text-center text-[10px] text-white">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
