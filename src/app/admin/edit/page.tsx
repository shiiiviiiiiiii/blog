"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");

  // Post fields (for essays & campus-uncovered)
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [date, setDate] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Raw file content (for special pages: about, now, notes)
  const [rawContent, setRawContent] = useState("");

  const isSpecial = category === "special";
  const isEdit = !!slug;

  useEffect(() => {
    checkAuthAndLoad();
  }, [category, slug]);

  const checkAuthAndLoad = async () => {
    try {
      const authRes = await fetch("/api/admin/auth");
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push("/admin");
        return;
      }
      setAuthenticated(true);
      
      if (category) {
        await loadData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (isSpecial) {
        // Fetch raw special file (about.md, now.md, or notebook.md)
        const res = await fetch(`/api/admin/special?page=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setRawContent(data.content || "");
        }
      } else if (isEdit) {
        // Fetch existing post content
        const res = await fetch(`/api/admin/posts?category=${category}&slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || "");
          setCustomSlug(slug || "");
          setDate(data.date || "");
          setExcerpt(data.excerpt || "");
          setContent(data.content || "");
        }
      } else {
        // New post defaults
        setTitle("");
        setCustomSlug("");
        setDate(new Date().toISOString().split("T")[0]);
        setExcerpt("");
        setContent("");
      }
    } catch (err) {
      console.error("Failed to load post data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isSpecial) {
        const res = await fetch("/api/admin/special", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: slug, content: rawContent }),
        });
        if (res.ok) {
          router.push("/admin");
        } else {
          const err = await res.json();
          alert(err.error || "Failed to save file");
        }
      } else {
        const payload = {
          category,
          slug: customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          oldSlug: isEdit ? slug : undefined,
          title,
          date,
          excerpt,
          content,
        };

        const res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          router.push("/admin");
        } else {
          const err = await res.json();
          alert(err.error || "Failed to save post");
        }
      }
    } catch (err) {
      alert("Network error. Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Simple client-side Markdown rendering for Preview mode
  const renderPreview = (text: string) => {
    if (!text) return "<p className='italic text-accent'>Nothing written yet.</p>";

    // Escape HTML
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Horizontal Rule
    html = html.replace(/^---$/gim, "<hr />");
    html = html.replace(/^\*\*\*$/gim, "<hr />");

    // Blockquotes
    html = html.replace(/^\>\s?(.*$)/gim, "<blockquote>$1</blockquote>");

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Lists
    html = html.replace(/^\s*\-\s(.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\s*\*\s(.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, ""); // Collapse adjacent lists

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Paragraph splits
    html = html
      .split(/\n\n+/)
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        if (
          trimmed.startsWith("<h") ||
          trimmed.startsWith("<hr") ||
          trimmed.startsWith("<ul") ||
          trimmed.startsWith("<ol") ||
          trimmed.startsWith("<blockquote")
        ) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .join("\n");

    return html;
  };

  if (loading || !authenticated) {
    return (
      <div className="pt-24 text-center text-sm text-[var(--accent)] font-mono">
        Loading editor...
      </div>
    );
  }

  const categoryLabel =
    category === "essays"
      ? "Essay"
      : category === "campus-uncovered"
      ? "Campus Story"
      : `Special File (${slug}.md)`;

  return (
    <div className="fade-in pt-4 max-w-2xl font-mono">
      <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="text-xs text-[var(--accent)] hover:text-[var(--foreground)] underline decoration-1 mr-4"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-xs text-[var(--accent)]">
            Category: {categoryLabel}
          </span>
        </div>
        
        <div className="flex gap-x-2">
          <button
            onClick={() => setMode("write")}
            className={`px-3 py-1 text-xs border ${
              mode === "write"
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "border-[var(--rule)] text-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            Write
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`px-3 py-1 text-xs border ${
              mode === "preview"
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "border-[var(--rule)] text-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {mode === "write" ? (
          // --- WRITE MODE ---
          isSpecial ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                  File Contents ({slug}.md)
                </label>
                <p className="text-[10px] text-[var(--accent)] mb-2 leading-relaxed">
                  Note: This file contains YAML frontmatter (between the <code>---</code> lines) at the top. Be careful not to remove the formatting variables.
                </p>
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)] leading-relaxed resize-y"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)]"
                    placeholder="Enter post title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                  Filename Slug
                </label>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)]"
                  placeholder="e.g. my-first-essay (leave blank to auto-generate)"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                  Excerpt
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)]"
                  placeholder="A one-sentence summary for post archives..."
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
                  Body Content (Markdown)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--foreground)] leading-relaxed resize-y"
                  placeholder="Start writing..."
                  required
                />
              </div>
            </div>
          )
        ) : (
          // --- PREVIEW MODE ---
          <div className="border border-[var(--rule)] p-6 bg-opacity-5 min-h-[300px]">
            {isSpecial ? (
              // For special pages, we strip frontmatter for preview rendering
              <div
                className="prose-journal text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderPreview(rawContent.replace(/^---[\s\S]*?---/, "")),
                }}
              />
            ) : (
              <article className="max-w-[42rem]">
                <h1 className="text-2xl tracking-wide leading-snug mb-3">{title || "Untitled Post"}</h1>
                <p className="text-sm text-[var(--accent)] mb-10">
                  {date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""} · 3 min read
                </p>
                <div
                  className="prose-journal text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                />
              </article>
            )}
          </div>
        )}

        <div className="flex items-center gap-x-4 pt-4 border-t border-[var(--rule)]">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:opacity-50 text-sm font-medium transition-colors duration-200"
          >
            {saving ? "Saving changes..." : "Save File"}
          </button>
          <Link
            href="/admin"
            className="text-xs text-[var(--accent)] hover:text-[var(--foreground)] underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center font-mono text-xs text-[var(--accent)]">Loading editor parameters...</div>}>
      <EditorContent />
    </Suspense>
  );
}
