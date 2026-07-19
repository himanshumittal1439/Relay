"use client";

import Link from "next/link";
import { PLATFORM_MAP } from "@/lib/platforms";
import { AuthUser } from "./AuthProvider";

export interface PostItem {
  id: number;
  content: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  claimedBy: number | null;
  author?: { id: number; email: string; name: string | null };
}

interface PostCardProps {
  post: PostItem;
  user: AuthUser;
  onDelete: (id: number) => void;
  onClaim: (id: number) => void;
  onPublish: (id: number) => void;
}

const statusStyles: Record<PostItem["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function PostCard({ post, user, onDelete, onClaim, onPublish }: PostCardProps) {
  const isAuthor = post.author?.id === user.id;
  const isAdmin = user.role === "admin";
  const isClaimed = post.claimedBy === user.id;
  const claimedByOther = post.claimedBy !== null && !isClaimed;

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {post.platforms.map((p) => (
            <span
              key={p}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {PLATFORM_MAP[p as keyof typeof PLATFORM_MAP]?.label || p}
            </span>
          ))}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[post.status]}`}
        >
          {post.status}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-slate-800">{post.content}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>By {post.author?.name || post.author?.email}</span>
        {post.scheduledAt && (
          <span>
            Scheduled: {new Date(post.scheduledAt).toLocaleString()}
          </span>
        )}
        {post.publishedAt && (
          <span>
            Published: {new Date(post.publishedAt).toLocaleString()}
          </span>
        )}
        {claimedByOther && <span className="text-amber-600">Claimed by admin</span>}
        {isClaimed && <span className="text-indigo-600">You claimed this</span>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(isAuthor || isAdmin || isClaimed) && (
          <Link
            href={`/posts/${post.id}/edit`}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Edit
          </Link>
        )}
        {(isAuthor || isAdmin || isClaimed) && (
          <button
            onClick={() => onDelete(post.id)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
          >
            Delete
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onClaim(post.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              isClaimed
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {isClaimed ? "Unclaim" : "Claim control"}
          </button>
        )}
        {isAdmin && post.status !== "published" && (
          <button
            onClick={() => onPublish(post.id)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Publish now
          </button>
        )}
      </div>
    </article>
  );
}
