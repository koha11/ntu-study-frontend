import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TaskOutcomeLink, OutcomeFile, AddOutcomeLinkInput } from "../types";

export interface TaskOutcomePanelProps {
  taskId: string;
  assigneeId?: string;
  currentUserId?: string;
  driveFolderId?: string;
  links: TaskOutcomeLink[];
  files: OutcomeFile[];
  isLoadingLinks: boolean;
  isLoadingFiles: boolean;
  onAddLink: (input: AddOutcomeLinkInput) => void;
  onRemoveLink: (linkId: string) => void;
  onUploadFile: (file: File) => void;
  onDeleteFile: (fileId: string) => void;
}

export function TaskOutcomePanel({
  assigneeId,
  currentUserId,
  driveFolderId,
  links,
  files,
  isLoadingLinks,
  isLoadingFiles,
  onAddLink,
  onRemoveLink,
  onUploadFile,
  onDeleteFile,
}: TaskOutcomePanelProps) {
  const { t } = useTranslation();
  const isAssignee = Boolean(currentUserId && currentUserId === assigneeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState("");
  const [labelValue, setLabelValue] = useState("");

  function handleAddLink() {
    const url = urlValue.trim();
    if (!url) return;
    const input: AddOutcomeLinkInput = { url };
    if (labelValue.trim()) input.label = labelValue.trim();
    onAddLink(input);
    setUrlValue("");
    setLabelValue("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Links section */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          {t("tasks.outcome.linksSection")}
        </h3>

        {isLoadingLinks ? (
          <p className="text-xs text-muted-foreground">{t("tasks.outcome.loadingLinks")}</p>
        ) : links.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("tasks.outcome.noLinks")}</p>
        ) : (
          <ul className="space-y-1.5">
            {links.map((link) => (
              <li key={link.id} className="flex items-center gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-primary underline-offset-2 hover:underline"
                >
                  {link.label ?? link.url}
                </a>
                {isAssignee && (
                  <button
                    type="button"
                    aria-label={t("tasks.outcome.deleteLink")}
                    onClick={() => onRemoveLink(link.id)}
                    className="shrink-0 text-xs text-destructive hover:underline"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isAssignee && (
          <div className="mt-3 space-y-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder={t("tasks.outcome.urlPlaceholder")}
              className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
            />
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              placeholder={t("tasks.outcome.labelPlaceholder")}
              className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {t("tasks.outcome.addLink")}
            </button>
          </div>
        )}
      </section>

      {/* Files section — only if group has a Drive folder */}
      {driveFolderId && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {t("tasks.outcome.filesSection")}
          </h3>

          {isLoadingFiles ? (
            <p className="text-xs text-muted-foreground">{t("tasks.outcome.loadingFiles")}</p>
          ) : files.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("tasks.outcome.noFiles")}</p>
          ) : (
            <ul className="space-y-1.5">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-primary hover:underline"
                      aria-label={t("tasks.outcome.openInDrive")}
                    >
                      {t("tasks.outcome.openInDrive")}
                    </a>
                  )}
                  {isAssignee && (
                    <button
                      type="button"
                      aria-label={t("tasks.outcome.deleteFile")}
                      onClick={() => onDeleteFile(file.id)}
                      className="shrink-0 text-xs text-destructive hover:underline"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isAssignee && (
            <div className="mt-3">
              <input
                ref={fileInputRef}
                data-testid="outcome-file-input"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                {t("tasks.outcome.uploadFile")}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
