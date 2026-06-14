import Hero from "@/components/Hero";
import WritingsList from "@/components/WritingsList";
import { getAllRecentPosts } from "@/lib/posts";

export default function Home() {
  const recent = getAllRecentPosts(6);

  return (
    <div className="fade-in">
      <Hero />

      <section>
        <h2 className="text-sm tracking-wide text-[var(--accent)] uppercase mb-2">
          Recent writings
        </h2>
        <WritingsList items={recent} />
      </section>
    </div>
  );
}
