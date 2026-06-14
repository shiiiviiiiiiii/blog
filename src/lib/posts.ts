import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import readingTime from "reading-time";

const contentDirectory = path.join(process.cwd(), "content");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  readingTime: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

function getSlugs(category: string): string[] {
  const dir = path.join(contentDirectory, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getAllPostsMeta(category: string): PostMeta[] {
  const slugs = getSlugs(category);
  const posts = slugs.map((slug) => {
    const fullPath = path.join(contentDirectory, category, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const stats = readingTime(content);

    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      excerpt: data.excerpt || "",
      readingTime: stats.text,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(
  category: string,
  slug: string
): Promise<Post> {
  const fullPath = path.join(contentDirectory, category, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  const processedContent = await remark().use(remarkHtml).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    excerpt: data.excerpt || "",
    readingTime: stats.text,
    contentHtml,
  };
}

export function getAllRecentPosts(limit: number = 5): (PostMeta & { category: string })[] {
  const essays = getAllPostsMeta("essays").map((p) => ({ ...p, category: "essays" }));
  const campus = getAllPostsMeta("campus-uncovered").map((p) => ({
    ...p,
    category: "campus-uncovered",
  }));

  const all = [...essays, ...campus];
  return all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}

export function getNotebookContent(): string {
  const fullPath = path.join(contentDirectory, "notes", "notebook.md");
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { content } = matter(fileContents);
  return content;
}

export async function getAboutContentHtml(): Promise<string> {
  const fullPath = path.join(contentDirectory, "about.md");
  if (!fs.existsSync(fullPath)) return "";
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { content } = matter(fileContents);
  const processedContent = await remark().use(remarkHtml).process(content);
  return processedContent.toString();
}

export async function getNowContentHtml(): Promise<{ contentHtml: string; date: string }> {
  const fullPath = path.join(contentDirectory, "now.md");
  if (!fs.existsSync(fullPath)) return { contentHtml: "", date: "" };
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const processedContent = await remark().use(remarkHtml).process(content);
  return {
    contentHtml: processedContent.toString(),
    date: data.date || "",
  };
}
