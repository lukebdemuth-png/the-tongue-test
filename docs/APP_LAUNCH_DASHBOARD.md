# App Launch Dashboard

Updated: 2026-06-04 operator sweep

## Current Apps

### Tongue Test TCM

Live app:
https://the-tongue-test.vercel.app/tongue-assessment

Local repo:
/Users/creative/Documents/New project

GitHub remote:
git@github.com:lukebdemuth-png/the-tongue-test.git

Vercel project:
https://vercel.com/3-patterns/the-tongue-test

Status:
Web app is live and builds locally. Codex can continue app/code/testing work. The only hard launch blockers are owner-controlled production secrets in Vercel: Supabase server access and Stripe checkout/webhook secrets.

Ready:
- Live page returns 200 OK.
- Vercel production deployments are ready.
- Local production build passes.
- OpenAI API env exists in Vercel.
- Supabase public envs exist in Vercel.
- Resend/report email envs exist in Vercel.
- Waitlist/report/feedback/Stripe event table-name envs exist in Vercel.
- Privacy, terms, and data deletion pages exist.
- Stripe checkout and webhook code exist.
- Local repo state is clean.
- Local `main` matches `tongue/main`.
- Local lint passes with 2 existing Next.js `<img>` warnings.
- Local production build passes.

Not ready:
- STRIPE_SECRET_KEY is missing in Vercel.
- STRIPE_WEBHOOK_SECRET is missing in Vercel.
- SUPABASE_SERVICE_ROLE_KEY is missing in Vercel.
- SUPABASE_URL should be added as a server-side Vercel env.
- Production waitlist route currently fails only because `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are missing in Vercel.
- Production feedback route currently fails only because `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are missing in Vercel.
- Production report-record route currently fails only because `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are missing in Vercel.
- Production Stripe checkout currently fails only because `STRIPE_SECRET_KEY` is missing in Vercel.
- A live/test Stripe checkout has not been verified end-to-end.
- Report email/PDF delivery needs live verification.
- Main `origin` remote still points to the medicine ingestion repo; use `tongue` for Tongue Test pushes unless the remote strategy is changed.
- Native app-store payment path is not wired yet.

Last production route audit:
- `POST /api/waitlist`: FAIL. App clearly reports missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `POST /api/feedback`: FAIL. App clearly reports missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `POST /api/tongue-report-record`: FAIL. App clearly reports missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `POST /api/stripe-checkout`: FAIL. App clearly reports missing `STRIPE_SECRET_KEY`.
- Local production build: PASS.
- Git state: clean, `main` tracking `tongue/main`.

Code fix applied locally:
- Server write code no longer treats `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as a service role key.
- Production now reports missing `SUPABASE_SERVICE_ROLE_KEY` clearly instead of failing through RLS.
- Production now reports missing `STRIPE_SECRET_KEY` clearly instead of returning vague checkout failure.
- Fix was pushed to GitHub `the-tongue-test` and deployed by Vercel.
- Local git branch now tracks `tongue/main`.

Operator sweep notes:
- Local `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `OPENAI_API_KEY`.
- Local `.env.local` does not include `SUPABASE_SERVICE_ROLE_KEY`, so local Supabase write verification cannot be completed without adding a server-side key.
- Supabase changelog check found the April 28, 2026 breaking change that new tables may not be exposed to the Data API automatically; if production still fails after `SUPABASE_SERVICE_ROLE_KEY` is added, confirm Data API exposure and role grants for the launch tables.

### Your Master Homeopathy

Live site:
https://yourmasterhomeopathy.com

Local mobile app repo:
/Users/creative/YourMasterHomeopathy

Backend/web repo:
/Users/creative/innate-wellness

Vercel project:
https://vercel.com/3-patterns/innate-wellness

Status:
The website is live and the Expo project passes validation. It is not fully launch-ready because EAS login, Anthropic env, Android RevenueCat key, and store-build steps remain.

Ready:
- Domain returns 200 OK.
- Vercel deployments are ready.
- Expo doctor passes 18/18.
- iOS RevenueCat key exists locally.
- App package/bundle id exists: com.yourmasterhomeopathy.app.
- EAS config exists.

Not ready:
- EAS CLI is not logged in.
- Android RevenueCat key is still a placeholder.
- `ANTHROPIC_API_KEY` is missing from the Vercel production env.
- AI guide endpoint needs production testing after Anthropic key is added.
- Store listing/screenshots/privacy/data safety still need final confirmation.
- RevenueCat product mapping must be confirmed against App Store / Google Play products.

## Shared System Setup

Ready:
- Docker Desktop is installed and running.
- Docker Compose works.
- Docker MCP Toolkit works.
- Docker MCP profile `general` exists.
- Docker `general` includes Context7 and Sequential Thinking.
- Codex MCP includes Docker, filesystem, Playwright, OpenClaw, Supabase, GitHub, Vercel, and Computer Use.
- OpenClaw MCP includes Docker, filesystem, Playwright, Supabase, GitHub, and Vercel.
- OpenClaw gateway is running at http://127.0.0.1:18789/.

Still limited:
- Vercel MCP is configured but not OAuth logged in.
- Supabase MCP is read-only for now.
- Google Drive MCP is not connected.

## Codex-Owned Work Queue

These are tasks Codex should do without asking unless a login, payment, or destructive action is required.

1. Separate launch docs from app code where needed.
2. Confirm whether `origin` should be changed to the Tongue Test repo or whether agents should keep using `tongue`.
3. Push committed app changes to the correct repo when there are new changes.
4. Verify Vercel is building from the correct repo/branch.
5. Test Tongue Test waitlist, feedback, report, and email flows immediately after server secrets are present.
6. Test Supabase writes for production routes after server-side Supabase env is present.
7. Test Stripe checkout after keys are added.
8. Improve result/report quality and mobile UX after launch plumbing is verified.
9. Prepare app-store compliance docs/checklists for each app.
10. Keep this dashboard updated after each production audit.

## Owner-Only Action Queue

These require account authority, secrets, payments, login approval, or store-owner decisions. Everything else should stay with Codex.

### Critical Tongue Test Blockers

1. Add Supabase server-side env vars in Vercel:
   https://vercel.com/3-patterns/the-tongue-test/settings/environment-variables

   Required env vars:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

2. Add Stripe production/test keys for Tongue Test in Vercel:
   https://vercel.com/3-patterns/the-tongue-test/settings/environment-variables

   Required env vars:
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

3. Open Stripe dashboard and confirm products/prices/webhook:
   https://dashboard.stripe.com/

   Needed:
   - One-time reading: $6.99
   - Monthly subscription: $7.99/month
   - Trial: 14 days
   - Webhook endpoint: https://the-tongue-test.vercel.app/api/stripe-webhook

4. Confirm Supabase Tongue Test tables in Supabase:
   https://supabase.com/dashboard/project/irnvzkkzujcebusrlphs

   Tables to confirm:
   - waitlist_subscribers
   - feedback
   - tongue_report_records
   - stripe_events

5. Confirm Resend sending domain and sender:
   https://resend.com/domains

### Secondary Account Steps

6. Finish Vercel MCP OAuth login:
   https://vercel.com/account/integrations

7. Add `ANTHROPIC_API_KEY` to Innate Wellness Vercel env:
   https://vercel.com/3-patterns/innate-wellness/settings/environment-variables

8. Open Anthropic console if a new key is needed:
   https://console.anthropic.com/settings/keys

9. Log into Expo/EAS for Your Master Homeopathy:
   https://expo.dev/

10. Replace the Android RevenueCat key in Your Master Homeopathy:
   https://app.revenuecat.com/

11. Confirm Google Play Console status:
   https://play.google.com/console/

12. Confirm Apple Developer account/App Store Connect status if launching iOS:
   https://appstoreconnect.apple.com/

13. Confirm Namecheap DNS if any domain changes are needed:
   https://ap.www.namecheap.com/

## Recommended Launch Order

1. Launch Your Master Homeopathy first if Google Play setup is already furthest along.
2. Launch Tongue Test as a paid web app first.
3. Convert Tongue Test into native app-store billing after the paid web flow works.
4. Do not delay everything for native app-store approval if the web version can start collecting real users sooner.
