// Usage limits removed — Hireable is now a concierge service (one-time orders, no subscription caps).
// This file is kept as a stub so any residual imports don't break during migration.

export type UsageCheck = { allowed: boolean; reason?: string }

export async function checkResumeLimit(_clerkId: string): Promise<UsageCheck> {
  return { allowed: true }
}

export async function checkCoverLetterLimit(_clerkId: string): Promise<UsageCheck> {
  return { allowed: true }
}
