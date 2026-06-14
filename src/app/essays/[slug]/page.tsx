import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostBySlug } from "@/lib/posts";
import { formatDate } from "@/lib/date";
import Comments from "@/components/Comments";

const CATEGORY = "essays";

export async function generateStaticParams() {
  const posts = getAllPostsMeta(CATEGORY);
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(CATEGORY, slug);
  } catch {
    notFound();
  }

  return (
    <article className="fade-in pt-4 max-w-[42rem]">
      <h1 className="text-2xl tracking-wide leading-snug mb-3">
        {post.title}
      </h1>
      <p className="text-sm text-[var(--accent)] mb-10">
        {formatDate(post.date)} · {post.readingTime}
      </p>

      <div
        className="prose-journal text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <p className="mt-16 text-[var(--accent)] italic text-sm">
        Thank you for reading.
      </p>

      <Link
        href="/essays"
        className="underline-link inline-block mt-4 text-sm"
      >
        ← Back to all writings
      </Link>

      <Comments />
    </article>
  );
}
