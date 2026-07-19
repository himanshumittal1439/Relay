"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PLATFORM_OPTIONS,
  PlatformValue,
  validatePostForPlatforms,
} from "@/lib/platforms";
import { AuthUser } from "./AuthProvider";

export interface PostFormData {
  id?: number;
  content: string;
  platforms: PlatformValue[];
  scheduledAt: string;
  status: "draft" | "scheduled" | "published" | "failed";
}

interface PostFormProps {
  user: AuthUser;
  initial?: Partial<PostFormData>;
  onSave: (data: PostFormData & { publishNow?: boolean }) => Promise<void>;
  onCancel?: () => void;
  mode: "create" | "edit";
}

export function PostForm({ user, initial, onSave, onCancel, mode }: PostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initial?.content ?? "");
  const [platforms, setPlatforms] = useState<PlatformValue[]>(
    initial?.platforms ?? []
  );
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const validation = useMemo(
    () => validatePostForPlatforms(content, platforms),
    [content, platforms]
  );

  useEffect(() => {
    setErrors([]);
  }, [content, platforms]);

  function togglePlatform(platform: PlatformValue) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  function toLocalDateTimeInput(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
  }

  function setScheduleToNowPlus(minutes: number) {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    setScheduledAt(toLocalDateTimeInput(d));
  }

  async function handleSubmit(publishNow = false) {
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    try {
      await onSave({
        content,
        platforms,
        scheduledAt,
        status: initial?.status ?? "draft",
        publishNow,
      });
      router.push("/posts");
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : "Failed to save post",
      ]);
    } finally {
      setLoading(false);
    }
  }

  const selectedLabels = platforms
    .map((p) => PLATFORM_OPTIONS.find((opt) => opt.value === p)?.label)
    .filter(Boolean);

  const maxForSelection =
    platforms.length > 0
      ? Math.min(
          ...platforms.map(
            (p) => PLATFORM_OPTIONS.find((opt) => opt.value === p)?.maxLength ?? Infinity
          )
        )
      : null;

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">
        {mode === "create" ? "Compose post" : "Edit post"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Pick your platforms, write your copy, and choose when it goes live.
      </p>

      <div className="mt-6 space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700">
            Platforms
          </label>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <span className={selectedLabels.length ? "text-slate-900" : "text-slate-400"}>
              {selectedLabels.length
                ? selectedLabels.join(", ")
                : "Select one or more platforms"}
            </span>
            <span className="text-slate-500">▾</span>
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {PLATFORM_OPTIONS.map((platform) => (
                <label
                  key={platform.value}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform.value)}
                    onChange={() => togglePlatform(platform.value)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex-1 text-slate-700">{platform.label}</span>
                  <span className="text-xs text-slate-400">
                    {platform.maxLength} chars
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Post content
            </label>
            <span
              className={`text-xs font-medium ${
                maxForSelection !== null && content.length > maxForSelection
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {content.length}
              {maxForSelection !== null ? ` / ${maxForSelection}` : ""} chars
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="What's on your mind?"
          />
          {platforms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {platforms.map((p) => {
                const opt = PLATFORM_OPTIONS.find((x) => x.value === p)!;
                const over = content.length > opt.maxLength;
                return (
                  <span
                    key={p}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      over
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.label}: {content.length}/{opt.maxLength}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Schedule
          </label>
          <div className="mt-1 flex gap-3">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setScheduleToNowPlus(30)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              +30 min
            </button>
            <button
              type="button"
              onClick={() => setScheduleToNowPlus(60 * 24)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              +24 hrs
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Leave blank to save as a draft.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 px-4 py-3">
            <ul className="list-inside list-disc text-sm text-red-700">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : scheduledAt
              ? "Schedule post"
              : mode === "create"
              ? "Save draft"
              : "Save changes"}
          </button>
          {user.role === "admin" && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Publish now
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
