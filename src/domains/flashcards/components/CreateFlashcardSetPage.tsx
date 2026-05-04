import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useCreateFlashcardSetMutation,
  useAddFlashcardMutation,
  useUpdateFlashcardSetMutation,
  useUpdateFlashcardMutation,
  useDeleteFlashcardMutation,
  flashcardDetailQueryOptions,
} from "@/domains/flashcards/queries";
import { ImportFlashcardsModal } from "./ImportFlashcardsModal";
import { cn } from "@/lib/utils";
import { flashcardKeys } from "@/shared/adapters/query-keys";

type CardRow = { key: string; serverCardId?: string; front: string; back: string };

function newRow(): CardRow {
  return { key: crypto.randomUUID(), front: "", back: "" };
}

type InitialCardSnapshot = {
  cardIds: Set<string>;
  cards: Map<string, { front: string; back: string }>;
};

export type CreateFlashcardSetPageProps = {
  /** When set, page loads the set and saves as update. */
  editSetId?: string;
};

export function CreateFlashcardSetPage({ editSetId }: CreateFlashcardSetPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(editSetId);

  const { data: remoteSet, isLoading, isError, error: loadError } = useQuery({
    ...flashcardDetailQueryOptions(editSetId ?? ""),
    enabled: isEdit,
  });

  const { mutateAsync: createSet, isPending: creating } = useCreateFlashcardSetMutation();
  const { mutateAsync: addCard } = useAddFlashcardMutation();
  const { mutateAsync: patchSet } = useUpdateFlashcardSetMutation();
  const { mutateAsync: patchCard } = useUpdateFlashcardMutation();
  const { mutateAsync: removeCard } = useDeleteFlashcardMutation();

  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rows, setRows] = React.useState<CardRow[]>(() => [newRow(), newRow()]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const initialSnapshotRef = React.useRef<InitialCardSnapshot | null>(null);
  const loadedFromServerRef = React.useRef(false);

  React.useEffect(() => {
    loadedFromServerRef.current = false;
    initialSnapshotRef.current = null;
  }, [editSetId]);

  React.useEffect(() => {
    if (!isEdit || !remoteSet || loadedFromServerRef.current) return;
    loadedFromServerRef.current = true;
    setTitle(remoteSet.name);
    setSubject(remoteSet.subject ?? "");
    setDescription(remoteSet.description ?? "");
    if (remoteSet.cards.length > 0) {
      setRows(
        remoteSet.cards.map((c) => ({
          key: c.id,
          serverCardId: c.id,
          front: c.front,
          back: c.back,
        })),
      );
      initialSnapshotRef.current = {
        cardIds: new Set(remoteSet.cards.map((c) => c.id)),
        cards: new Map(
          remoteSet.cards.map((c) => [c.id, { front: c.front, back: c.back }]),
        ),
      };
    } else {
      setRows([newRow()]);
      initialSnapshotRef.current = { cardIds: new Set(), cards: new Map() };
    }
  }, [isEdit, remoteSet]);

  const filledRows = rows.filter((r) => r.front.trim() && r.back.trim());

  const saveCreate = async (openPractice: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a title for your set.");
      return;
    }
    if (filledRows.length === 0) {
      setError("Add at least one card with a term and definition.");
      return;
    }
    setSaving(true);
    try {
      const set = await createSet({
        name: title.trim(),
        subject: subject.trim() || undefined,
        description: description.trim() || undefined,
      });
      for (const r of filledRows) {
        await addCard({
          setId: set.id,
          input: { front: r.front.trim(), back: r.back.trim() },
        });
      }
      if (openPractice) {
        await navigate({ to: "/flashcards", search: { studySet: set.id } });
      } else {
        await navigate({ to: "/flashcards" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (openPractice: boolean) => {
    if (!editSetId || !initialSnapshotRef.current) return;
    setError(null);
    if (!title.trim()) {
      setError("Please enter a title for your set.");
      return;
    }
    if (filledRows.length === 0) {
      setError("Add at least one card with a term and definition.");
      return;
    }
    setSaving(true);
    const snap = initialSnapshotRef.current;
    try {
      await patchSet({
        setId: editSetId,
        input: {
          name: title.trim(),
          subject: subject.trim() || null,
          description: description.trim() || null,
        },
      });

      const currentServerIds = new Set(
        filledRows.filter((r) => r.serverCardId).map((r) => r.serverCardId!),
      );
      for (const id of snap.cardIds) {
        if (!currentServerIds.has(id)) {
          await removeCard({ setId: editSetId, cardId: id });
        }
      }

      for (const r of filledRows) {
        const front = r.front.trim();
        const back = r.back.trim();
        if (r.serverCardId) {
          const prev = snap.cards.get(r.serverCardId);
          if (prev && (prev.front !== front || prev.back !== back)) {
            await patchCard({
              setId: editSetId,
              cardId: r.serverCardId,
              input: { front, back },
            });
          }
        } else {
          await addCard({ setId: editSetId, input: { front, back } });
        }
      }

      await queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
      if (openPractice) {
        await navigate({ to: "/flashcards", search: { studySet: editSetId } });
      } else {
        await navigate({ to: "/flashcards" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const save = (openPractice: boolean) => {
    if (isEdit) void saveEdit(openPractice);
    else void saveCreate(openPractice);
  };

  const busy = saving || creating;

  if (isEdit) {
    if (isLoading) {
      return (
        <AppShell>
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            Loading set…
          </div>
        </AppShell>
      );
    }
    if (isError) {
      return (
        <AppShell>
          <div className="mx-auto max-w-md py-12 text-center">
            <p className="text-destructive">
              {loadError instanceof Error ? loadError.message : "Could not load this set."}
            </p>
            <Button asChild className="mt-4" variant="secondary">
              <Link to="/flashcards">Back to flashcards</Link>
            </Button>
          </div>
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <div className="mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/flashcards"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to flashcards
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => save(false)}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create set"}
            </Button>
            <Button
              className="bg-gradient-primary shadow-glow"
              disabled={busy}
              onClick={() => save(true)}
            >
              {busy ? "Saving…" : isEdit ? "Save and practice" : "Create and practice"}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? "Edit flashcard set" : "Create a new flashcard set"}
        </h1>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="set-title">Title</Label>
            <Input
              id="set-title"
              className="mt-1.5"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="set-subject">Subject (optional)</Label>
            <Input
              id="set-subject"
              className="mt-1.5"
              placeholder="e.g. CS2040"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="set-desc">Description (optional)</Label>
            <Textarea
              id="set-desc"
              className="mt-1.5 min-h-[80px]"
              placeholder="Add a description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-b border-border pb-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                "grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto]",
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                {index + 1}
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Term</Label>
                <Input
                  className="mt-1"
                  placeholder="Enter term"
                  value={row.front}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, front: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Definition</Label>
                <Input
                  className="mt-1"
                  placeholder="Enter definition"
                  value={row.back}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, back: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="flex items-end justify-end sm:items-center sm:pb-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={rows.length <= 1}
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  aria-label="Remove card"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => setRows((prev) => [...prev, newRow()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a card
        </Button>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border pt-6">
          <Button variant="secondary" disabled={busy} onClick={() => save(false)}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create set"}
          </Button>
          <Button className="bg-gradient-primary" disabled={busy} onClick={() => save(true)}>
            {busy ? "Saving…" : isEdit ? "Save and practice" : "Create and practice"}
          </Button>
        </div>
      </div>

      <ImportFlashcardsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onAppend={(parsed) => {
          setRows((prev) => [
            ...prev,
            ...parsed.map((p) => ({
              key: crypto.randomUUID(),
              front: p.term,
              back: p.definition,
            })),
          ]);
        }}
      />
    </AppShell>
  );
}
