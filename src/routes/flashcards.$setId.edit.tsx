import { createFileRoute } from "@tanstack/react-router";
import { CreateFlashcardSetPage } from "@/domains/flashcards/components/CreateFlashcardSetPage";
import { requireSession } from "@/domains/auth";

export const Route = createFileRoute("/flashcards/$setId/edit")({
  beforeLoad: requireSession,
  component: EditFlashcardSetRoutePage,
});

function EditFlashcardSetRoutePage() {
  const { setId } = Route.useParams();
  return <CreateFlashcardSetPage editSetId={setId} />;
}
