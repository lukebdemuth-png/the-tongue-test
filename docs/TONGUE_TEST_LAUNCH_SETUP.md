# The Tongue Test Launch Setup

## Vercel Environment Variables

Required for AI photo analysis:

- `OPENAI_API_KEY`

Recommended before public sharing:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_WAITLIST_TABLE`
- `SUPABASE_FEEDBACK_TABLE`
- `SUPABASE_GMAIL_TOKENS_TABLE`

Required only if Gmail drafting/sending is enabled:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_SCOPES`
- `GMAIL_STATE_SECRET`
- `GMAIL_TOKEN_ENCRYPTION_KEY`
- `SUPABASE_GMAIL_EVENTS_TABLE`

Optional for local fallback paths:

- `WAITLIST_FILE_PATH`
- `FEEDBACK_FILE_PATH`

## Supabase Tables

Waitlist table default:

- `waitlist_subscribers`

Feedback table default:

- `app_feedback`

Gmail token table default:

- `gmail_oauth_tokens`

Suggested feedback columns:

- `id` uuid primary key default gen_random_uuid()
- `email` text nullable
- `message` text not null
- `source` text
- `created_at` timestamptz default now()

Suggested Gmail token columns:

- `session_id` text primary key
- `encrypted_token_json` text not null
- `updated_at` timestamptz default now()

## Gmail Integration Setup

1. Create or open a Google Cloud project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen.
4. Create OAuth 2.0 Client ID credentials.
5. Add this redirect URI for local development:
   - `http://localhost:3000/api/gmail/callback`
6. Add the production callback URL in Google Cloud after Vercel deployment:
   - `https://YOUR-VERCEL-DOMAIN/api/gmail/callback`
7. Add these Vercel environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `GMAIL_SCOPES`
   - `GMAIL_STATE_SECRET`
   - `GMAIL_TOKEN_ENCRYPTION_KEY`

Recommended Gmail scopes:

- Draft-first only: `https://www.googleapis.com/auth/gmail.compose`
- Sending enabled: `https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send`

The app creates Gmail drafts by default. Sending requires an explicit confirmation action. Gmail tokens are stored server-side only and encrypted before storage.

Gmail token storage requires Supabase. Local file token storage is intentionally not used for Gmail OAuth tokens.

## Launch Routes

- App: `/pattern-app`
- Direct app route: `/tongue-assessment`
- Free IG content gate: `/free-content/tongue-photo-guide`

## Notes

The app frames outputs as educational Traditional Chinese Medicine-inspired pattern reflections. It does not diagnose, prescribe, or replace medical care.
