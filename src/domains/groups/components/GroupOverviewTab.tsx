"use client";

import * as React from "react";
import { ExternalLink, Calendar, FileText, Folder, Presentation, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GroupQuickLinksEditDialog } from "./GroupQuickLinksEditDialog";
import { GroupScheduleMeetDialog } from "./GroupScheduleMeetDialog";
import type { UpdateGroupInput } from "../types";

export interface GroupOverviewTabProps {
  groupId: string;
  driveFolderId?: string | null;
  canvaFileUrl?: string | null;
  docFileUrl?: string | null;
  meetLink?: string | null;
  reportDate?: string | null;
  isLeader: boolean;
  groupLocked: boolean;
  onSave: (
    patch: Pick<
      UpdateGroupInput,
      "meet_link" | "report_date" | "canva_file_url" | "doc_file_url"
    >,
  ) => void;
  isSaving: boolean;
}

export function buildDriveFolderUrl(folderId: string | null | undefined): string | null {
  const id = folderId?.trim();
  return id ? `https://drive.google.com/drive/folders/${id}` : null;
}

function parseReportDateForDisplay(iso: string): Date {
  const s = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00Z`);
  }
  return new Date(s);
}

function formatReportDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = parseReportDateForDisplay(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(d);
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const s = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function LinkRow(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string | null;
  linkLabel: string;
  emptyText: string;
}) {
  const { icon, title, description, href, linkLabel, emptyText } = props;
  const hasLink = Boolean(href?.trim());

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {hasLink ? (
          <a
            href={href!.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {linkLabel} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export function GroupOverviewTab({
  groupId,
  driveFolderId,
  canvaFileUrl,
  docFileUrl,
  meetLink,
  reportDate,
  isLeader,
  groupLocked,
  onSave,
  isSaving,
}: GroupOverviewTabProps) {
  const { t } = useTranslation();
  const driveHref = buildDriveFolderUrl(driveFolderId);
  const [canvaDraft, setCanvaDraft] = React.useState(() => canvaFileUrl?.trim() ?? "");
  const [docDraft, setDocDraft] = React.useState(() => docFileUrl?.trim() ?? "");
  const [meetDraft, setMeetDraft] = React.useState(() => meetLink?.trim() ?? "");
  const [dateDraft, setDateDraft] = React.useState(() => toDateInputValue(reportDate));
  const [editOpen, setEditOpen] = React.useState(false);
  const saveSubmittedRef = React.useRef(false);

  React.useEffect(() => {
    setCanvaDraft(canvaFileUrl?.trim() ?? "");
  }, [canvaFileUrl]);

  React.useEffect(() => {
    setDocDraft(docFileUrl?.trim() ?? "");
  }, [docFileUrl]);

  React.useEffect(() => {
    setMeetDraft(meetLink?.trim() ?? "");
  }, [meetLink]);

  React.useEffect(() => {
    setDateDraft(toDateInputValue(reportDate));
  }, [reportDate]);

  React.useEffect(() => {
    if (!isSaving && saveSubmittedRef.current && editOpen) {
      setEditOpen(false);
      saveSubmittedRef.current = false;
    }
  }, [isSaving, editOpen]);

  const dueDisplay = formatReportDate(reportDate);
  const canEdit = isLeader && !groupLocked;

  const syncDraftsFromProps = React.useCallback(() => {
    setCanvaDraft(canvaFileUrl?.trim() ?? "");
    setDocDraft(docFileUrl?.trim() ?? "");
    setMeetDraft(meetLink?.trim() ?? "");
    setDateDraft(toDateInputValue(reportDate));
  }, [canvaFileUrl, docFileUrl, meetLink, reportDate]);

  const handleEditOpenChange = (next: boolean) => {
    setEditOpen(next);
    if (next) {
      syncDraftsFromProps();
    }
  };

  const handleSave = () => {
    const canva = canvaDraft.trim();
    const doc = docDraft.trim();
    const meet = meetDraft.trim();
    const date = dateDraft.trim();
    saveSubmittedRef.current = true;
    onSave({
      canva_file_url: canva.length > 0 ? canva : null,
      doc_file_url: doc.length > 0 ? doc : null,
      meet_link: meet.length > 0 ? meet : null,
      report_date: date.length > 0 ? date : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">{t("groups.overview.quickLinks")}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("groups.overview.quickLinksDesc")}
            </p>
          </div>
          {canEdit ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <GroupScheduleMeetDialog groupId={groupId} />
              <GroupQuickLinksEditDialog
                open={editOpen}
                onOpenChange={handleEditOpenChange}
                canvaDraft={canvaDraft}
                docDraft={docDraft}
                meetDraft={meetDraft}
                dateDraft={dateDraft}
                onCanvaDraftChange={setCanvaDraft}
                onDocDraftChange={setDocDraft}
                onMeetDraftChange={setMeetDraft}
                onDateDraftChange={setDateDraft}
                onSave={handleSave}
                isSaving={isSaving}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <LinkRow
            icon={<Folder className="h-5 w-5" />}
            title={t("groups.overview.googleDrive")}
            description={t("groups.overview.googleDriveDesc")}
            href={driveHref}
            linkLabel={t("groups.overview.openInDrive")}
            emptyText={t("groups.overview.noDriveFolder")}
          />
          <LinkRow
            icon={<Presentation className="h-5 w-5" />}
            title={t("groups.overview.canva")}
            description={t("groups.overview.canvaDesc")}
            href={canvaFileUrl?.trim() || null}
            linkLabel={t("groups.overview.openInCanva")}
            emptyText={t("groups.overview.noCanva")}
          />
          <LinkRow
            icon={<Video className="h-5 w-5" />}
            title={t("groups.overview.googleMeet")}
            description={t("groups.overview.googleMeetDesc")}
            href={meetLink?.trim() || null}
            linkLabel={t("groups.overview.openMeet")}
            emptyText={t("groups.overview.noMeet")}
          />
          <LinkRow
            icon={<FileText className="h-5 w-5" />}
            title={t("groups.overview.projectDoc")}
            description={t("groups.overview.projectDocDesc")}
            href={docFileUrl?.trim() || null}
            linkLabel={t("groups.overview.openDoc")}
            emptyText={t("groups.overview.noDoc")}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-bold text-foreground">{t("groups.overview.projectDue")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("groups.overview.projectDueDesc")}
            </p>
            {dueDisplay ? (
              <p className="mt-3 text-sm font-medium text-foreground" data-testid="report-date-display">
                {dueDisplay}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t("groups.overview.noDueDate")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
