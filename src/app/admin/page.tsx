"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date";

interface PostItem {
  slug: string;
  title: string;
  date: string;
  readingTime: string;
  category: "essays" | "campus-uncovered";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Dashboard data states
  const [essays, setEssays] = useState<PostItem[]>([]);
  const [campus, setCampus] = useState<PostItem[]>([]);
  
  // Actions states
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ category: string; slug: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setAuthenticated(data.authenticated);
      setPasswordConfigured(data.passwordConfigured);
      if (data.authenticated) {
        fetchData();
      }
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setEssays(data.essays || []);
        setCampus(data.campus || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthenticated(true);
        fetchData();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setAuthenticated(false);
      setPassword("");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleSync = async () => {
    setSyncStatus("syncing");
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus("success");
        setSyncMessage(data.message || "Successfully synced to GitHub!");
      } else {
        setSyncStatus("error");
        setSyncMessage(data.error || "Git sync failed.");
      }
    } catch (err) {
      setSyncStatus("error");
      setSyncMessage("Network error during sync.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteConfirm),
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post.");
      }
    } catch (err) {
      alert("Error deleting post.");
    }
  };

  if (loading) {
    return (
      <div className="pt-24 text-center text-sm text-[var(--accent)] font-mono">
        Loading...
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div className="fade-in max-w-md mx-auto pt-24 font-mono">
        <h1 className="text-xl font-medium tracking-wide mb-8">Shivam Kumar | Admin Access</h1>
        
        {!passwordConfigured && (
          <div className="mb-6 p-4 border border-[var(--rule)] text-xs text-[var(--accent)] leading-relaxed">
            <span className="font-semibold block mb-1">Server Note:</span>
            No <code>ADMIN_PASSWORD</code> is configured in your <code>.env.local</code> file. 
            Since you are running in development, you can log in using the fallback password: <strong><code>admin</code></strong>.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
              Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--rule)] bg-transparent text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--foreground)] text-sm"
              placeholder="Enter admin password..."
              required
            />
          </div>
          {error && <p className="text-xs text-red-500 font-mono mt-2">{error}</p>}
          
          <button
            type="submit"
            className="px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors duration-200 text-sm font-medium"
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className="fade-in pt-4 max-w-2xl font-mono">
      <div className="flex flex-wrap items-baseline justify-between border-b border-[var(--rule)] pb-4 mb-10 gap-y-2">
        <h1 className="text-xl font-medium tracking-wide">Shivam Kumar | Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-[var(--accent)] hover:text-[var(--foreground)] underline decoration-1"
        >
          Logout
        </button>
      </div>

      {/* Sync Control */}
      <section className="mb-10 p-5 border border-[var(--rule)] bg-opacity-5">
        <h2 className="text-xs uppercase tracking-wide text-[var(--accent)] mb-3 font-semibold">
          GitHub Synchronizer
        </h2>
        <p className="text-xs text-[var(--accent)] leading-relaxed mb-4">
          Edits you save in the browser are written directly to your local computer's <code>content/</code> folder. 
          Use the button below to commit these changes to Git and push them to your GitHub repository automatically.
        </p>
        <div className="flex items-center gap-x-4">
          <button
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className="px-3 py-1.5 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:opacity-50 text-xs font-medium transition-colors duration-200"
          >
            {syncStatus === "syncing" ? "Syncing changes..." : "Sync to GitHub"}
          </button>
          {syncStatus === "success" && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ {syncMessage}</span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs text-red-600 dark:text-red-400">✗ {syncMessage}</span>
          )}
        </div>
      </section>

      {/* Special Pages */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wide text-[var(--accent)] border-b border-[var(--rule)] pb-2 mb-4">
          Static Pages & Logs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/edit?category=special&slug=about"
            className="block p-4 border border-[var(--rule)] hover:border-[var(--foreground)] transition-colors duration-200"
          >
            <span className="block text-sm font-medium">About Page</span>
            <span className="text-xs text-[var(--accent)]">Edit personal letter</span>
          </Link>
          <Link
            href="/admin/edit?category=special&slug=now"
            className="block p-4 border border-[var(--rule)] hover:border-[var(--foreground)] transition-colors duration-200"
          >
            <span className="block text-sm font-medium">Now Page</span>
            <span className="text-xs text-[var(--accent)]">Edit current focus</span>
          </Link>
          <Link
            href="/admin/edit?category=special&slug=notes"
            className="block p-4 border border-[var(--rule)] hover:border-[var(--foreground)] transition-colors duration-200"
          >
            <span className="block text-sm font-medium">Digital Notebook</span>
            <span className="text-xs text-[var(--accent)]">Add & manage notes</span>
          </Link>
        </div>
      </section>

      {/* Essays Section */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-2 mb-4">
          <h2 className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Essays ({essays.length})
          </h2>
          <Link
            href="/admin/edit?category=essays"
            className="text-xs text-[var(--foreground)] hover:text-[var(--accent)] underline decoration-1"
          >
            + Write Essay
          </Link>
        </div>
        
        {essays.length === 0 ? (
          <p className="text-xs text-[var(--accent)] italic">No essays found.</p>
        ) : (
          <ul className="space-y-3">
            {essays.map((essay) => (
              <li key={essay.slug} className="flex items-center justify-between py-2 border-b border-dashed border-[var(--rule)] text-sm">
                <div>
                  <span className="block font-medium">{essay.title}</span>
                  <span className="text-xs text-[var(--accent)]">
                    {formatDate(essay.date)} · slug: {essay.slug}
                  </span>
                </div>
                <div className="flex gap-x-3 text-xs">
                  <Link
                    href={`/admin/edit?category=essays&slug=${essay.slug}`}
                    className="text-[var(--foreground)] hover:text-[var(--accent)] underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm({ category: "essays", slug: essay.slug })}
                    className="text-red-600 dark:text-red-400 hover:opacity-75 underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Campus Stories Section */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-2 mb-4">
          <h2 className="text-xs uppercase tracking-wide text-[var(--accent)]">
            Campus Uncovered ({campus.length})
          </h2>
          <Link
            href="/admin/edit?category=campus-uncovered"
            className="text-xs text-[var(--foreground)] hover:text-[var(--accent)] underline decoration-1"
          >
            + Write Campus Story
          </Link>
        </div>
        
        {campus.length === 0 ? (
          <p className="text-xs text-[var(--accent)] italic">No campus stories found.</p>
        ) : (
          <ul className="space-y-3">
            {campus.map((story) => (
              <li key={story.slug} className="flex items-center justify-between py-2 border-b border-dashed border-[var(--rule)] text-sm">
                <div>
                  <span className="block font-medium">{story.title}</span>
                  <span className="text-xs text-[var(--accent)]">
                    {formatDate(story.date)} · slug: {story.slug}
                  </span>
                </div>
                <div className="flex gap-x-3 text-xs">
                  <Link
                    href={`/admin/edit?category=campus-uncovered&slug=${story.slug}`}
                    className="text-[var(--foreground)] hover:text-[var(--accent)] underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm({ category: "campus-uncovered", slug: story.slug })}
                    className="text-red-600 dark:text-red-400 hover:opacity-75 underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="bg-[var(--background)] border border-[var(--foreground)] max-w-sm w-full p-6 font-mono space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide">Confirm Delete</h3>
            <p className="text-xs text-[var(--accent)] leading-relaxed">
              Are you sure you want to permanently delete the post <strong>{deleteConfirm.slug}</strong> from the <strong>{deleteConfirm.category}</strong> category? This deletes the file from disk and cannot be undone.
            </p>
            <div className="flex justify-end gap-x-4 text-xs font-semibold pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 border border-[var(--rule)] hover:bg-[var(--rule)] text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
