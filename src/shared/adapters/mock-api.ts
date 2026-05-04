/**
 * Mock API Adapter
 *
 * Provides mock data in a way that mirrors the real backend API structure.
 * This adapter pattern makes it easy to swap to real HTTP calls in Phase 4+.
 *
 * Design Pattern:
 * Instead of exporting raw mock data, adapters export async functions
 * that simulate API behavior (simulates network latency too).
 *
 * Phase 3: All functions return mock data
 * Phase 4: Can replace with real HTTP calls or keep mocks for dev mode
 */

import {
  mockGroups,
  mockTasks,
  mockFlashcardSets,
  mockUsers,
  CURRENT_USER_ID,
  type Group,
  type Task,
  type FlashcardSet,
} from "@/lib/mockData";

/**
 * Groups API Adapter
 */
export const groupsApiAdapter = {
  /**
   * Get all groups
   * Later: GET /api/groups
   */
  async getAll(): Promise<Group[]> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockGroups;
  },

  /**
   * Get single group by ID
   * Later: GET /api/groups/:id
   */
  async getById(id: string): Promise<Group | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockGroups.find((g) => g.id === id) || null;
  },

  /**
   * Create new group
   * Later: POST /api/groups
   */
  async create(
    data: Omit<Group, "id" | "createdAt" | "memberIds" | "driveLinks" | "status" | "leaderId">,
  ): Promise<Group> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      id: `g${Date.now()}`,
      name: data.name,
      description: data.description,
      tags: data.tags,
      status: "active",
      leaderId: CURRENT_USER_ID,
      memberIds: [CURRENT_USER_ID],
      driveLinks: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
  },

  /**
   * Update group
   * Later: PATCH /api/groups/:id
   */
  async update(id: string, data: Partial<Group>): Promise<Group> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const group = mockGroups.find((g) => g.id === id);
    if (!group) throw new Error(`Group ${id} not found`);
    return { ...group, ...data };
  },

  /**
   * Delete group
   * Later: DELETE /api/groups/:id
   */
  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const index = mockGroups.findIndex((g) => g.id === id);
    if (index < 0) throw new Error(`Group ${id} not found`);
    mockGroups.splice(index, 1);
  },
};

/**
 * Tasks API Adapter
 */
export const tasksApiAdapter = {
  async getAll(): Promise<Task[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockTasks;
  },

  async getById(id: string): Promise<Task | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockTasks.find((t) => t.id === id) || null;
  },

  async create(data: Omit<Task, "id" | "subTasks">): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      id: `t${Date.now()}`,
      ...data,
      subTasks: [],
    };
  },

  async updateStatus(id: string, status: Task["status"]): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const task = mockTasks.find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    task.status = status;
    return task;
  },

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const index = mockTasks.findIndex((t) => t.id === id);
    if (index < 0) throw new Error(`Task ${id} not found`);
    mockTasks.splice(index, 1);
  },
};

/**
 * Flashcards API Adapter
 */
export const flashcardsApiAdapter = {
  async getAll(): Promise<FlashcardSet[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockFlashcardSets;
  },

  async getById(id: string): Promise<FlashcardSet | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockFlashcardSets.find((s) => s.id === id) || null;
  },

  async create(data: Omit<FlashcardSet, "id" | "cards">): Promise<FlashcardSet> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      id: `fs${Date.now()}`,
      ...data,
      cards: [],
    };
  },

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const index = mockFlashcardSets.findIndex((s) => s.id === id);
    if (index < 0) throw new Error(`FlashcardSet ${id} not found`);
    mockFlashcardSets.splice(index, 1);
  },
};

/**
 * Users API Adapter (for future auth flow)
 */
export const usersApiAdapter = {
  async getAll(): Promise<typeof mockUsers> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockUsers;
  },

  async getCurrentUser() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return mockUsers.find((u) => u.id === CURRENT_USER_ID) || mockUsers[0];
  },
};

/**
 * Adapter Registry
 *
 * Single place to switch between mock and real implementations.
 * Phase 4: Replace with real API client
 */
export const apiAdapters = {
  groups: groupsApiAdapter,
  tasks: tasksApiAdapter,
  flashcards: flashcardsApiAdapter,
  users: usersApiAdapter,
};

/**
 * Type-Safe API Response
 *
 * In Phase 4, responses will include metadata:
 * { data, status, timestamp, requestId }
 *
 * For now, just return the data directly.
 */
export type ApiResponse<T> = T;
