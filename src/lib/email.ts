// Email sending via Resend. RESEND_API_KEY must be set in production.
// Install: npm install resend

type OrderEmailData = {
  jobTitle: string
  company: string
  packageType: string
  orderId: string
}

const PACKAGE_LABELS: Record<string, string> = {
  COVER_LETTER: "Cover Letter",
  RESUME: "Resume Rewrite",
  FULL_SUITE: "Full Suite (Resume + Cover Letter + Salary Report)",
}

export async function sendConfirmationEmail(to: string, data: OrderEmailData): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const { Resend } = await import("resend")
  const resend = new Resend(key)

  const label = PACKAGE_LABELS[data.packageType] ?? data.packageType
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const orderUrl = `${appUrl}/orders/${data.orderId}`

  await resend.emails.send({
    from: "Hireable <hello@hireable.work>",
    to,
    subject: `You're in the queue — ${data.jobTitle} at ${data.company}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <h2 style="color:#0284c7">You're in the queue!</h2>
  <p>Thanks for your order. Here's what I'm working on for you:</p>
  <ul>
    <li><strong>Package:</strong> ${label}</li>
    <li><strong>Target role:</strong> ${data.jobTitle} at ${data.company}</li>
  </ul>
  <p>I'm personally reviewing your background and will have everything crafted and delivered within 24 hours.</p>
  <p><a href="${orderUrl}" style="color:#0284c7">Check your order status</a></p>
  <p style="margin-top:32px;color:#64748b;font-size:14px">— Ethan at Hireable</p>
</div>`,
  })
}

export async function sendDeliveryEmail(to: string, data: OrderEmailData): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const { Resend } = await import("resend")
  const resend = new Resend(key)

  const label = PACKAGE_LABELS[data.packageType] ?? data.packageType
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const orderUrl = `${appUrl}/orders/${data.orderId}`

  await resend.emails.send({
    from: "Hireable <hello@hireable.work>",
    to,
    subject: `Your ${label} is ready — ${data.jobTitle} at ${data.company}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <h2 style="color:#0284c7">Your package is ready!</h2>
  <p>I've finished your <strong>${label}</strong> for the <strong>${data.jobTitle}</strong> role at <strong>${data.company}</strong>.</p>
  <p><a href="${orderUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View & Download Your Package</a></p>
  <p>Best of luck with your application!</p>
  <p>If anything needs adjusting, just reply to this email.</p>
  <p style="margin-top:32px;color:#64748b;font-size:14px">— Ethan at Hireable</p>
</div>`,
  })
}
