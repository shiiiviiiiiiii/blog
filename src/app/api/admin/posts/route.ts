import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllPostsMeta, getPostBySlug } from "@/lib/posts";
import { saveFileToGitHub, deleteFileFromGitHub, isGitHubEnabled } from "@/lib/github";

const SESSION_COOKIE_NAME = "admin_session";
const contentDirectory = path.join(process.cwd(), "content");

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === "authenticated";
}

// GET lists all essays and campus stories, or fetches a single post's raw contents
export async function GET(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  if (category && slug) {
    if (category !== "essays" && category !== "campus-uncovered") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const filePath = path.join(contentDirectory, category, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return NextResponse.json({
      title: data.title || "",
      date: data.date || "",
      excerpt: data.excerpt || "",
      content,
    });
  }

  const essays = getAllPostsMeta("essays").map((p) => ({ ...p, category: "essays" }));
  const campus = getAllPostsMeta("campus-uncovered").map((p) => ({
    ...p,
    category: "campus-uncovered",
  }));

  return NextResponse.json({ essays, campus });
}

// POST creates or updates a post
export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category, slug, oldSlug, title, date, excerpt, content } = await request.json();

    if (!category || !slug || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (category !== "essays" && category !== "campus-uncovered") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Clean slug: lowercase, replace spaces with hyphens, remove special chars
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Format markdown contents
    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date || new Date().toISOString().split("T")[0]}"
excerpt: "${(excerpt || "").replace(/"/g, '\\"')}"
---

${content}
`;

    const gitHubEnabled = isGitHubEnabled();
    const relativePath = `content/${category}/${cleanSlug}.md`;

    if (gitHubEnabled) {
      // 1. If slug changed, delete the old file on GitHub
      if (oldSlug && oldSlug !== cleanSlug) {
        const oldRelativePath = `content/${category}/${oldSlug}.md`;
        await deleteFileFromGitHub(oldRelativePath, `Rename post file from ${oldSlug} to ${cleanSlug}`);
      }

      // 2. Save new content to GitHub
      await saveFileToGitHub(relativePath, fileContent, `Save post: ${title}`);
    } else {
      // Fallback: local filesystem writes (for local dev)
      const dir = path.join(contentDirectory, category);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const targetPath = path.join(dir, `${cleanSlug}.md`);

      if (oldSlug && oldSlug !== cleanSlug) {
        const oldPath = path.join(dir, `${oldSlug}.md`);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      fs.writeFileSync(targetPath, fileContent, "utf8");
    }

    return NextResponse.json({ success: true, slug: cleanSlug });
  } catch (e: any) {
    console.error("Error saving post:", e);
    return NextResponse.json(
      { error: e.message || "Failed to save post file" },
      { status: 500 }
    );
  }
}

// DELETE deletes a post file
export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category, slug } = await request.json();

    if (!category || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (category !== "essays" && category !== "campus-uncovered") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const gitHubEnabled = isGitHubEnabled();
    const relativePath = `content/${category}/${slug}.md`;

    if (gitHubEnabled) {
      await deleteFileFromGitHub(relativePath, `Delete post: ${slug}`);
      return NextResponse.json({ success: true });
    } else {
      // Fallback: local filesystem delete
      const targetPath = path.join(contentDirectory, category, `${slug}.md`);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (e: any) {
    console.error("Error deleting post:", e);
    return NextResponse.json(
      { error: e.message || "Failed to delete post file" },
      { status: 500 }
    );
  }
}
