import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

const SECTION_KEYS = [
  "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11",
] as const;

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("privacy.backToHome")}
        </Link>

        <h1 className="mb-2 text-3xl font-bold" data-testid="privacy-title">
          {t("privacy.pageTitle")}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground" data-testid="privacy-last-updated">
          {t("privacy.lastUpdated")}
        </p>

        <p className="mb-8 leading-relaxed text-muted-foreground">{t("privacy.intro")}</p>

        <div className="space-y-8">
          {SECTION_KEYS.map((key) => (
            <section key={key} data-testid={`privacy-section-${key}`}>
              <h2 className="mb-3 text-lg font-semibold">
                {t(`privacy.${key}Title`)}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(`privacy.${key}Content`)}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
