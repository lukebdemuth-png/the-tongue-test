# Tongue Test: TCM AI Launch Setup

## Vercel Environment Variables

Required for AI photo analysis:

- `OPENAI_API_KEY`

Recommended before public sharing:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_WAITLIST_TABLE`
- `SUPABASE_FEEDBACK_TABLE`
- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`
- `REPORT_REPLY_TO_EMAIL`

Optional for local fallback paths:

- `WAITLIST_FILE_PATH`
- `FEEDBACK_FILE_PATH`

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

## Launch Routes

- App: `/pattern-app`
- Direct app route: `/tongue-assessment`
- Free IG content gate: `/free-content/tongue-photo-guide`

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
