"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PostForm, PostFormData } from "@/components/PostForm";

export default function ComposePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  async function handleSave(data: PostFormData & { publishNow?: boolean }) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        platforms: data.platforms,
        scheduledAt: data.scheduledAt || null,
        publishNow: data.publishNow,
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to create post");
    }
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-center text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <PostForm user={user} mode="create" onSave={handleSave} />
    </div>
  );
}
