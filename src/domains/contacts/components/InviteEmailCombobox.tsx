"use client";

import * as React from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { HttpError } from "@/domains/auth/auth-api";
import type { ContactSuggestion } from "../contacts-api";
import { useGoogleContactSuggestions } from "../hooks/useGoogleContactSuggestions";

/** Saturated circle backgrounds similar to Google Drive / Gmail picker */
const AVATAR_SURFACE: readonly string[] = [
  "bg-[#1e8e3e] text-white",
  "bg-[#f9ab00] text-white",
  "bg-[#0f9d58] text-white",
  "bg-[#c5221f] text-white",
  "bg-[#9334e6] text-white",
  "bg-[#c2185b] text-white",
  "bg-[#00838f] text-white",
  "bg-[#5f6368] text-white",
];

function hashEmailToPaletteIndex(email: string): number {
  let h = 0;
  const lower = email.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    h = (Math.imul(31, h) + lower.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % AVATAR_SURFACE.length;
}

function contactInitial(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const first = [...source][0];
  return first ? first.toLocaleUpperCase() : "?";
}

function ContactSuggestionRow({ c }: { c: ContactSuggestion }) {
  const paletteClass = AVATAR_SURFACE[hashEmailToPaletteIndex(c.email)];
  const initial = contactInitial(c.display_name, c.email);
  const title = c.display_name?.trim() || c.email;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar className="h-10 w-10 shrink-0 border border-border/40 shadow-sm">
        {c.photo_url ? <AvatarImage src={c.photo_url} alt="" referrerPolicy="no-referrer" /> : null}
        <AvatarFallback
          className={cn(
            "rounded-full text-[15px] font-medium",
            !c.photo_url ? paletteClass : "bg-muted text-muted-foreground",
          )}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
          {c.email}
        </div>
      </div>
    </div>
  );
}

export interface InviteEmailComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fetchEnabled: boolean;
  className?: string;
}

export function InviteEmailCombobox({
  id,
  value,
  onChange,
  disabled,
  fetchEnabled,
  className,
}: InviteEmailComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const {
    data = [],
    isFetching,
    isError,
    error,
  } = useGoogleContactSuggestions(value, fetchEnabled);

  const canShowPanel = fetchEnabled && value.trim().length >= 2;
  const forbidden = isError && error instanceof HttpError && error.status === 403;

  React.useEffect(() => {
    if (!canShowPanel) {
      setOpen(false);
    }
  }, [canShowPanel]);

  return (
    <div className="relative">
      <Popover
        open={open && canShowPanel}
        onOpenChange={(next) => {
          setOpen(next);
        }}
      >
        <PopoverAnchor asChild>
          <Input
            id={id}
            type="email"
            placeholder="member@ntu.edu.vn"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              if (fetchEnabled && e.target.value.trim().length >= 2) {
                setOpen(true);
              }
            }}
            className={cn("mt-1", className)}
            autoComplete="off"
            onFocus={() => {
              if (fetchEnabled && value.trim().length >= 2) {
                setOpen(true);
              }
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-[min(calc(100vw-2rem),420px)] overflow-hidden rounded-xl border-border/80 bg-popover p-0 shadow-lg"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} className="bg-popover">
            <CommandList className="max-h-[min(360px,50vh)] py-1">
              {isFetching ? (
                <div className="px-4 py-4 text-sm text-muted-foreground">Loading contacts…</div>
              ) : isError ? (
                <div className="px-4 py-4 text-sm text-destructive">
                  {forbidden
                    ? "Contacts permission missing. Sign out and sign in again."
                    : "Could not load suggestions."}
                </div>
              ) : data.length === 0 ? (
                <CommandEmpty className="py-6 text-sm text-muted-foreground">
                  <div className="px-3">No matching contacts.</div>
                </CommandEmpty>
              ) : (
                <CommandGroup className="p-0">
                  {data.map((c) => (
                    <CommandItem
                      key={c.email}
                      value={c.email}
                      onSelect={() => {
                        onChange(c.email);
                        setOpen(false);
                      }}
                      className="cursor-pointer rounded-none px-3 py-1.5 aria-selected:bg-accent"
                    >
                      <ContactSuggestionRow c={c} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
