import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { useCurrentUser, usePatchProfile, useSyncGoogleProfile } from "@/domains/auth";
import { startCanvaOAuth } from "@/domains/auth/auth-api";
import { getAccessToken } from "@/domains/auth/token-storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function gbDraftFromBytes(bytes: string | null | undefined): string {
  if (bytes == null || bytes === "") return "";
  const n = Number(bytes);
  if (!Number.isFinite(n)) return "";
  const gb = n / 1024 ** 3;
  return String(Number(gb.toFixed(4)));
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: user, isLoading, isError } = useCurrentUser();
  const { mutate: patchProfile, isPending: isPatching } = usePatchProfile();
  const { mutate: syncFromGoogle, isPending: isSyncingGoogle } = useSyncGoogleProfile();
  const [canvaBusy, setCanvaBusy] = useState(false);
  const [driveLimitGb, setDriveLimitGb] = useState("");
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (!user) return;
    setDriveLimitGb(gbDraftFromBytes(user.driveTotalQuotaBytes));
    setNameDraft(user.name);
    void i18next.changeLanguage(user.preferredLanguage);
  }, [user]);

  const handleSaveDriveLimit = () => {
    const raw = driveLimitGb.trim();
    if (raw === "") {
      toast.error(t("settings.toast.enterLimit"));
      return;
    }
    const gb = Number(raw);
    if (!Number.isFinite(gb) || gb < 0) {
      toast.error(t("settings.toast.invalidNumber"));
      return;
    }
    const bytes = Math.round(gb * 1024 ** 3);
    patchProfile(
      { drive_total_quota: String(bytes) },
      {
        onSuccess: () => toast.success(t("settings.toast.limitSaved")),
        onError: () => toast.error(t("settings.toast.limitError")),
      },
    );
  };

  const handleClearDriveLimit = () => {
    patchProfile(
      { drive_total_quota: null },
      {
        onSuccess: () => {
          toast.success(t("settings.toast.limitCleared"));
          setDriveLimitGb("");
        },
        onError: () => toast.error(t("settings.toast.clearError")),
      },
    );
  };

  const handleSaveDisplayName = () => {
    const next = nameDraft.trim();
    if (!next) {
      toast.error(t("settings.toast.enterName"));
      return;
    }
    patchProfile(
      { full_name: next },
      {
        onSuccess: () => toast.success(t("settings.toast.nameSaved")),
        onError: () => toast.error(t("settings.toast.nameError")),
      },
    );
  };

  const handleSyncGoogleName = () => {
    syncFromGoogle(undefined, {
      onSuccess: () => toast.success(t("settings.toast.googleSynced")),
      onError: () => toast.error(t("settings.toast.googleSyncError")),
    });
  };

  const handleSelectLanguage = (lang: "en" | "vi") => {
    patchProfile(
      { preferred_language: lang },
      {
        onSuccess: () => {
          void i18next.changeLanguage(lang);
          toast.success(t("settings.language.saved"));
        },
        onError: () => toast.error(t("settings.language.error")),
      },
    );
  };

  const handleCanvaConnect = async () => {
    const token = getAccessToken();
    if (!token) return;
    setCanvaBusy(true);
    try {
      const { authorizeUrl } = await startCanvaOAuth(token);
      window.location.href = authorizeUrl;
    } finally {
      setCanvaBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {t("settings.loading")}
      </div>
    );
  }

  if (isError || !user) {
    return <div className="py-12 text-destructive">{t("settings.couldNotLoad")}</div>;
  }

  const profileBusy = isPatching || isSyncingGoogle;
  const nameUnchanged = nameDraft.trim() === user.name.trim();
  const canSaveName = nameDraft.trim().length > 0 && !nameUnchanged && !profileBusy;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.pageSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.googleAccount.title")}</CardTitle>
          <CardDescription>{t("settings.googleAccount.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-14 w-14 shrink-0">
              {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-0.5">
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-display-name">{t("settings.displayName")}</Label>
                <Input
                  id="settings-display-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  disabled={profileBusy}
                  autoComplete="name"
                  placeholder={t("settings.displayNamePlaceholder")}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!canSaveName}
                    onClick={() => handleSaveDisplayName()}
                  >
                    {t("settings.saveName")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={profileBusy}
                    onClick={() => handleSyncGoogleName()}
                  >
                    {isSyncingGoogle ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        {t("settings.syncing")}
                      </>
                    ) : (
                      t("settings.syncFromGoogle")
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">
                    {t("settings.saveNameHint")}
                  </strong>{" "}
                  <strong className="font-medium text-foreground">
                    {t("settings.syncFromGoogleHint")}
                  </strong>{" "}
                  {t("settings.nameHint")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications.title")}</CardTitle>
          <CardDescription>{t("settings.notifications.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="notify-email">{t("settings.notifications.emailLabel")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("settings.notifications.emailHint")}
              </p>
            </div>
            <Switch
              id="notify-email"
              checked={user.notificationEnabled}
              disabled={profileBusy}
              onCheckedChange={(checked) => patchProfile({ notification_enabled: checked })}
              aria-label={t("settings.notifications.emailLabel")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.driveStorage.title")}</CardTitle>
          <CardDescription>{t("settings.driveStorage.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="drive-quota-limit-gb">{t("settings.driveStorage.quotaLabel")}</Label>
            <Input
              id="drive-quota-limit-gb"
              type="number"
              min={0}
              step={0.1}
              placeholder={t("settings.driveStorage.quotaPlaceholder")}
              value={driveLimitGb}
              onChange={(e) => setDriveLimitGb(e.target.value)}
              disabled={profileBusy}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={profileBusy} onClick={() => handleSaveDriveLimit()}>
              {t("settings.driveStorage.saveLimit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPatching || user.driveTotalQuotaBytes == null}
              onClick={() => handleClearDriveLimit()}
            >
              {t("settings.driveStorage.clearLimit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.canva.title")}</CardTitle>
          <CardDescription>{t("settings.canva.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {user.canvaConnected ? (
            <p className="text-sm font-medium text-muted-foreground">
              {t("settings.canva.connected")}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("settings.canva.notConnected")}</p>
              <Button
                type="button"
                onClick={() => void handleCanvaConnect()}
                disabled={canvaBusy}
                className="shrink-0"
              >
                {canvaBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("settings.canva.connecting")}
                  </>
                ) : (
                  t("settings.canva.connect")
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language.title")}</CardTitle>
          <CardDescription>{t("settings.language.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={user.preferredLanguage === "vi" ? "default" : "outline"}
              disabled={isPatching}
              onClick={() => handleSelectLanguage("vi")}
              data-testid="lang-vi"
            >
              Tiếng Việt
            </Button>
            <Button
              type="button"
              variant={user.preferredLanguage === "en" ? "default" : "outline"}
              disabled={isPatching}
              onClick={() => handleSelectLanguage("en")}
              data-testid="lang-en"
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
