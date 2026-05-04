import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/canva-connected")({
  component: CanvaConnectedPage,
});

/** Optional landing page after Canva OAuth (match URL in Canva Developer Portal return navigation). */
function CanvaConnectedPage() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const success = params.get("success");
  const error = params.get("error");

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-xl font-semibold">Canva connection</h1>
        {success ? (
          <p className="text-sm text-muted-foreground">
            Canva is connected. You can create a group to generate a presentation
            automatically.
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">
            Could not connect Canva:{" "}
            <span className="font-mono">{error}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Done.</p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            to="/settings"
            className="inline-block text-sm text-primary hover:underline"
          >
            Back to settings
          </Link>
          <Link
            to="/groups"
            className="inline-block text-sm text-primary hover:underline"
          >
            Back to groups
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
