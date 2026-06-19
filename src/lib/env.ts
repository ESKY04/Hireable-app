/**
 * Runtime environment variable validation.
 * Import this in server-side code to get early errors on missing config.
 */

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

export const env = {
  // Clerk
  clerkPublishableKey: requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: requireEnv("CLERK_SECRET_KEY"),
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET ?? "",

  // Database
  databaseUrl: requireEnv("DATABASE_URL"),

  // Stripe
  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceCoverLetter: process.env.STRIPE_PRICE_COVER_LETTER ?? "",
  stripePriceResume: process.env.STRIPE_PRICE_RESUME ?? "",
  stripePriceFullSuite: process.env.STRIPE_PRICE_FULL_SUITE ?? "",

  // Anthropic
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),

  // Resend
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  // Admin
  adminUserIds: (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean),

  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const
