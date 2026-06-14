import { getAboutContentHtml } from "@/lib/posts";

export default async function AboutPage() {
  const contentHtml = await getAboutContentHtml();

  return (
    <div className="fade-in pt-4 max-w-[42rem]">
      <h1 className="text-xl tracking-wide mb-10">About</h1>
      <div
        className="prose-journal text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
