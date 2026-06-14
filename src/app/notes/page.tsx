import NotesList, { parseNotebook } from "@/components/NotesList";
import { getNotebookContent } from "@/lib/posts";

export default function NotesPage() {
  const content = getNotebookContent();
  const entries = parseNotebook(content);

  return (
    <div className="fade-in pt-4 max-w-[42rem]">
      <h1 className="text-xl tracking-wide mb-2">Notes</h1>
      <p className="text-[var(--accent)] mb-8">
        Short observations. Ideas. Questions. Things I didn&apos;t want to
        forget.
      </p>
      <NotesList entries={entries} />
    </div>
  );
}
