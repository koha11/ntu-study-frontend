import { useCurrentUser, usePatchProfile, useSyncGoogleProfile } from "@/domains/auth";
import { startCanvaOAuth } from "@/domains/auth/auth-api";
import { getAccessToken } from "@/domains/auth/token-storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  }, [user]);

  const handleSaveDriveLimit = () => {
    const raw = driveLimitGb.trim();
    if (raw === "") {
      toast.error("Enter a limit in GB, or clear the limit instead.");
      return;
    }
    const gb = Number(raw);
    if (!Number.isFinite(gb) || gb < 0) {
      toast.error("Enter a valid non-negative number.");
      return;
    }
    const bytes = Math.round(gb * 1024 ** 3);
    patchProfile(
      { drive_total_quota: String(bytes) },
      {
        onSuccess: () => toast.success("Drive quota limit saved."),
        onError: () => toast.error("Could not save quota limit."),
      },
    );
  };

  const handleClearDriveLimit = () => {
    patchProfile(
      { drive_total_quota: null },
      {
        onSuccess: () => {
          toast.success("Drive quota limit cleared.");
          setDriveLimitGb("");
        },
        onError: () => toast.error("Could not clear quota limit."),
      },
    );
  };

  const handleSaveDisplayName = () => {
    const next = nameDraft.trim();
    if (!next) {
      toast.error("Enter a display name.");
      return;
    }
    patchProfile(
      { full_name: next },
      {
        onSuccess: () => toast.success("Display name updated."),
        onError: () => toast.error("Could not update your name."),
      },
    );
  };

  const handleSyncGoogleName = () => {
    syncFromGoogle(undefined, {
      onSuccess: () => toast.success("Profile updated from your Google account."),
      onError: () => toast.error("Could not sync with Google. Try signing in again."),
    });
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
        Loading settings…
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="py-12 text-destructive">
        Could not load your profile. Try signing in again.
      </div>
    );
  }

  const profileBusy = isPatching || isSyncingGoogle;
  const nameUnchanged = nameDraft.trim() === user.name.trim();
  const canSaveName =
    nameDraft.trim().length > 0 && !nameUnchanged && !profileBusy;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account details from your Google sign-in and app preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google account</CardTitle>
          <CardDescription>Signed in with Google (.edu)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-14 w-14 shrink-0">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt="" />
              ) : null}
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-0.5">
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-display-name">Display name</Label>
                <Input
                  id="settings-display-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  disabled={profileBusy}
                  autoComplete="name"
                  placeholder="Your name in the app"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!canSaveName}
                    onClick={() => handleSaveDisplayName()}
                  >
                    Save name
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
                        Syncing…
                      </>
                    ) : (
                      "Sync from Google"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">Save name</strong> updates how you
                  appear here only.{" "}
                  <strong className="font-medium text-foreground">Sync from Google</strong> loads
                  your name and profile photo from Google (requires an active Google session).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Control whether the app may send notification emails (e.g. tasks and reminders).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="notify-email">Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                When off, automated emails are not sent to your address.
              </p>
            </div>
            <Switch
              id="notify-email"
              checked={user.notificationEnabled}
              disabled={profileBusy}
              onCheckedChange={(checked) =>
                patchProfile({ notification_enabled: checked })
              }
              aria-label="Email notifications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drive storage</CardTitle>
          <CardDescription>
            Organization Google accounts often do not report a shared storage total. Set your own cap
            here (for example from your school policy). Sidebar usage is refreshed from Google and
            includes files in Drive plus trash.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="drive-quota-limit-gb">Quota limit (GB)</Label>
            <Input
              id="drive-quota-limit-gb"
              type="number"
              min={0}
              step={0.1}
              placeholder="e.g. 16"
              value={driveLimitGb}
              onChange={(e) => setDriveLimitGb(e.target.value)}
              disabled={profileBusy}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={profileBusy}
              onClick={() => handleSaveDriveLimit()}
            >
              Save limit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPatching || user.driveTotalQuotaBytes == null}
              onClick={() => handleClearDriveLimit()}
            >
              Clear limit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canva</CardTitle>
          <CardDescription>
            Connect your Canva account to create and link designs from the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {user.canvaConnected ? (
            <p className="text-sm font-medium text-muted-foreground">
              Canva connected — you can use presentations in your groups.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Not connected yet. You will be redirected to Canva to authorize.
              </p>
              <Button
                type="button"
                onClick={() => void handleCanvaConnect()}
                disabled={canvaBusy}
                className="shrink-0"
              >
                {canvaBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  "Connect to Canva"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
