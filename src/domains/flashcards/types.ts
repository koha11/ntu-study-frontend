/**
 * Flashcards Domain - Type Definitions
 */

export interface Flashcard {
  id: string;
  setId: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  ownerId: string;
  /** Denormalized count from API; use when list omits cards. */
  cardCount: number;
  cards: Flashcard[];
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardSetInput {
  name: string;
  subject?: string;
  description?: string;
}

export interface CreateFlashcardInput {
  front: string;
  back: string;
}

export interface UpdateFlashcardSetInput {
  name?: string;
  subject?: string | null;
  description?: string | null;
}

export interface UpdateFlashcardInput {
  front?: string;
  back?: string;
}
