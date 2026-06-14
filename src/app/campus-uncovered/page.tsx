import WritingsList from "@/components/WritingsList";
import { getAllPostsMeta } from "@/lib/posts";

export default function CampusUncoveredPage() {
  const posts = getAllPostsMeta("campus-uncovered").map((p) => ({
    ...p,
    category: "campus-uncovered",
  }));

  return (
    <div className="fade-in pt-4">
      <h1 className="text-xl tracking-wide mb-2">Campus Uncovered</h1>
      <p className="text-[var(--accent)] mb-8">
        Field notes and stories from student life — the parts that don&apos;t
        make it into the brochure.
      </p>
      <WritingsList items={posts} />
    </div>
  );
}
