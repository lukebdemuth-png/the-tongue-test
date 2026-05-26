# The Tongue Test Launch Setup

## Vercel Environment Variables

Required for AI photo analysis:

- `OPENAI_API_KEY`

Recommended before public sharing:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_WAITLIST_TABLE`
- `SUPABASE_FEEDBACK_TABLE`

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
