import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Users, Activity } from "lucide-react";
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

export function GroupsListPage() {
  const { data: groups = [], isLoading } = useGroupsList();
  const { mutate: createGroup, isPending } = useCreateGroup();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [reportDate, setReportDate] = React.useState("");

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading groups...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collaborate with classmates on courses, projects, and reading clubs.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow">
              <Plus className="h-4 w-4" /> New group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new group</DialogTitle>
              <DialogDescription>
                Set up a group for collaboration. You&apos;ll be the leader.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Group name</label>
                <Input
                  placeholder="e.g., CS101 Study Group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What's this group about?"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-group-report-date" className="text-sm font-medium">
                  Report / due date
                </Label>
                <Input
                  id="new-group-report-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional target date for the deliverable or report.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium">Tags</label>
                <Input
                  placeholder="e.g., CS, algorithms, study"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  createGroup(
                    {
                      name,
                      ...(desc.trim() ? { description: desc.trim() } : {}),
                      ...(reportDate.trim()
                        ? { report_date: reportDate.trim() }
                        : {}),
                      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    },
                    {
                      onSuccess: () => {
                        setName("");
                        setDesc("");
                        setTags("");
                        setReportDate("");
                        setOpen(false);
                      },
                    },
                  );
                }}
                disabled={isPending || !name.trim()}
                className="bg-gradient-primary"
              >
                {isPending ? "Creating..." : "Create group"}
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
                Created {new Date(g.created_at).toLocaleDateString()}
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
                  {g.member_count} members
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
