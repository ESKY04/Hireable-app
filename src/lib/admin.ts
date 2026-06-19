import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
}

export function isAdminUser(userId: string): boolean {
  return getAdminIds().includes(userId)
}

export async function requireAdmin(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const { userId } = await auth()
  if (!userId) {
    return { userId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (!isAdminUser(userId)) {
    return { userId: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { userId, error: null }
}
