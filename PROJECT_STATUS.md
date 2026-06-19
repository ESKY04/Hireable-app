# Hireable — Project Status Report

_Generated: 2026-06-18_

---

## 1. PROJECT OVERVIEW

**Name:** Hireable  
**Purpose:** AI-powered job application SaaS. Users paste a resume, target a job description, and get a tailored resume + cover letter in seconds. Includes resume scoring/gap analysis and Stripe billing.  
**Current Phase:** MVP complete, deployed to Vercel preview. Awaiting production env vars + DB migration to go live.  
**Last Meaningful Work:** Phase 5 (Stripe billing + Clerk webhook) and Phase 6 (Vercel deployment config). Build passes cleanly. Preview deployment is READY on Vercel.

---

## 2. TECH STACK

| Layer | Technology | Version | Status |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 | Installed |
| UI | React + Tailwind CSS | 18.3.1 / 3.4.19 | Installed |
| Language | TypeScript | 5.9.3 | Installed |
| Auth | Clerk (`@clerk/nextjs`) | 5.7.6 | Installed, **needs env vars** |
| Database ORM | Prisma + PostgreSQL | 5.22.0 | Installed, **schema not yet migrated** |
| Payments | Stripe + `stripe` SDK | 15.12.0 | Installed, **needs env vars** |
| AI (TS) | `@anthropic-ai/sdk` | 0.105.0 | Installed |
| AI (Python) | `anthropic` (pip) | 0.111.0 | Installed locally |
| Webhook verify | `svix` | 1.96.0 | Installed |
| Deploy target | Vercel | — | Preview live, prod pending |

---

## 3. FOLDER STRUCTURE

```
hireable/
├── lib/                          # Python hybrid AI system (local only, not on Vercel)
│   ├── __init__.py
│   ├── auto_offload_router.py    # Local-first router: tries Qwen → falls back to Claude
│   ├── auto_work_checker_skill.py # Validates Qwen output quality
│   ├── hybrid_ai_delegator_production.py # Keyword-based router (classify first)
│   ├── integrated_hybrid_ai_system.py    # Combined entry point: setup_hybrid_ai()
│   └── server.py                 # FastAPI bridge on :8001 (local dev only)
├── prisma/
│   └── schema.prisma             # User, Resume, CoverLetter models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── resumes/route.ts              # GET list, POST create (usage-gated)
│   │   │   ├── resumes/[id]/route.ts         # GET, PATCH, DELETE
│   │   │   ├── resumes/[id]/tailor/route.ts  # POST: AI rewrite (force_claude)
│   │   │   ├── resumes/[id]/score/route.ts   # POST: score + gap analysis (force_claude)
│   │   │   ├── resumes/parse/route.ts        # POST: AI parse raw text (Qwen-first)
│   │   │   ├── cover-letters/route.ts        # GET list, POST create (usage-gated)
│   │   │   ├── cover-letters/generate/route.ts # POST: AI generate (force_claude)
│   │   │   ├── stripe/checkout/route.ts      # POST: create Stripe Checkout session
│   │   │   ├── stripe/portal/route.ts        # POST: open Stripe Customer Portal
│   │   │   ├── webhooks/clerk/route.ts       # POST: sync user lifecycle to DB
│   │   │   └── webhooks/stripe/route.ts      # POST: handle subscription events
│   │   ├── billing/
│   │   │   ├── page.tsx                      # Usage bars, plan cards, upgrade button
│   │   │   └── BillingActions.tsx            # Client: UpgradeButton, ManageButton
│   │   ├── cover-letters/
│   │   │   ├── page.tsx                      # List all cover letters
│   │   │   ├── new/page.tsx                  # Generate cover letter (tone picker)
│   │   │   └── [id]/page.tsx                 # View + copy cover letter
│   │   ├── dashboard/page.tsx                # Stats + recent resumes/letters
│   │   ├── resumes/
│   │   │   ├── page.tsx                      # List all resumes (with scores)
│   │   │   ├── new/page.tsx                  # Paste resume → AI parse → save
│   │   │   └── [id]/
│   │   │       ├── page.tsx                  # View parsed resume
│   │   │       └── tailor/page.tsx           # Tailor UI + Score/Gap analysis
│   │   ├── globals.css
│   │   ├── layout.tsx                        # ClerkProvider wrapper
│   │   └── page.tsx                          # Landing page
│   ├── components/
│   │   └── CopyButton.tsx                    # Client-side clipboard copy
│   ├── lib/
│   │   ├── ai-router.ts     # TS router: calls Python bridge (:8001) → Anthropic fallback
│   │   ├── env.ts           # Runtime env var validation
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── stripe.ts        # Stripe client + PLAN_LIMITS constant
│   │   └── usage.ts         # checkResumeLimit / checkCoverLetterLimit
│   └── middleware.ts         # Clerk auth middleware (protects all app routes)
├── .env.example              # All required env vars documented (no values)
├── .env.local                # Only contains VERCEL_OIDC_TOKEN (Vercel CI token)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json               # Build cmd: "prisma generate && next build", fn timeouts
└── test_import.py            # Quick Python AI system import test
```

---

## 4. WHAT'S BUILT (Completed)

### Pages
| Route | Description |
|---|---|
| `/` | Landing page with CTA |
| `/dashboard` | Stats + recent resumes & cover letters |
| `/resumes` | Resume list with scores |
| `/resumes/new` | Paste text → AI parse → save |
| `/resumes/[id]` | View full parsed resume |
| `/resumes/[id]/tailor` | Tailor for job + Score/Gap analysis (2 tabs) |
| `/cover-letters` | Cover letter list |
| `/cover-letters/new` | Generate with tone selector (confident/formal/casual) |
| `/cover-letters/[id]` | View + copy cover letter |
| `/billing` | Usage bars, Free vs Pro plan cards, upgrade/manage |

### API Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/api/resumes` | GET | List user's resumes |
| `/api/resumes` | POST | Create (usage-gated: 3 free) |
| `/api/resumes/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/resumes/parse` | POST | Parse raw text → JSON (Qwen-first routing) |
| `/api/resumes/[id]/tailor` | POST | AI rewrite bullets for job (Claude only) |
| `/api/resumes/[id]/score` | POST | Score 0-100 + gap analysis (Claude only) |
| `/api/cover-letters` | GET | List cover letters |
| `/api/cover-letters` | POST | Create (usage-gated: 10 free) |
| `/api/cover-letters/generate` | POST | AI generate (Claude only, tone param) |
| `/api/stripe/checkout` | POST | Create Checkout session |
| `/api/stripe/portal` | POST | Open Customer Portal |
| `/api/webhooks/clerk` | POST | Sync user.created/updated/deleted → DB |
| `/api/webhooks/stripe` | POST | Handle checkout.completed + subscription events |

### Database Models (Prisma)
- **User** — clerkId, email, name, stripeId, stripeSubscriptionId, plan (FREE/PRO/ENTERPRISE)
- **Resume** — title, content (Json), tailoredFor, score, userId
- **CoverLetter** — jobTitle, company, content (Text), resumeId (optional), userId

### Python AI System (local only)
- `setup_hybrid_ai(strategy="classify"|"offload")` — main entry point
- **classify** strategy: keyword-based routing (extract/parse → Qwen, reason/design → Claude)
- **offload** strategy: always try Qwen first, escalate on failure or quality < 70
- `AutoWorkChecker` — validates JSON, code, structured, text output types
- FastAPI bridge (`lib/server.py`) — exposes router over HTTP on `:8001` for Next.js to call
- `src/lib/ai-router.ts` — TS client that calls bridge or falls back to Anthropic directly

### AI Routing Decisions Per Endpoint
| Endpoint | Routing |
|---|---|
| `/api/resumes/parse` | Qwen-first (`"extract"` keyword) |
| `/api/resumes/[id]/tailor` | Claude only (`force_claude=true`) |
| `/api/resumes/[id]/score` | Claude only (`force_claude=true`) |
| `/api/cover-letters/generate` | Claude only (`force_claude=true`) |

---

## 5. WHAT'S IN PROGRESS

- **Production deployment** — preview is READY on Vercel, but production env vars not yet added to Vercel dashboard. DB migration (`prisma migrate deploy`) not yet run against Supabase.
- **PR not merged** — code lives on branch `claude/hireable-vercel-deployment-m37dts`. Main branch still has older version.

### TODOs in code
None found (0 TODO/FIXME comments in `.ts`/`.tsx` files).

### Known issues / gaps
- `src/middleware.ts` uses `(auth as any).protect()` — type cast needed due to Clerk 5.7.6 type lag. Works at runtime.
- `/sign-in` and `/sign-up` routes not explicitly created — Clerk handles these via its hosted UI. If custom pages are needed, they'd be `src/app/sign-in/[[...sign-in]]/page.tsx`.
- No email notification system yet.
- No application tracker (planned but not started).

---

## 6. WHAT'S NOT STARTED

- **Application tracker** — track which jobs you've applied to, status (applied/interview/offer/rejected)
- **Custom sign-in/sign-up pages** (currently using Clerk hosted UI)
- **Resume PDF export** — download tailored resume as PDF
- **Job description scraper** — paste a URL instead of raw text
- **Email notifications** (e.g. Resend) — welcome email, weekly digest
- **Admin dashboard** — view all users, usage stats
- **A/B testing resume variants**
- **Mobile nav** — no hamburger menu / mobile sidebar yet

---

## 7. ENVIRONMENT / CONFIG STATUS

**Files present:**
- `.env.example` — documents all required vars (no secrets)
- `.env.local` — currently only has `VERCEL_OIDC_TOKEN` (Vercel CI token)

**Required vars still needed in `.env.local` for local dev and in Vercel dashboard for production:**

| Variable | Purpose | Status |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth | NOT SET locally |
| `CLERK_SECRET_KEY` | Clerk auth | NOT SET locally |
| `CLERK_WEBHOOK_SECRET` | Verify Clerk webhooks | NOT SET locally |
| `DATABASE_URL` | Supabase pooler (port 6543) | NOT SET locally |
| `DIRECT_URL` | Supabase direct (port 5432, migrations only) | NOT SET locally |
| `STRIPE_SECRET_KEY` | Stripe API | NOT SET locally |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhooks | NOT SET locally |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID | NOT SET locally |
| `ANTHROPIC_API_KEY` | Claude API | NOT SET locally |
| `NEXT_PUBLIC_APP_URL` | Used in Stripe redirect URLs | NOT SET locally |

---

## 8. DEPENDENCIES STATUS

```
hireable@0.1.0
├── @anthropic-ai/sdk@0.105.0
├── @clerk/nextjs@5.7.6
├── @prisma/client@5.22.0
├── @stripe/stripe-js@3.5.0
├── @types/node@20.19.43
├── @types/react-dom@18.3.7
├── @types/react@18.3.31
├── autoprefixer@10.5.0
├── eslint-config-next@14.2.5
├── eslint@8.57.1
├── next@14.2.5
├── postcss@8.5.15
├── prisma@5.22.0
├── react-dom@18.3.1
├── react@18.3.1
├── stripe@15.12.0
├── svix@1.96.0
├── tailwindcss@3.4.19
└── typescript@5.9.3
```

No errors. All packages installed and resolving correctly.

**Python packages (pip, local only):**
- `anthropic` 0.111.0
- `requests` 2.34.2
- `fastapi` 0.137.2
- `uvicorn` 0.49.0

---

## 9. GIT STATUS

**Local repo:** `C:\Users\Ethan\hireable` (branch: `master`)

**Recent commits:**
```
600d4a6 Initial Hireable MVP
```

**Uncommitted changes:**
```
modified: .gitignore  (minor duplicate entry added by Vercel tooling)
```

**GitHub repo:** `github.com/ESKY04/Hireable-app`  
**Vercel project:** `hireable` (team: `ethan-sh-projects`, id: `prj_gIAYgikYopS3liL9RaApktkfn3tI`)  
**Active PR branch:** `claude/hireable-vercel-deployment-m37dts` — preview READY at `hireable-mwuchcgkc-ethan-sh-projects.vercel.app`

---

## 10. INTEGRATION STATUS

| Integration | Status | Notes |
|---|---|---|
| Python AI system (`lib/`) | **Present, working** | `test_import.py` passes. Imports cleanly. |
| Local Qwen (`:8000`) | **Not running** | Auto-detected as unavailable; Claude fallback active |
| FastAPI bridge (`:8001`) | **Not running** | Start with `uvicorn lib.server:app --port 8001 --reload` |
| Anthropic / Claude | **Configured** (ANTHROPIC_API_KEY in env) | Used as fallback when Qwen unavailable |
| Clerk | **Not configured** | Needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` |
| Supabase / Prisma | **Not configured** | Needs `DATABASE_URL` + `DIRECT_URL`; migration not run |
| Stripe | **Not configured** | Needs `STRIPE_SECRET_KEY`, price ID, webhook secret |
| Vercel | **Connected** | Preview deployed; production pending env vars |

---

## 11. NEXT STEPS

### Immediate (to go live)
1. **Add env vars to Vercel dashboard** — all vars listed in section 7
2. **Run DB migration** — `npx prisma migrate deploy` with `DIRECT_URL` pointed at Supabase
3. **Configure Clerk webhooks** — point `user.created/updated/deleted` to `https://yourdomain/api/webhooks/clerk`
4. **Configure Stripe webhooks** — point `checkout.session.completed`, `customer.subscription.updated/deleted` to `https://yourdomain/api/webhooks/stripe`
5. **Merge PR** on GitHub → triggers production deploy on Vercel
6. **Create a Stripe product + price** and copy the price ID into `STRIPE_PRO_PRICE_ID`

### After launch
- Add `/sign-in` and `/sign-up` custom pages (optional, Clerk hosted UI works now)
- Application tracker feature
- Resume PDF export
- Mobile navigation

### Blockers
- None in code. All blockers are config/infra (env vars, DB migration, webhook setup).

---

## 12. NOTES

### Architecture decisions
- **Hybrid AI routing:** Two Python strategies available — `"classify"` (keyword-based, fast) and `"offload"` (local-first, max cost savings). The TypeScript `ai-router.ts` mirrors the offload strategy for the Next.js app, calling the Python bridge when available.
- **Python system is local-only:** The `lib/` Python files do not deploy to Vercel. On Vercel, `ai-router.ts` calls Anthropic directly (no bridge available). The bridge is only useful in local dev when running Qwen on localhost.
- **force_claude=true pattern:** Creative/reasoning tasks (tailor, score, generate cover letter) always skip local routing and go straight to Claude. Only data extraction tasks (parse) use local-first routing.
- **Usage gates:** Free plan = 3 resumes / 10 cover letters. Gates are in the POST handlers for `/api/resumes` and `/api/cover-letters`. Returns `{ error, upgrade: true }` with HTTP 403 on limit hit.
- **Clerk middleware cast:** `(auth as any).protect()` in `src/middleware.ts` — Clerk 5.7.6 has a type definition gap; the method exists at runtime. This should resolve in a Clerk patch release.
- **Prisma + Supabase:** Uses pgBouncer pooler URL (`DATABASE_URL`, port 6543) for runtime and direct URL (`DIRECT_URL`, port 5432) for migrations only. This is the standard Supabase + Prisma serverless setup.
- **No sign-in/sign-up pages created** — Clerk's hosted UI handles these automatically via `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` env vars. If custom branded pages are needed later, use `src/app/sign-in/[[...sign-in]]/page.tsx`.
- **Brand color:** Tailwind `brand-*` custom color palette (blue, defined in `tailwind.config.ts`).
- **Git branch mismatch:** Local repo is on `master`; GitHub PR is on `claude/hireable-vercel-deployment-m37dts`. The local code and the PR branch are the same MVP — they were built in parallel sessions. Push local `master` to GitHub `main` to unify.
