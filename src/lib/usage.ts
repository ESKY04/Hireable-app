import { prisma } from "./prisma"
import { PLAN_LIMITS } from "./stripe"
import type { Plan } from "@prisma/client"

export type UsageCheck = { allowed: boolean; reason?: string; limit?: number; current?: number }

export async function checkResumeLimit(clerkId: string): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { _count: { select: { resumes: true } } },
  })
  if (!user) return { allowed: false, reason: "User not found" }

  const plan = user.plan as Plan
  const limit = PLAN_LIMITS[plan].resumes
  const current = user._count.resumes

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Free plan limit reached (${limit} resumes). Upgrade to Pro for unlimited.`,
      limit,
      current,
    }
  }
  return { allowed: true, limit, current }
}

export async function checkCoverLetterLimit(clerkId: string): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { _count: { select: { coverLetters: true } } },
  })
  if (!user) return { allowed: false, reason: "User not found" }

  const plan = user.plan as Plan
  const limit = PLAN_LIMITS[plan].coverLetters
  const current = user._count.coverLetters

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Free plan limit reached (${limit} cover letters). Upgrade to Pro for unlimited.`,
      limit,
      current,
    }
  }
  return { allowed: true, limit, current }
}
