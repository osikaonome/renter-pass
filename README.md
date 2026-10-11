# RenterPass

One-link renter profile for Dublin. Renters build a profile once (solo or as a household) and share a separate, revocable link per listing. Documents stay locked until the renter approves a specific, email-verified request, and every document viewed is watermarked with the requester's name.

Built with Next.js 16 (App Router, Cache Components), Supabase (Postgres, Auth, Storage, RLS), TanStack Query, Zustand, Zod, Tailwind 4, Resend + React Email, Web Push, Upstash rate limiting and OpenRouter.

## Getting started

1. Install: `npm install`
2. Create a Supabase project in an **EU region**, then apply the schema:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. In Supabase Auth settings:
   - Site URL: your `NEXT_PUBLIC_SITE_URL`; add `<site>/auth/callback` to redirect URLs.
   - **Magic Link email template** (Authentication → Emails): include both the link and the code, so people can sign in by tapping the link *or* typing the code. The code is what makes sign-in work inside the installed iPhone app, where links open in Safari instead:
     ```html
     <h2>Sign in to RenterPass</h2>
     <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
     <p>Or enter this code: <strong>{{ .Token }}</strong></p>
     ```
   - **Staying signed in:** under Authentication → Sessions, leave "Time-box user sessions" and "Inactivity timeout" off. Session cookies last 400 days and are refreshed on every visit, so people stay signed in until they sign out.
4. Copy `.env.example` to `.env.local` and fill it in. Generate VAPID keys with `npx web-push generate-vapid-keys`.
5. `npm run dev`

Without `RESEND_API_KEY`, emails (including requester verification codes) are printed to the server console. Without Upstash, rate limits are in-memory (development only).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests (needs a configured app) |
| `npm run test:rls` | pgTAP RLS policy tests (`supabase start` first) |
| `npm run icons` | Regenerate PWA icons |

## Architecture

```
app/
  (marketing)/          landing, how it works, privacy, terms, cookies, help
  (app)/                renter area: dashboard, profile, documents, household, links, requests, settings
  p/[slug]/             public profile (server-rendered, minimal JS) + OG preview image
  p/[slug]/request/     requester flow: email → one-time code → choose documents
  r/[token]/            requester's list of approved documents (link from email)
  v/[grantId]/          watermarked document viewer
  api/                  route handlers (renter APIs, public requester APIs, daily cron)
lib/
  dal.ts                the only place the renter session is read
  public-link.ts        the only path for landlord-facing data (explicit public field list)
  grant-access.ts       resolves a requester token to currently valid grants
  watermark/            image (sharp + next/og overlay) and PDF (pdf-lib rebuild) watermarking
  ai/                   OpenRouter wrapper and prompts
  notifications/        in-app + email + push dispatch, honouring preferences
  rate-limit/           Upstash sliding-window policies
  security/             tokens, magic-byte sniffing, PPS/IBAN detection
hooks/                  TanStack Query hooks (optimistic updates for revoke/delete/read)
stores/                 Zustand: profile builder step/draft, AI drafting session
schemas/                Zod schemas shared by client and server
supabase/migrations/    schema, RLS, storage buckets
supabase/tests/         RLS policy tests
```

### Security model (scope §5)

- **RLS on every table.** Renters touch only their own rows; household members see each other's public fields through a `security definer` function, never documents. Column grants stop users rewriting ownership fields.
- **Grants are created with the renter's own client**, so RLS guarantees only a document's owner can grant it, and only for a document actually requested.
- **Public pages and requester actions use the service role** through two modules (`lib/public-link.ts`, `lib/grant-access.ts`) with explicit field lists and checks.
- **Requester verification:** 6-digit code (HMAC-hashed, 10-minute expiry, 5 attempts), then a signed, link-scoped, 1-hour httpOnly cookie that allows exactly one request.
- **Requester access** uses a 256-bit token sent by email (only its SHA-256 is stored). Each decision rotates it. Revoking a link or grant, or expiry, cuts access immediately.
- **Files:** uploaded straight to a private bucket via signed upload URLs, verified by magic bytes on registration, scanned for PPS/IBAN/card numbers (PDF text), and never served raw. Viewers get a freshly re-rendered, watermarked JPEG or rebuilt PDF with `no-store`.
- **Privacy:** link views store no viewer data; IPs and emails used for rate limiting are hashed; `noindex` on all profile, request and viewer pages; documents never go to the AI model.

## Deployment (Vercel)

`vercel.json` pins functions to `dub1` and schedules `/api/cron/daily` (expiry reminders, opt-in view digests, retention purge). Set every variable from `.env.example`, including `CRON_SECRET`.

## Before public launch

- [ ] Legal review of privacy policy and terms (drafts in `app/(marketing)`)
- [ ] DPIA
- [ ] Decide the inactive-account retention period and implement the reminder/deletion job
- [ ] Choose a production OpenRouter model whose providers support zero data retention
- [ ] Verify Supabase free-tier terms (inactivity pausing) and budget for a paid plan
- [ ] Real-device testing (iOS home-screen push, Android PDF viewing), screen-reader pass
- [ ] Measure public profile LCP and JS budget on a mid-range phone
