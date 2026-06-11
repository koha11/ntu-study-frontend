import * as React from "react";
import { Link, notFound, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useGroupDetails, useGroupMembers, useUpdateGroup, useLockGroup, useUnlockGroup } from "@/domains/groups";
import { useGroupTasks, useCreateTaskMutation, GroupKanbanBoard, TaskForm } from "@/domains/tasks";
import { useCurrentUser } from "@/domains/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ContributionTab } from "./ContributionTab";
import { DriveTab } from "./DriveTab";
import { CanvaTab } from "./CanvaTab";
import { CalendarTab } from "./CalendarTab";
import { GroupOverviewTab } from "./GroupOverviewTab";
import { MembersTab } from "./MembersTab";
import { SharedFlashcardsTab } from "./SharedFlashcardsTab";
import { UnlockGroupDialog } from "./UnlockGroupDialog";

const GROUP_TABS = [
  "overview",
  "tasks",
  "drive",
  // "canva", // temporarily hidden
  "calendar",
  "members",
  "contribution",
  "flashcards",
] as const;

type GroupTab = (typeof GROUP_TABS)[number];

function tabFromSearch(tab: string | undefined): GroupTab {
  if (tab && (GROUP_TABS as readonly string[]).includes(tab)) {
    return tab as GroupTab;
  }
  return "overview";
}

export function GroupDetailPage() {
  const { t } = useTranslation();
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const { tab: tabSearch } = useSearch({ from: "/groups/$groupId" });
  const id = groupId as string;
  const initialTab = tabFromSearch(tabSearch);

  const { data: group, isLoading: groupLoading, isError: groupError } = useGroupDetails(id);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(id);
  const { data: groupTasks = [], isLoading: tasksLoading } = useGroupTasks(id);
  const { mutate: createTask, isPending: createTaskPending } = useCreateTaskMutation();
  const { mutate: patchGroup, isPending: overviewSavePending } = useUpdateGroup();
  const { mutate: lockGroupMutate, isPending: lockPending } = useLockGroup();
  const { mutate: unlockGroupMutate, isPending: unlockPending } = useUnlockGroup();

  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = React.useState(false);

  if (groupLoading || tasksLoading || userLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("groups.loadingGroup")}</div>
        </div>
      </AppShell>
    );
  }

  if (groupError || !group) throw notFound();

  const currentUserId = currentUser?.id ?? "";
  const isLeader = Boolean(currentUserId && group.leader_id === currentUserId);
  const isLocked = group.status === "locked";

  // Lock button state
  const hasReportDate = Boolean(group.report_date);
  const reportDatePassed =
    hasReportDate && new Date(group.report_date!).setHours(0, 0, 0, 0) < Date.now();
  const lockDisabledReason = !hasReportDate
    ? t("groups.lockGroupDisabledNoDate")
    : !reportDatePassed
      ? t("groups.lockGroupDisabledFuture")
      : null;

  function handleLock() {
    lockGroupMutate(id, {
      onSuccess: () => toast.success(t("groups.lockGroup")),
      onError: (err) => toast.error(err instanceof Error ? err.message : String(err)),
    });
  }

  function handleUnlock(reason: string) {
    unlockGroupMutate(
      { groupId: id, reason },
      {
        onSuccess: () => {
          setUnlockDialogOpen(false);
          toast.success(t("groups.unlockGroup"));
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : String(err)),
      },
    );
  }

  return (
    <AppShell>
      <Link
        to="/groups"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> {t("groups.allGroups")}
      </Link>

      <div className="rounded-2xl border border-border bg-gradient-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                  group.status === "active" && "border-success/30 bg-success/15 text-success",
                  group.status === "locked" && "border-border bg-muted text-muted-foreground",
                  group.status !== "active" &&
                    group.status !== "locked" &&
                    "border-warning/30 bg-warning/15 text-warning",
                )}
              >
                {group.status === "locked" ? (
                  <>
                    <Lock className="mr-1 inline h-3 w-3" /> {t("groups.locked")}
                  </>
                ) : (
                  group.status
                )}
              </span>
              {group.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{group.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {group.description ?? ""}
            </p>
          </div>

          {isLeader && (
            <div className="flex shrink-0 items-center">
              {isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnlockDialogOpen(true)}
                  disabled={unlockPending}
                >
                  <LockOpen className="mr-1.5 h-3.5 w-3.5" />
                  {t("groups.unlockGroup")}
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLock}
                          disabled={Boolean(lockDisabledReason) || lockPending}
                        >
                          <Lock className="mr-1.5 h-3.5 w-3.5" />
                          {lockPending ? t("groups.lockGroupConfirming") : t("groups.lockGroup")}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {lockDisabledReason && (
                      <TooltipContent>{lockDisabledReason}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t("groups.lockedBannerTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("groups.lockedBannerDesc")}</p>
          </div>
        </div>
      )}

      <UnlockGroupDialog
        open={unlockDialogOpen}
        isPending={unlockPending}
        onOpenChange={setUnlockDialogOpen}
        onConfirm={handleUnlock}
      />

      <Tabs key={initialTab} defaultValue={initialTab} className="mt-6">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="overview">{t("groups.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="tasks">{t("groups.tabs.tasks")}</TabsTrigger>
            <TabsTrigger value="drive">{t("groups.tabs.drive")}</TabsTrigger>
            {/* <TabsTrigger value="canva">{t("groups.tabs.canva")}</TabsTrigger> */}
            <TabsTrigger value="calendar">{t("groups.tabs.calendar")}</TabsTrigger>
            <TabsTrigger value="members">
              {t("groups.tabs.members")} ({membersLoading ? "…" : members.length})
            </TabsTrigger>
            <TabsTrigger value="contribution">{t("groups.tabs.contribution")}</TabsTrigger>
            <TabsTrigger value="flashcards">{t("groups.tabs.flashcards")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <GroupOverviewTab
            groupId={id}
            driveFolderId={group.drive_folder_id}
            canvaFileUrl={group.canva_file_url}
            docFileUrl={group.doc_file_url}
            meetLink={group.meet_link}
            reportDate={group.report_date}
            isLeader={isLeader}
            groupLocked={group.status === "locked"}
            isSaving={overviewSavePending}
            onSave={(data) => {
              patchGroup({ id, data });
            }}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t("groups.tasksTab.hint", {
                inProgress: t("groups.tasksTab.inProgress"),
                review: t("groups.tasksTab.review"),
              })}
            </p>
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className="bg-gradient-primary"
                  disabled={isLocked}
                >
                  {t("groups.tasksTab.newTask")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("groups.tasksTab.newGroupTask")}</DialogTitle>
                </DialogHeader>
                <TaskForm
                  defaultGroupId={id}
                  memberOptions={members.map((m) => ({
                    userId: m.user_id,
                    label: m.full_name?.trim() || m.user_id,
                  }))}
                  defaultAssigneeId={currentUserId || undefined}
                  isLoading={createTaskPending}
                  onCancel={() => setCreateTaskOpen(false)}
                  onSubmit={(data) => {
                    createTask(data, {
                      onSuccess: () => setCreateTaskOpen(false),
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <GroupKanbanBoard
            tasks={groupTasks}
            isLeader={isLeader}
            groupId={id}
            groupName={group.name}
            memberOptions={members.map((m) => ({
              userId: m.user_id,
              label: m.full_name?.trim() || m.user_id,
            }))}
            defaultAssigneeId={currentUserId || undefined}
            currentUserId={currentUserId || undefined}
          />
          {groupTasks.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              {t("groups.tasksTab.noTasks")}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="drive" className="mt-6">
          <DriveTab groupId={id} driveFolderId={group.drive_folder_id} groupLocked={isLocked} />
        </TabsContent>

        {/* <TabsContent value="canva" className="mt-6">
          <CanvaTab groupId={groupId} hasDesign={Boolean(group.canva_design_id)} />
        </TabsContent> */}

        <TabsContent value="calendar" className="mt-6">
          <CalendarTab
            groupId={id}
            groupName={group.name}
            google_calendar_id={group.google_calendar_id}
            meet_link={group.meet_link}
            isLeader={isLeader}
            groupLocked={isLocked}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6" id="members-panel">
          <MembersTab
            groupId={id}
            leaderId={group.leader_id}
            isLeader={isLeader}
            groupLocked={isLocked}
            members={members}
            membersLoading={membersLoading}
          />
        </TabsContent>

        <TabsContent value="contribution" className="mt-6">
          <ContributionTab
            groupId={id}
            isLeader={isLeader}
            groupLocked={group.status === "locked"}
          />
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <SharedFlashcardsTab groupId={id} currentUserId={currentUserId} groupLocked={isLocked} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
