/**
 * TanStack Query Key Factory
 *
 * Centralized query key definitions for all data fetching.
 * This ensures consistent cache invalidation and prevents stale cache bugs.
 *
 * Pattern:
 * - Keys are hierarchical arrays
 * - Each level represents a data scope
 * - Leaf keys include specific parameters
 *
 * Usage:
 * const { data } = useQuery({
 *   queryKey: queryKeys.groups.list(),
 *   queryFn: () => groupsAdapter.getAll(),
 * });
 *
 * Reference: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

/**
 * Groups query keys
 */
export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (filters?: { role?: string; status?: string }) =>
    [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (id: string) => [...groupKeys.detail(id), "members"] as const,
  tasks: (id: string) => [...groupKeys.detail(id), "tasks"] as const,
};

/**
 * Tasks query keys
 */
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: {
    status?: string;
    groupId?: string;
    assignee?: string;
    assignedInGroups?: boolean;
  }) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  subtasks: (id: string) => [...taskKeys.detail(id), "subtasks"] as const,
};

/**
 * Flashcards query keys
 */
export const flashcardKeys = {
  all: ["flashcards"] as const,
  lists: () => [...flashcardKeys.all, "list"] as const,
  list: (filters?: { subject?: string }) => [...flashcardKeys.lists(), { filters }] as const,
  details: () => [...flashcardKeys.all, "detail"] as const,
  detail: (id: string) => [...flashcardKeys.details(), id] as const,
  cards: (id: string) => [...flashcardKeys.detail(id), "cards"] as const,
};

/**
 * Invitations (group invites — validate/accept + leader list)
 */
export const invitationKeys = {
  all: ["invitations"] as const,
  validate: (token: string) => [...invitationKeys.all, "validate", token] as const,
  groupPending: (groupId: string) =>
    [...invitationKeys.all, "group", groupId, "pending"] as const,
};

/**
 * Notifications query keys
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: { unreadOnly?: boolean }) => [...notificationKeys.lists(), { filters }] as const,
  count: () => [...notificationKeys.all, "count"] as const,
};

/**
 * User/Auth query keys
 */
export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  profile: (id: string) => [...userKeys.all, id] as const,
  preferences: () => [...userKeys.all, "preferences"] as const,
};

/**
 * Google Contacts (People API proxy) suggestions
 */
export const contactKeys = {
  all: ["contacts"] as const,
  suggestions: (q: string) => [...contactKeys.all, "suggestions", q] as const,
};

/**
 * Contributions query keys
 */
export const contributionKeys = {
  all: ["contributions"] as const,
  summaries: (groupId: string) => [...contributionKeys.all, "summary", groupId] as const,
  summary: (userId: string, groupId: string) =>
    [...contributionKeys.summaries(groupId), userId] as const,
  leaderboards: (groupId: string) => [...contributionKeys.all, "leaderboard", groupId] as const,
  leaderboard: (groupId: string, period: "week" | "month" | "all-time") =>
    [...contributionKeys.leaderboards(groupId), period] as const,
  evaluationRounds: (groupId: string) =>
    [...contributionKeys.all, "evaluation-rounds", groupId] as const,
  myRoundRatings: (groupId: string, roundStartedAt: string) =>
    [...contributionKeys.evaluationRounds(groupId), "my-ratings", roundStartedAt] as const,
  roundResults: (groupId: string, roundStartedAt: string) =>
    [...contributionKeys.evaluationRounds(groupId), "results", roundStartedAt] as const,
};

/**
 * Aggregate all query keys
 */
export const queryKeys = {
  groups: groupKeys,
  tasks: taskKeys,
  flashcards: flashcardKeys,
  invitations: invitationKeys,
  notifications: notificationKeys,
  users: userKeys,
  contacts: contactKeys,
  contributions: contributionKeys,
};

/**
 * Cache Invalidation Patterns
 *
 * When mutations occur, invalidate related queries:
 *
 * // Create group -> invalidate all group lists
 * queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
 *
 * // Update task -> invalidate that task detail AND its group's tasks
 * queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
 * queryClient.invalidateQueries({ queryKey: groupKeys.tasks(groupId) })
 *
 * // Delete group -> invalidate all group data
 * queryClient.invalidateQueries({ queryKey: groupKeys.all })
 */
