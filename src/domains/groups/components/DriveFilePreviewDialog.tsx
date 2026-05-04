"use client";

import * as React from "react";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchGroupDriveFileBlob, type DriveAsset } from "../drive-api";
import { HttpError } from "@/domains/auth/auth-api";

function normalizeContentType(ct: string | null): string {
  if (!ct) return "";
  return ct.split(";")[0].trim().toLowerCase();
}

export interface DriveFilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: DriveAsset | null;
  groupId: string;
  accessToken: string;
}

type PreviewBody =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "blob-url"; url: string; mode: "pdf" | "image" | "video" }
  | { kind: "docx-html"; html: string }
  | { kind: "sheet"; rows: (string | number | boolean | null)[][] }
  | { kind: "unsupported"; hint: string };

const MAX_SHEET_ROWS = 400;

export function DriveFilePreviewDialog({
  open,
  onOpenChange,
  asset,
  groupId,
  accessToken,
}: DriveFilePreviewDialogProps) {
  const [body, setBody] = React.useState<PreviewBody>({ kind: "loading" });
  const blobUrlRef = React.useRef<string | null>(null);

  const revokeBlob = React.useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!open || !asset) {
      revokeBlob();
      setBody({ kind: "loading" });
      return;
    }

    let cancelled = false;
    revokeBlob();
    setBody({ kind: "loading" });

    (async () => {
      try {
        const { blob, contentType } = await fetchGroupDriveFileBlob(groupId, accessToken, asset.id);
        if (cancelled) return;

        const ct = normalizeContentType(contentType);
        const mime = asset.mimeType.toLowerCase();
        const nameLower = asset.name.toLowerCase();

        if (ct === "application/pdf") {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBody({ kind: "blob-url", url, mode: "pdf" });
          return;
        }

        if (ct.startsWith("image/") || mime.startsWith("image/")) {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBody({ kind: "blob-url", url, mode: "image" });
          return;
        }

        if (ct.startsWith("video/") || mime.startsWith("video/")) {
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setBody({ kind: "blob-url", url, mode: "video" });
          return;
        }

        const isDocx =
          ct === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          nameLower.endsWith(".docx");

        if (isDocx) {
          const ab = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: ab });
          if (cancelled) return;
          setBody({ kind: "docx-html", html: result.value });
          return;
        }

        const isSheet =
          ct === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          mime === "application/vnd.google-apps.spreadsheet" ||
          nameLower.endsWith(".xlsx");

        if (isSheet) {
          const ab = await blob.arrayBuffer();
          const workbook = XLSX.read(ab, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
          if (!sheet) {
            setBody({
              kind: "unsupported",
              hint: "Could not read this spreadsheet. Open it in Google Drive instead.",
            });
            return;
          }
          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          }) as (string | number | boolean | null)[][];
          if (cancelled) return;
          setBody({
            kind: "sheet",
            rows: rows.slice(0, MAX_SHEET_ROWS),
          });
          return;
        }

        setBody({
          kind: "unsupported",
          hint: "Preview is not available for this file type. Open it in Google Drive instead.",
        });
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof HttpError
            ? `Could not load preview (${e.status}).`
            : "Could not load preview.";
        setBody({ kind: "error", message: msg });
      }
    })();

    return () => {
      cancelled = true;
      revokeBlob();
    };
  }, [open, asset, groupId, accessToken, revokeBlob]);

  const title = asset?.name ?? "Preview";

  /** Image/video: cap height within modal body */
  const previewMaxH = "min(calc(95dvh - 8.5rem), calc(95vh - 8.5rem))";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(95dvh,95vh)] max-h-[min(95dvh,95vh)] w-full max-w-6xl flex-col gap-4 overflow-hidden p-6 sm:max-w-6xl">
        <DialogHeader className="shrink-0 space-y-0 pr-8">
          <DialogTitle className="truncate pr-8">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {body.kind === "loading" ? (
            <p className="shrink-0 text-sm text-muted-foreground" data-testid="drive-preview-loading">
              Loading preview…
            </p>
          ) : null}

          {body.kind === "error" ? (
            <p className="shrink-0 text-sm text-destructive" data-testid="drive-preview-error">
              {body.message}
            </p>
          ) : null}

          {body.kind === "blob-url" && body.mode === "pdf" ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border">
              <iframe
                title={title}
                src={body.url}
                className="absolute inset-0 h-full w-full rounded-[inherit]"
                data-testid="drive-preview-pdf"
              />
            </div>
          ) : null}

          {body.kind === "blob-url" && body.mode === "image" ? (
            <img
              src={body.url}
              alt=""
              className="mx-auto w-auto max-w-full object-contain"
              style={{ maxHeight: previewMaxH }}
              data-testid="drive-preview-image"
            />
          ) : null}

          {body.kind === "blob-url" && body.mode === "video" ? (
            <video
              src={body.url}
              controls
              className="mx-auto w-full max-w-full"
              style={{ maxHeight: previewMaxH }}
              data-testid="drive-preview-video"
            />
          ) : null}

          {body.kind === "docx-html" ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className="max-w-none border border-border p-4 text-sm leading-relaxed [&_p]:my-2"
                data-testid="drive-preview-docx"
                dangerouslySetInnerHTML={{ __html: body.html }}
              />
            </div>
          ) : null}

          {body.kind === "sheet" ? (
            <div
              className="min-h-0 flex-1 overflow-auto border border-border"
              data-testid="drive-preview-sheet"
            >
              <table className="w-full border-collapse text-left text-xs">
                <tbody>
                  {body.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-r border-border px-2 py-1">
                          {cell === null || cell === undefined ? "" : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {body.kind === "unsupported" ? (
            <div
              className="shrink-0 space-y-3 text-sm text-muted-foreground"
              data-testid="drive-preview-unsupported"
            >
              <p>{body.hint}</p>
              {asset?.webViewLink ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={asset.webViewLink} target="_blank" rel="noopener noreferrer">
                    Open in Drive <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
