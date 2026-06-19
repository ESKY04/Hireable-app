import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
})

export const PACKAGES = {
  COVER_LETTER: {
    priceCents: 500,
    label: "Cover Letter",
    priceId: process.env.STRIPE_PRICE_COVER_LETTER,
  },
  RESUME: {
    priceCents: 800,
    label: "Resume Rewrite",
    priceId: process.env.STRIPE_PRICE_RESUME,
  },
  FULL_SUITE: {
    priceCents: 1000,
    label: "Full Suite",
    priceId: process.env.STRIPE_PRICE_FULL_SUITE,
  },
} as const

export type PackageKey = keyof typeof PACKAGES
