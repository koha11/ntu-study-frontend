import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FlashcardsPage } from "@/domains/flashcards";
import { requireSession } from "@/domains/auth";

const flashcardsSearchSchema = z.object({
  studySet: z.string().optional(),
});

export const Route = createFileRoute("/flashcards/")({
  beforeLoad: requireSession,
  validateSearch: (search) => flashcardsSearchSchema.parse(search ?? {}),
  component: FlashcardsRoutePage,
});

function FlashcardsRoutePage() {
  const { studySet } = Route.useSearch();
  const navigate = Route.useNavigate();

  const clearStudyParam = React.useCallback(() => {
    navigate({
      search: (prev) => ({ ...prev, studySet: undefined }),
      replace: true,
    });
  }, [navigate]);

  return (
    <FlashcardsPage studySetParam={studySet} clearStudyParam={clearStudyParam} />
  );
}
