import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Users, Activity, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useGroupsList, useCreateGroup } from "@/domains/groups";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { InviteEmailCombobox } from "@/domains/contacts/components/InviteEmailCombobox";

interface EmailRow {
  id: string;
  email: string;
}

export function GroupsListPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading } = useGroupsList();
  const { mutate: createGroup, isPending } = useCreateGroup();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [reportDate, setReportDate] = React.useState("");
  const [memberRows, setMemberRows] = React.useState<EmailRow[]>([]);

  function addRow() {
    setMemberRows((prev) => [...prev, { id: crypto.randomUUID(), email: "" }]);
  }

  function updateRow(id: string, email: string) {
    setMemberRows((prev) => prev.map((r) => (r.id === id ? { ...r, email } : r)));
  }

  function removeRow(id: string) {
    setMemberRows((prev) => prev.filter((r) => r.id !== id));
  }

  function resetForm() {
    setName("");
    setDesc("");
    setTags("");
    setReportDate("");
    setMemberRows([]);
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("groups.loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("groups.pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("groups.pageSubtitle")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow">
              <Plus className="h-4 w-4" /> {t("groups.newGroup")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("groups.createGroup")}</DialogTitle>
              <DialogDescription>
                {t("groups.createGroupDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">{t("groups.groupName")}</label>
                <Input
                  placeholder={t("groups.groupNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t("groups.description")}</label>
                <Textarea
                  placeholder={t("groups.descriptionPlaceholder")}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-group-report-date" className="text-sm font-medium">
                  {t("groups.reportDate")}
                </Label>
                <DatePicker
                  id="new-group-report-date"
                  value={reportDate}
                  onChange={setReportDate}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("groups.reportDateHint")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">{t("groups.tags")}</label>
                <Input
                  placeholder={t("groups.tagsPlaceholder")}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Members section */}
              <div>
                <label className="block text-sm font-medium">
                  {t("groups.initialMembers", "Add members")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({t("groups.optional", "optional")})
                  </span>
                </label>
                <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
                  {t(
                    "groups.initialMembersHint",
                    "Invitations will be sent to these emails after the group is created.",
                  )}
                </p>

                {memberRows.length > 0 && (
                  <div className="space-y-2">
                    {memberRows.map((row) => (
                      <div key={row.id} className="flex items-start gap-2">
                        <div className="flex-1">
                          <InviteEmailCombobox
                            value={row.email}
                            onChange={(val) => updateRow(row.id, val)}
                            fetchEnabled={true}
                            disabled={isPending}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(row.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addRow}
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("groups.addAnotherMember", "Add another member")}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  const emails = memberRows
                    .map((r) => r.email.trim())
                    .filter(Boolean);
                  createGroup(
                    {
                      name,
                      ...(desc.trim() ? { description: desc.trim() } : {}),
                      ...(reportDate.trim()
                        ? { report_date: reportDate.trim() }
                        : {}),
                      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                      ...(emails.length ? { initial_member_emails: emails } : {}),
                    },
                    {
                      onSuccess: (data) => {
                        resetForm();
                        setOpen(false);
                        if (data.failed_invitations.length > 0) {
                          const list = data.failed_invitations
                            .map((f) => f.email)
                            .join(", ");
                          toast.warning(
                            `Group created. ${data.failed_invitations.length} invitation(s) could not be sent: ${list}`,
                          );
                        }
                      },
                    },
                  );
                }}
                disabled={isPending || !name.trim()}
                className="bg-gradient-primary"
              >
                {isPending ? t("groups.creating") : t("groups.createGroup")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Link
            key={g.id}
            to="/groups/$groupId"
            params={{ groupId: g.id }}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                <Activity className="h-2.5 w-2.5" />
                Group
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t("groups.created")} {new Date(g.created_at).toLocaleDateString()}
              </span>
            </div>

            <h3 className="mt-3 font-semibold leading-tight group-hover:text-primary-glow">
              {g.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
              {g.description ?? ""}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {g.member_count} {t("groups.membersCount")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
