import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { message: "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to seed an admin" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ message: "Admin already exists" });
  }

  await db.insert(users).values({
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    name: "Admin",
    role: "admin",
  });

  return NextResponse.json({ message: "Admin user created" });
}
