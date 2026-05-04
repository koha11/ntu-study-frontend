/**
 * Contributions Domain - Type Definitions
 *
 * Defines the data structure for user contributions and contribution tracking.
 */

export interface Contribution {
  id: string;
  userId: string;
  groupId: string;
  type: "task-completed" | "flashcard-reviewed" | "comment" | "invite-accepted";
  points: number;
  description: string;
  createdAt: Date;
}

export interface ContributionSummary {
  userId: string;
  groupId: string;
  totalPoints: number;
  tasksCompleted: number;
  flashcardsReviewed: number;
  comments: number;
  contributions: Contribution[];
}

export interface GroupLeaderboard {
  groupId: string;
  period: "week" | "month" | "all-time";
  entries: Array<{
    userId: string;
    userName: string;
    points: number;
    rank: number;
  }>;
}

export interface CreateContributionInput {
  userId: string;
  groupId: string;
  type: "task-completed" | "flashcard-reviewed" | "comment" | "invite-accepted";
  points: number;
  description: string;
}

/** One peer-evaluation round (grouped by round_started_at on the backend). */
export interface EvaluationRound {
  roundStartedAt: string;
  dueDate: string;
  isClosed: boolean;
  ratedCount: number;
  totalCount: number;
}

export interface MyRatingEntry {
  rateeId: string;
  rateeFullName: string;
  score: number | null;
}

export interface AggregatedRatingResult {
  rateeId: string;
  rateeFullName: string;
  averageScore: number | null;
}
