import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, or, and, desc, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  PLATFORM_OPTIONS,
  PlatformValue,
  validatePostForPlatforms,
} from "@/lib/platforms";
import { z } from "zod";

async function publishDuePosts() {
  await db
    .update(posts)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(posts.status, "scheduled"),
        lte(posts.scheduledAt, sql`now()`)
      )
    );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await publishDuePosts();

  const whereClause =
    session.role === "admin"
      ? undefined
      : or(eq(posts.userId, session.id), eq(posts.claimedBy, session.id));

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      platforms: posts.platforms,
      status: posts.status,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      claimedBy: posts.claimedBy,
      author: { id: users.id, email: users.email, name: users.name },
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(whereClause ?? sql`true`)
    .orderBy(desc(posts.createdAt));

  return NextResponse.json({ posts: rows });
}

const createSchema = z.object({
  content: z.string().min(1),
  platforms: z.array(z.enum(PLATFORM_OPTIONS.map((p) => p.value) as [string, ...string[]])),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishNow: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content, platforms, scheduledAt, publishNow } = parsed.data;
  const validation = validatePostForPlatforms(content, platforms as PlatformValue[]);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  let status: "draft" | "scheduled" | "published" = "draft";
  let scheduledDate: Date | null = null;

  if (publishNow && session.role === "admin") {
    status = "published";
  } else if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);
    if (scheduledDate.getTime() > Date.now()) {
      status = "scheduled";
    } else {
      status = "published";
    }
  }

  const [post] = await db
    .insert(posts)
    .values({
      userId: session.id,
      content,
      platforms,
      status,
      scheduledAt: scheduledDate,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  return NextResponse.json({ post }, { status: 201 });
}
