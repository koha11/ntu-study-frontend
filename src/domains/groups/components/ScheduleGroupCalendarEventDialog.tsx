"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HttpError } from "@/domains/auth/auth-api";
import { useCreateGroupCalendarEventMutation } from "@/domains/groups/queries";
import { toast } from "sonner";
import { toGoogleMapsEmbedSrc } from "@/domains/groups/utils/maps-embed";

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function makeFormSchema(t: (key: string) => string) {
  return z
    .object({
      summary: z.string().max(500).optional(),
      startLocal: z.string().min(1, t("groups.scheduleEvent.startRequired")),
      endLocal: z.string().min(1, t("groups.scheduleEvent.endRequired")),
      mode: z.enum(["offline", "online"]),
      place_name: z.string().max(500).optional(),
      address_detail: z.string().max(2000).optional(),
      maps_url: z.union([z.string().url(), z.literal("")]).optional(),
      online_option: z.enum(["group_meet_link", "one_time_meet"]).optional(),
    })
    .superRefine((data, ctx) => {
      const start = new Date(data.startLocal);
      const end = new Date(data.endLocal);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("groups.scheduleEvent.endAfterStart"),
          path: ["endLocal"],
        });
      }
      if (data.mode === "offline" && !data.place_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("groups.scheduleEvent.placeNameRequired"),
          path: ["place_name"],
        });
      }
      if (data.mode === "online" && !data.online_option) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("groups.scheduleEvent.chooseVideoOption"),
          path: ["online_option"],
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof makeFormSchema>>;

export interface ScheduleGroupCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  meetLink: string | null | undefined;
  defaultRange: { start: Date; end: Date };
}

export function ScheduleGroupCalendarEventDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  meetLink,
  defaultRange,
}: ScheduleGroupCalendarEventDialogProps) {
  const { t } = useTranslation();
  const { mutateAsync: createEvent, isPending } = useCreateGroupCalendarEventMutation();

  const formSchema = React.useMemo(() => makeFormSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summary: "",
      startLocal: "",
      endLocal: "",
      mode: "online",
      place_name: "",
      address_detail: "",
      maps_url: "",
      online_option: "one_time_meet",
    },
  });
  const { reset } = form;

  const mode = form.watch("mode");
  const mapsUrl = form.watch("maps_url");
  const embedSrc = React.useMemo(() => {
    const s = mapsUrl?.trim();
    if (!s) return null;
    return toGoogleMapsEmbedSrc(s);
  }, [mapsUrl]);

  React.useEffect(() => {
    if (!open) return;
    reset({
      summary: `${groupName} — NTU Study`,
      startLocal: isoToDatetimeLocalValue(defaultRange.start.toISOString()),
      endLocal: isoToDatetimeLocalValue(defaultRange.end.toISOString()),
      mode: "online",
      place_name: "",
      address_detail: "",
      maps_url: "",
      online_option: meetLink?.trim() ? "group_meet_link" : "one_time_meet",
    });
  }, [open, defaultRange.start, defaultRange.end, groupName, meetLink, reset]);

  const onSubmit = form.handleSubmit(async (values) => {
    const start = new Date(values.startLocal);
    const end = new Date(values.endLocal);
    if (values.mode === "online" && values.online_option === "group_meet_link" && !meetLink?.trim()) {
      form.setError("online_option", {
        message: t("groups.scheduleEvent.setGroupMeetFirst"),
      });
      return;
    }

    try {
      await createEvent({
        groupId,
        input: {
          start: start.toISOString(),
          end: end.toISOString(),
          ...(values.summary?.trim() ? { summary: values.summary.trim() } : {}),
          mode: values.mode,
          ...(values.mode === "offline"
            ? {
                place_name: values.place_name!.trim(),
                ...(values.address_detail?.trim()
                  ? { address_detail: values.address_detail.trim() }
                  : {}),
                ...(values.maps_url?.trim() ? { maps_url: values.maps_url.trim() } : {}),
              }
            : {
                online_option: values.online_option!,
              }),
        },
      });
      toast.success(t("groups.scheduleEvent.eventCreated"));
      onOpenChange(false);
    } catch (e) {
      const raw = e instanceof HttpError ? e.message : "";
      const msg =
        raw?.trim() ||
        (e instanceof Error ? e.message : "") ||
        t("groups.scheduleEvent.couldNotCreate");
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("groups.scheduleEvent.title")}</DialogTitle>
          <DialogDescription>
            {t("groups.scheduleEvent.desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cal-event-title">{t("groups.scheduleEvent.eventTitle")}</Label>
            <Input id="cal-event-title" {...form.register("summary")} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cal-start">{t("groups.scheduleEvent.start")}</Label>
              <Input id="cal-start" type="datetime-local" {...form.register("startLocal")} />
              {form.formState.errors.startLocal ? (
                <p className="text-xs text-destructive">{form.formState.errors.startLocal.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-end">{t("groups.scheduleEvent.end")}</Label>
              <Input id="cal-end" type="datetime-local" {...form.register("endLocal")} />
              {form.formState.errors.endLocal ? (
                <p className="text-xs text-destructive">{form.formState.errors.endLocal.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("groups.scheduleEvent.locationType")}</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => form.setValue("mode", v as "offline" | "online")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="online" id="mode-online" />
                <Label htmlFor="mode-online" className="font-normal">
                  {t("groups.scheduleEvent.online")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="offline" id="mode-offline" />
                <Label htmlFor="mode-offline" className="font-normal">
                  {t("groups.scheduleEvent.offline")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "offline" ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label htmlFor="place_name">{t("groups.scheduleEvent.placeName")}</Label>
                <Input id="place_name" {...form.register("place_name")} placeholder={t("groups.scheduleEvent.placeNamePlaceholder")} />
                {form.formState.errors.place_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.place_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_detail">{t("groups.scheduleEvent.addressDetail")}</Label>
                <Input
                  id="address_detail"
                  {...form.register("address_detail")}
                  placeholder={t("groups.scheduleEvent.addressDetailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maps_url">{t("groups.scheduleEvent.mapsUrl")}</Label>
                <Input id="maps_url" type="url" {...form.register("maps_url")} placeholder="https://maps.google.com/..." />
              </div>
              {embedSrc ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <iframe title={t("groups.scheduleEvent.mapPreview")} src={embedSrc} className="h-48 w-full" loading="lazy" />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("groups.scheduleEvent.meetOption")}</Label>
              <RadioGroup
                value={form.watch("online_option") ?? "one_time_meet"}
                onValueChange={(v) =>
                  form.setValue("online_option", v as "group_meet_link" | "one_time_meet")
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="group_meet_link"
                    id="oo-group"
                    disabled={!meetLink?.trim()}
                  />
                  <Label htmlFor="oo-group" className={`font-normal ${!meetLink?.trim() ? "text-muted-foreground" : ""}`}>
                    {t("groups.scheduleEvent.useGroupMeetLink")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="one_time_meet" id="oo-new" />
                  <Label htmlFor="oo-new" className="font-normal">
                    {t("groups.scheduleEvent.createOneTimeMeet")}
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.online_option ? (
                <p className="text-xs text-destructive">{form.formState.errors.online_option.message}</p>
              ) : null}
              {!meetLink?.trim() ? (
                <p className="text-xs text-muted-foreground">
                  {t("groups.scheduleEvent.addMeetOnOverview")}
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-primary">
              {isPending ? t("groups.scheduleEvent.creating") : t("groups.scheduleEvent.createEvent")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
