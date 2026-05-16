import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/canva-connected")({
  component: CanvaConnectedPage,
});

function CanvaConnectedPage() {
  const { t } = useTranslation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const success = params.get("success");
  const error = params.get("error");

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-xl font-semibold">{t("canva.title")}</h1>
        {success ? (
          <p className="text-sm text-muted-foreground">
            {t("canva.connected")}
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">
            {t("canva.error")}{" "}
            <span className="font-mono">{error}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("canva.done")}</p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            to="/settings"
            className="inline-block text-sm text-primary hover:underline"
          >
            {t("canva.backToSettings")}
          </Link>
          <Link
            to="/groups"
            className="inline-block text-sm text-primary hover:underline"
          >
            {t("canva.backToGroups")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
