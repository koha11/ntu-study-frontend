/**
 * Shared Type Definitions
 *
 * This file re-exports all shared types that domains and routes can use.
 * Organized by concerns:
 * - API Contracts (DTOs from backend)
 * - Domain Models (derived from contracts)
 * - Errors
 * - Common Types
 *
 * Usage:
 * import type { Group, Task, User } from '@/shared/types';
 */

// These will be filled in as types are extracted
// For now, re-export placeholder stubs

export type { User, Role, Group, Task, FlashcardSet } from "@/lib/mockData";

/**
 * Phase 4 Plan:
 *
 * Once all types are extracted to shared/types/ modules:
 *
 * // shared/types/api-contracts.ts
 * export interface Group { ... }
 * export interface Task { ... }
 *
 * // shared/types/errors.ts
 * export class AppError { ... }
 *
 * // shared/types/common.ts
 * export type User { ... }
 * export type Role = 'user' | 'admin';
 *
 * Then this index.ts will aggregate:
 * export * from './api-contracts';
 * export * from './errors';
 * export * from './common';
 */
