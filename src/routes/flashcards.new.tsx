import { createFileRoute } from "@tanstack/react-router";
import { CreateFlashcardSetPage } from "@/domains/flashcards/components/CreateFlashcardSetPage";
import { requireSession } from "@/domains/auth";

export const Route = createFileRoute("/flashcards/new")({
  beforeLoad: requireSession,
  component: CreateFlashcardSetPage,
});
