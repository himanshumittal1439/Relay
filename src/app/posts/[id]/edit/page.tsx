"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PostForm, PostFormData } from "@/components/PostForm";
import { PostItem } from "@/components/PostCard";

function toLocalInput(dateString?: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [post, setPost] = useState<PostItem | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user && params.id) {
      loadPost();
    }
  }, [user, loading, params.id, router]);

  async function loadPost() {
    setFetching(true);
    try {
      const res = await fetch(`/api/posts/${params.id}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load post");
      const data = await res.json();
      setPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave(data: PostFormData & { publishNow?: boolean }) {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        platforms: data.platforms,
        scheduledAt: data.scheduledAt || null,
        status: data.publishNow ? "published" : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to update post");
    }
  }

  if (loading || !user || fetching) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-center text-slate-600">Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Post not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PostForm
        user={user}
        mode="edit"
        initial={{
          content: post.content,
          platforms: post.platforms as PostFormData["platforms"],
          scheduledAt: toLocalInput(post.scheduledAt),
          status: post.status,
        }}
        onSave={handleSave}
        onCancel={() => router.push("/posts")}
      />
    </div>
  );
}
