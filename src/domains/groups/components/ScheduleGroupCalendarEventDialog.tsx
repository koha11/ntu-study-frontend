"use client";

import * as React from "react";
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

const formSchema = z
  .object({
    summary: z.string().max(500).optional(),
    startLocal: z.string().min(1, "Start is required"),
    endLocal: z.string().min(1, "End is required"),
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
        message: "End must be after start",
        path: ["endLocal"],
      });
    }
    if (data.mode === "offline" && !data.place_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Place name is required",
        path: ["place_name"],
      });
    }
    if (data.mode === "online" && !data.online_option) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a video meeting option",
        path: ["online_option"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

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
  const { mutateAsync: createEvent, isPending } = useCreateGroupCalendarEventMutation();

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
        message: "Set the group Meet link on the Overview tab first.",
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
      toast.success("Event created and invitations sent.");
      onOpenChange(false);
    } catch (e) {
      const raw = e instanceof HttpError ? e.message : "";
      const msg =
        raw?.trim() ||
        (e instanceof Error ? e.message : "") ||
        "Could not create the event.";
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule meeting</DialogTitle>
          <DialogDescription>
            Creates an event on the group&apos;s Google Calendar and emails active members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cal-event-title">Title</Label>
            <Input id="cal-event-title" {...form.register("summary")} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="cal-start">Start</Label>
              <Input id="cal-start" type="datetime-local" {...form.register("startLocal")} />
              {form.formState.errors.startLocal ? (
                <p className="text-xs text-destructive">{form.formState.errors.startLocal.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-end">End</Label>
              <Input id="cal-end" type="datetime-local" {...form.register("endLocal")} />
              {form.formState.errors.endLocal ? (
                <p className="text-xs text-destructive">{form.formState.errors.endLocal.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location type</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => form.setValue("mode", v as "offline" | "online")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="online" id="mode-online" />
                <Label htmlFor="mode-online" className="font-normal">
                  Online (Google Meet)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="offline" id="mode-offline" />
                <Label htmlFor="mode-offline" className="font-normal">
                  Offline (in person)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "offline" ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label htmlFor="place_name">Place name</Label>
                <Input id="place_name" {...form.register("place_name")} placeholder="e.g. Hive Level 2" />
                {form.formState.errors.place_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.place_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_detail">Address details (optional)</Label>
                <Input
                  id="address_detail"
                  {...form.register("address_detail")}
                  placeholder="Room, building, notes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maps_url">Google Maps link (optional)</Label>
                <Input id="maps_url" type="url" {...form.register("maps_url")} placeholder="https://maps.google.com/..." />
              </div>
              {embedSrc ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <iframe title="Map preview" src={embedSrc} className="h-48 w-full" loading="lazy" />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Meet option</Label>
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
                    Use group Meet link (Overview)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="one_time_meet" id="oo-new" />
                  <Label htmlFor="oo-new" className="font-normal">
                    Create one-time Meet link
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.online_option ? (
                <p className="text-xs text-destructive">{form.formState.errors.online_option.message}</p>
              ) : null}
              {!meetLink?.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Add a Meet URL on the Overview tab to enable the group link option.
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-primary">
              {isPending ? "Creating…" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
