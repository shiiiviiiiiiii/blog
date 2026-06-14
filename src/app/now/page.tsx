import { getNowContentHtml } from "@/lib/posts";

export default async function NowPage() {
  const { contentHtml, date } = await getNowContentHtml();

  return (
    <div className="fade-in pt-4 max-w-[42rem]">
      <h1 className="text-xl tracking-wide mb-2">Now</h1>
      <p className="text-[var(--accent)] mb-10 text-sm">
        Last updated {date || "recently"}. A snapshot of where my attention is, not a
        complete picture of anything.
      </p>
      <div
        className="prose-journal text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
