"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PostCard, PostItem } from "@/components/PostCard";

type StatusFilter = "all" | PostItem["status"];

export default function PostsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      loadPosts();
    }
  }, [user, loading, router]);

  async function loadPosts() {
    setFetching(true);
    try {
      const res = await fetch("/api/posts", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete post");
    }
  }

  async function handleClaim(id: number) {
    const res = await fetch(`/api/posts/${id}/claim`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, claimedBy: data.post.claimedBy } : p))
      );
    }
  }

  async function handlePublish(id: number) {
    const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: data.post.status, publishedAt: data.post.publishedAt }
            : p
        )
      );
    }
  }

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-center text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post stream</h1>
          <p className="text-sm text-slate-600">
            All posts you have created or claimed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={loadPosts}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {fetching ? (
        <p className="text-center text-slate-600">Loading posts...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-600">No posts found.</p>
          <a
            href="/compose"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Compose your first post
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              onDelete={handleDelete}
              onClaim={handleClaim}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}
