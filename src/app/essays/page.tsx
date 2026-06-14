import WritingsList from "@/components/WritingsList";
import { getAllPostsMeta } from "@/lib/posts";

export default function EssaysPage() {
  const essays = getAllPostsMeta("essays").map((p) => ({
    ...p,
    category: "essays",
  }));

  return (
    <div className="fade-in pt-4">
      <h1 className="text-xl tracking-wide mb-2">Essays</h1>
      <p className="text-[var(--accent)] mb-8">
        Longer pieces — on ambition, theatre, college, technology, and the
        things I keep coming back to.
      </p>
      <WritingsList items={essays} />
    </div>
  );
}
