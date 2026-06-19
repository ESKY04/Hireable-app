import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
})

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

export const PLAN_LIMITS = {
  FREE: { resumes: 3, coverLetters: 10 },
  PRO: { resumes: Infinity, coverLetters: Infinity },
  ENTERPRISE: { resumes: Infinity, coverLetters: Infinity },
} as const
