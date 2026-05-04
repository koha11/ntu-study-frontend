export type Role = "user" | "leader" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  locked?: boolean;
  isAdmin?: boolean;
};

export type GroupStatus = "active" | "locked" | "evaluating";

export type Group = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: GroupStatus;
  leaderId: string;
  memberIds: string[];
  driveLinks: { id: string; name: string; url: string }[];
  createdAt: string;
};

export type TaskStatus = "todo" | "in_progress" | "pending_review" | "done" | "failed";

export type SubTask = {
  id: string;
  title: string;
  done: boolean;
  assigneeId: string;
  status: TaskStatus;
};

export type Task = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string;
  dueDate: string;
  subTasks: SubTask[];
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  nextReview: string; // ISO date
  ease: number;
};

export type FlashcardSet = {
  id: string;
  name: string;
  subject: string;
  cards: Flashcard[];
};

export type Notification = {
  id: string;
  type: "task" | "invite" | "rating" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export const mockUsers: User[] = [
  { id: "u1", name: "Alex Chen", email: "alex@stanford.edu", avatar: "AC", isAdmin: false },
  { id: "u2", name: "Maria Rivera", email: "maria@mit.edu", avatar: "MR" },
  { id: "u3", name: "Jordan Park", email: "jordan@berkeley.edu", avatar: "JP" },
  { id: "u4", name: "Sam Okafor", email: "sam@harvard.edu", avatar: "SO" },
  { id: "u5", name: "Riley Tanaka", email: "riley@cmu.edu", avatar: "RT" },
  { id: "u6", name: "Devon Singh", email: "devon@yale.edu", avatar: "DS", locked: true },
  { id: "admin1", name: "Dr. Patel", email: "patel@stanford.edu", avatar: "DP", isAdmin: true },
];

export const CURRENT_USER_ID = "u1";

export const mockGroups: Group[] = [
  {
    id: "g1",
    name: "Distributed Systems Capstone",
    description:
      "Building a fault-tolerant key-value store with Raft consensus. Final demo in week 14.",
    tags: ["CS244B", "Systems", "Capstone"],
    status: "active",
    leaderId: "u1",
    memberIds: ["u1", "u2", "u3", "u4"],
    driveLinks: [
      { id: "d1", name: "Design Doc v3", url: "#" },
      { id: "d2", name: "Benchmark Results", url: "#" },
    ],
    createdAt: "2025-01-15",
  },
  {
    id: "g2",
    name: "Organic Chemistry Study Pod",
    description: "Weekly problem sessions for CHEM 220. Focus on reaction mechanisms.",
    tags: ["CHEM220", "Pre-med"],
    status: "active",
    leaderId: "u2",
    memberIds: ["u1", "u2", "u5"],
    driveLinks: [{ id: "d3", name: "Mechanism Cheatsheet", url: "#" }],
    createdAt: "2025-02-01",
  },
  {
    id: "g3",
    name: "ML Reading Group — Transformers",
    description: "Bi-weekly paper discussions on attention architectures and scaling laws.",
    tags: ["ML", "Reading"],
    status: "evaluating",
    leaderId: "u1",
    memberIds: ["u1", "u3", "u4", "u5"],
    driveLinks: [],
    createdAt: "2024-11-10",
  },
  {
    id: "g4",
    name: "Quantum Computing Seminar",
    description: "Introduction to quantum gates and Shor's algorithm. Wrapped up successfully.",
    tags: ["PHYS280", "Quantum"],
    status: "locked",
    leaderId: "u3",
    memberIds: ["u1", "u3", "u4"],
    driveLinks: [{ id: "d4", name: "Final Report", url: "#" }],
    createdAt: "2024-09-05",
  },
];

export const mockTasks: Task[] = [
  {
    id: "t1",
    groupId: "g1",
    title: "Implement leader election",
    description: "Raft-style leader election with randomized timeouts.",
    status: "in_progress",
    assigneeId: "u1",
    dueDate: "2025-04-22",
    subTasks: [
      { id: "s1", title: "RequestVote RPC", done: true, assigneeId: "u1", status: "done" },
      { id: "s2", title: "Election timer", done: false, assigneeId: "u2", status: "in_progress" },
      { id: "s3", title: "Split vote handling", done: false, assigneeId: "u3", status: "todo" },
    ],
  },
  {
    id: "t2",
    groupId: "g1",
    title: "Write log replication tests",
    description: "Cover edge cases for log truncation.",
    status: "todo",
    assigneeId: "u2",
    dueDate: "2025-04-25",
    subTasks: [
      { id: "s7", title: "Happy-path replication test", done: false, assigneeId: "u2", status: "todo" },
      { id: "s8", title: "Truncation edge case", done: false, assigneeId: "u4", status: "pending_review" },
    ],
  },
  {
    id: "t3",
    groupId: "g1",
    title: "Snapshotting design doc",
    description: "Design memory-efficient snapshot mechanism.",
    status: "pending_review",
    assigneeId: "u3",
    dueDate: "2025-04-20",
    subTasks: [
      { id: "s4", title: "Draft v1", done: true, assigneeId: "u3", status: "done" },
      { id: "s9", title: "Peer review pass", done: false, assigneeId: "u1", status: "pending_review" },
    ],
  },
  {
    id: "t4",
    groupId: "g1",
    title: "Set up CI pipeline",
    description: "GitHub Actions with race detector.",
    status: "done",
    assigneeId: "u4",
    dueDate: "2025-04-10",
    subTasks: [],
  },
  {
    id: "t5",
    groupId: "g2",
    title: "Solve problem set 7",
    description: "Aldol condensation problems.",
    status: "todo",
    assigneeId: "u1",
    dueDate: "2025-04-21",
    subTasks: [
      { id: "s5", title: "Q1-3", done: false, assigneeId: "u1", status: "in_progress" },
      { id: "s6", title: "Q4-6", done: false, assigneeId: "u3", status: "failed" },
    ],
  },
  {
    id: "t6",
    groupId: "g3",
    title: "Summarize Attention paper",
    description: "5-min lightning talk for next session.",
    status: "failed",
    assigneeId: "u1",
    dueDate: "2025-04-05",
    subTasks: [],
  },
];

export const mockFlashcardSets: FlashcardSet[] = [
  {
    id: "fs1",
    name: "Raft Consensus",
    subject: "Distributed Systems",
    cards: [
      {
        id: "c1",
        front: "What are the three states a Raft node can be in?",
        back: "Follower, Candidate, Leader.",
        nextReview: "2025-04-18",
        ease: 2.5,
      },
      {
        id: "c2",
        front: "What triggers a new election?",
        back: "An election timeout while in Follower state with no leader heartbeat.",
        nextReview: "2025-04-19",
        ease: 2.3,
      },
      {
        id: "c3",
        front: "Why is log matching important?",
        back: "It guarantees that if two logs contain an entry with the same index and term, they are identical up to that point.",
        nextReview: "2025-04-20",
        ease: 2.8,
      },
    ],
  },
  {
    id: "fs2",
    name: "Reaction Mechanisms",
    subject: "Organic Chemistry",
    cards: [
      {
        id: "c4",
        front: "What is an SN2 reaction?",
        back: "Bimolecular nucleophilic substitution — concerted backside attack with inversion.",
        nextReview: "2025-04-18",
        ease: 2.1,
      },
      {
        id: "c5",
        front: "What is Markovnikov's rule?",
        back: "In addition of HX to alkene, H goes to the carbon with more H's already.",
        nextReview: "2025-04-22",
        ease: 2.6,
      },
    ],
  },
  {
    id: "fs3",
    name: "Attention Mechanisms",
    subject: "Machine Learning",
    cards: [
      {
        id: "c6",
        front: "What is the formula for scaled dot-product attention?",
        back: "softmax(QK^T / √d_k) V",
        nextReview: "2025-04-19",
        ease: 2.4,
      },
    ],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "task",
    title: "Task review requested",
    body: "Jordan submitted 'Snapshotting design doc' for review.",
    time: "12 min ago",
    read: false,
  },
  {
    id: "n2",
    type: "rating",
    title: "Contribution evaluation open",
    body: "Maria opened evaluation for Organic Chemistry Study Pod.",
    time: "2 h ago",
    read: false,
  },
  {
    id: "n3",
    type: "invite",
    title: "New group invitation",
    body: "You were invited to 'Algorithms Reading Group'.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n4",
    type: "system",
    title: "Drive quota at 78%",
    body: "Consider archiving old assets.",
    time: "2 days ago",
    read: true,
  },
];

export function getUser(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}
