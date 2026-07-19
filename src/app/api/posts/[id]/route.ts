import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  PLATFORM_OPTIONS,
  PlatformValue,
  validatePostForPlatforms,
} from "@/lib/platforms";
import { z } from "zod";

async function getAuthorizedPost(id: number, session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return null;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return null;
  if (
    session.role !== "admin" &&
    post.userId !== session.id &&
    post.claimedBy !== session.id
  ) {
    return null;
  }
  return post;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await getAuthorizedPost(Number(id), session);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  platforms: z
    .array(z.enum(PLATFORM_OPTIONS.map((p) => p.value) as [string, ...string[]]))
    .optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await getAuthorizedPost(Number(id), session);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updates: Partial<typeof post> = {
    updatedAt: new Date(),
  };

  if (parsed.data.content !== undefined) updates.content = parsed.data.content;
  if (parsed.data.platforms !== undefined)
    updates.platforms = parsed.data.platforms as PlatformValue[];

  const nextContent = updates.content ?? post.content;
  const nextPlatforms = (updates.platforms ?? post.platforms) as PlatformValue[];
  const validation = validatePostForPlatforms(nextContent, nextPlatforms);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  if (parsed.data.scheduledAt !== undefined) {
    updates.scheduledAt = parsed.data.scheduledAt
      ? new Date(parsed.data.scheduledAt)
      : null;
  }

  if (parsed.data.status !== undefined) {
    if (parsed.data.status === "published" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can publish posts" },
        { status: 403 }
      );
    }
    updates.status = parsed.data.status;
    if (parsed.data.status === "published") {
      updates.publishedAt = new Date();
    }
  } else if (updates.scheduledAt && updates.scheduledAt.getTime() > Date.now()) {
    updates.status = "scheduled";
  } else if (updates.scheduledAt && updates.scheduledAt.getTime() <= Date.now()) {
    updates.status = "published";
    updates.publishedAt = new Date();
  }

  const [updated] = await db
    .update(posts)
    .set(updates)
    .where(eq(posts.id, Number(id)))
    .returning();

  return NextResponse.json({ post: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await getAuthorizedPost(Number(id), session);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(posts).where(eq(posts.id, Number(id)));
  return NextResponse.json({ success: true });
}
