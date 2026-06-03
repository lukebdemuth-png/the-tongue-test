# AI App Launch Runbook

Created: June 2, 2026

This is the standard setup path for future small apps so Codex/OpenClaw/AI agents can do as much of the launch work as possible without starting from scratch.

## Production Chain

```text
User opens app
→ app collects input
→ app handles payment or access gate
→ AI/API route produces result
→ Supabase stores records
→ PDF/result is generated
→ Resend emails result when needed
→ Vercel hosts and deploys the app
→ GitHub stores the source of truth
```

## Account Roles

### GitHub

Purpose:

- Source code repository
- Commit history
- Vercel deployment trigger

AI can usually:

- Commit code
- Push branches
- Trigger redeploys by pushing commits
- Prepare PRs or direct updates

### Vercel

Purpose:

- Production hosting
- Environment variables
- Build/deploy logs

AI can usually:

- Verify project link
- Add known environment variables
- Trigger redeploys
- Inspect deployment status

AI still needs user/account help when:

- A new Vercel account/project must be created from scratch
- Billing or team permissions are required
- A secret value is not already available locally

### Supabase

Purpose:

- Waitlist records
- Feedback records
- Report records
- Stripe event records
- Future user accounts/storage if needed

AI can usually:

- Write SQL schema
- Verify table existence through API status checks
- Update app code to write to Supabase
- Document required RLS and table behavior

AI still needs user/account help when:

- Service role key is not available
- Supabase dashboard login is required
- Production database permissions need manual approval

Security rule:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- Only server routes may use service-role secrets.

### Stripe

Purpose:

- One-time readings
- Subscriptions/trials
- Payment webhooks

AI can usually:

- Build checkout routes
- Build webhook routes
- Document product/price setup
- Verify webhook URL and expected event names

AI still needs user/account help when:

- Creating real Stripe products/prices
- Adding bank/business/tax details
- Retrieving secret keys/webhook signing secret

### OpenAI

Purpose:

- Image analysis
- Result writing
- Structured interpretation support

AI can usually:

- Add server route integration
- Configure production env if `OPENAI_API_KEY` is already available
- Test route behavior without exposing the key

Security rule:

- Never expose `OPENAI_API_KEY` as `NEXT_PUBLIC_`.
- Use it only in server routes.

### Resend

Purpose:

- Email PDF/result reports
- Optional waitlist confirmation emails

AI can usually:

- Build email API routes
- Generate PDF/email content
- Add environment-variable wiring

AI still needs user/account help when:

- Domain verification is required
- DNS records must be added
- API key is not available

## Standard Environment Variables

Public browser-safe variables:

```text
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_PLAY_BUILD=
```

Server-only secrets:

```text
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

Server-only non-secret table names:

```text
SUPABASE_WAITLIST_TABLE=waitlist_subscribers
SUPABASE_FEEDBACK_TABLE=app_feedback
SUPABASE_TONGUE_REPORTS_TABLE=tongue_report_records
SUPABASE_STRIPE_EVENTS_TABLE=stripe_events
```

Email settings:

```text
REPORT_FROM_EMAIL=
REPORT_REPLY_TO_EMAIL=
WAITLIST_FROM_EMAIL=
WAITLIST_NOTIFY_EMAIL=
```

## Tongue Test Current Production Status

As of June 2, 2026:

- GitHub repo is linked to Vercel project `the-tongue-test`.
- Production deploy is live.
- Live route `/tongue-assessment` returns `200`.
- Supabase public table checks return `200` for:
  - `waitlist_subscribers`
  - `app_feedback`
  - `tongue_report_records`
  - `stripe_events`
- Vercel production variables now include:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `OPENAI_API_KEY`
  - `SUPABASE_WAITLIST_TABLE`
  - `SUPABASE_FEEDBACK_TABLE`
  - `SUPABASE_TONGUE_REPORTS_TABLE`
  - `SUPABASE_STRIPE_EVENTS_TABLE`

Still needed before full paid/email launch:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`
- `REPORT_REPLY_TO_EMAIL`

## AI Operating Rule For Future Apps

For a new app, AI should:

1. Create the app route and working prototype.
2. Add required API routes.
3. Add Supabase SQL schema.
4. Add safe environment variable names and docs.
5. Add Vercel project link if possible.
6. Add known non-secret env vars automatically.
7. Add known secrets only when already available locally and safe to use.
8. Trigger deployment.
9. Run live smoke checks.
10. Report only remaining account-side blockers.

Stop only for:

- Login that cannot be completed by the agent
- Payment/billing setup
- Secret values the agent does not have
- Legal/compliance decision requiring owner approval

