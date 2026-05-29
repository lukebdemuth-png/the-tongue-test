# Tongue Test: TCM AI Launch Setup

## Vercel Environment Variables

Required for AI photo analysis:

- `OPENAI_API_KEY`

Required for paid checkout:

- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Recommended before public sharing:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_WAITLIST_TABLE`
- `SUPABASE_FEEDBACK_TABLE`
- `SUPABASE_TONGUE_REPORTS_TABLE`
- `SUPABASE_STRIPE_EVENTS_TABLE`
- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`
- `REPORT_REPLY_TO_EMAIL`

Optional for local fallback paths:

- `WAITLIST_FILE_PATH`
- `FEEDBACK_FILE_PATH`
- `TONGUE_REPORT_FILE_PATH`

## Supabase Tables

Waitlist table default:

- `waitlist_subscribers`

Feedback table default:

- `app_feedback`

Suggested feedback columns:

- `id` uuid primary key default gen_random_uuid()
- `email` text nullable
- `message` text not null
- `source` text
- `created_at` timestamptz default now()

Report records table default:

- `tongue_report_records`

Suggested report columns:

- `id` uuid primary key default gen_random_uuid()
- `access_choice` text nullable
- `primary_title` text not null
- `primary_summary` text nullable
- `organ_priorities` jsonb nullable
- `pattern_scores` jsonb nullable
- `visible_signs` jsonb nullable
- `intake_highlights` jsonb nullable
- `notes` text nullable
- `source` text
- `created_at` timestamptz default now()

Suggested SQL:

```sql
create table if not exists public.tongue_report_records (
  id uuid primary key default gen_random_uuid(),
  access_choice text,
  primary_title text not null,
  primary_summary text,
  organ_priorities jsonb,
  pattern_scores jsonb,
  visible_signs jsonb,
  intake_highlights jsonb,
  notes text,
  source text default 'tongue-assessment',
  created_at timestamptz not null default now()
);

alter table public.tongue_report_records enable row level security;
```

Stripe events table default:

- `stripe_events`

Suggested stripe events columns:

- `id` uuid primary key default gen_random_uuid()
- `stripe_event_id` text not null unique
- `event_type` text not null
- `livemode` boolean nullable
- `checkout_session_id` text nullable
- `customer_email` text nullable
- `plan` text nullable
- `payment_status` text nullable
- `raw_event` jsonb nullable
- `received_at` timestamptz default now()

Full SQL setup file:

- `supabase/tongue-test-launch-schema.sql`

Run that file in the Supabase SQL editor to create:

- `waitlist_subscribers`
- `app_feedback`
- `tongue_report_records`
- `stripe_events`

## Launch Routes

- App: `/pattern-app`
- Direct app route: `/tongue-assessment`
- Free IG content gate: `/free-content/tongue-photo-guide`
- Stripe checkout API: `/api/stripe-checkout`
- Stripe webhook API: `/api/stripe-webhook`
- Report record API: `/api/tongue-report-record`

## Notes

The app frames outputs as educational Traditional Chinese Medicine-inspired pattern reflections. It does not diagnose, prescribe, or replace medical care.

## PDF Report Email Delivery

The app can now email the generated PDF report from `/api/tongue-report-email`.

Required before this works in production:

- Create or use a Resend account.
- Verify a sending domain or sender email in Resend.
- Add `RESEND_API_KEY` to Vercel.
- Add `REPORT_FROM_EMAIL`, for example `reports@yourdomain.com`.
- Add `REPORT_REPLY_TO_EMAIL`, for example your support inbox.

The emailed PDF does not include the user's tongue photo. It includes the app result, intake summary, visible-sign labels, food/lifestyle/formula-family direction, educational TCM context, and disclaimer language.

## Stripe Checkout

The app now starts checkout through `/api/stripe-checkout`.

Current pricing:

- Free 14-day trial, then `$7.99/month`
- One-time full reading for `$6.99`

Before production launch:

- Add `STRIPE_SECRET_KEY` in Vercel.
- Add `STRIPE_WEBHOOK_SECRET` in Vercel.
- Add `NEXT_PUBLIC_SITE_URL` as the deployed domain, for example `https://yourdomain.com`.
- Test both checkout buttons from the deployed site.
- Confirm Stripe sends the user back to `/tongue-assessment?checkout=success`.
- In Stripe, create a webhook endpoint for:
  - `https://yourdomain.com/api/stripe-webhook`
  - Event: `checkout.session.completed`
- Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Local development behavior:

- If `STRIPE_SECRET_KEY` is missing, local development unlocks preview access and shows a setup message.
- Production will not unlock without Stripe.
