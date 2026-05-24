# External App Setup

This is the separated setup plan for the two workstreams.

## What You Need To Do

You only need to create accounts and copy values when I ask for them.

### 1. Supabase

Use Supabase for the shared backend.

You do:

1. Create a Supabase account.
2. Create one project named `patterns-three-traditions`.
3. Open the SQL editor.
4. Paste and run `supabase/migrations/001_patterns_stack.sql`.
5. Send me these values from Supabase project settings:
   - Project URL
   - anon public key
   - service role key

Do not paste keys in public places. The service role key is private.

### 2. Vercel

Use Vercel to host the current Next.js app.

You do:

1. Create a Vercel account.
2. Connect the GitHub repo.
3. Import the project.
4. Add the environment variables from `.env.example`.
5. Deploy.

### 3. Resend

Use Resend for simple waitlist notifications and confirmation emails.

You do:

1. Create a Resend account.
2. Add and verify your sending domain when you have the domain ready.
3. Create an API key.
4. Give me the API key value only when you are ready to configure production.

### 4. Beehiiv

Use Beehiiv only if you want a real newsletter, not just a waitlist.

You do later:

1. Create a Beehiiv account.
2. Create a publication.
3. Create an API key.
4. Send me the publication ID and API key when you want newsletter sync.

My recommendation: wait on Beehiiv until the waitlist works.

## What I Set Up In The Repo

### Landing Page

I set up the repo to support:

- Next.js landing page
- `/api/waitlist`
- Supabase waitlist table
- local development fallback
- Resend notification variables
- future Beehiiv variables

The landing page saves waitlist signups in this order:

1. Supabase, if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.
2. Local JSONL file, if Supabase is not configured.

### Patterns App

I set up the database plan for:

- source records
- source chunks
- source embeddings with pgvector
- intake cases
- pattern outputs
- vector matching by tradition

The database intentionally keeps Ayurveda, Traditional Chinese Medicine, and Homeopathy separated before any cross-tradition synthesis.

I also added an exporter for the existing normalized chunks:

```bash
python3 src/export_supabase_source_rows.py
```

That writes:

```text
data/supabase_import/sources.jsonl
data/supabase_import/source_chunks.jsonl
```

Those files are prepared for importing into the Supabase `sources` and `source_chunks` tables. They do not include raw PDFs.

## How The Two Projects Connect

```text
Landing page
  -> /api/waitlist
  -> Supabase waitlist_subscribers
  -> optional Resend/Beehiiv email flow
```

```text
Patterns app
  -> /api/pattern-brain
  -> Supabase intake_cases
  -> source_chunks + source_embeddings
  -> tradition-specific retrieval
  -> pattern_outputs
```

Supabase is the shared backend. The landing page uses it for emails. The Patterns app uses it for intakes, sources, embeddings, and outputs.

## Environment Variables

Use `.env.example` as the template.

Required first:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WAITLIST_TABLE=waitlist_subscribers
```

Optional next:

```text
RESEND_API_KEY=
WAITLIST_NOTIFY_EMAIL=
WAITLIST_FROM_EMAIL=
```

Later:

```text
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=
```

## Setup Order

1. Create Supabase project.
2. Run `supabase/migrations/001_patterns_stack.sql`.
3. Add Supabase env vars locally and in Vercel.
4. Test landing-page waitlist form.
5. Add Resend.
6. Deploy on Vercel.
7. Add embedding pipeline.
8. Add Beehiiv only when newsletter publishing is needed.

## Current Stop Point

The repo is ready for Supabase/Vercel/Resend connection, but I still need your actual account-created values before I can connect production:

- Supabase URL
- Supabase anon key
- Supabase service role key
- Resend API key, optional
- production domain, optional
