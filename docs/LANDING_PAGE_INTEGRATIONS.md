# Landing Page Integrations

This document tracks the landing-page-only setup for Patterns / Three Traditions.

## Current Implementation

- Route: `/`
- Waitlist API: `/api/waitlist`
- Form component: `components/landing/waitlist-form.tsx`
- Local fallback storage: `logs/waitlist_submissions.jsonl`

The local fallback is useful for development, but it is not durable on serverless deployment. Production should use Supabase or a newsletter platform.

## Recommended First Production Stack

Use the simplest stack that preserves ownership of the list:

- Deployment: Vercel
- Waitlist database: Supabase table
- Email notification: Resend
- Newsletter: Beehiiv or ConvertKit
- Analytics: Plausible, PostHog, or Vercel Analytics

Recommended path: start with Supabase + Vercel. Add newsletter sync after the landing page copy is stable.

## Supabase Waitlist Setup

Create a table named `waitlist_subscribers`:

```sql
create table if not exists waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  interest text,
  source text,
  created_at timestamptz not null default now()
);
```

Set these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WAITLIST_TABLE=waitlist_subscribers
```

Do not expose the service role key in the browser. It is only used by the server route.

## Resend Notification Setup

Optional. Use this if you want an email when someone joins.

```text
RESEND_API_KEY=
WAITLIST_NOTIFY_EMAIL=
WAITLIST_FROM_EMAIL=waitlist@yourdomain.com
```

The current implementation sends a simple plain-text notification after the signup is saved.

## Newsletter Setup

The app does not yet push directly into Beehiiv, ConvertKit, Mailchimp, or Resend audiences because credentials and provider choice are still pending.

Suggested options:

- Beehiiv: best if the public content/newsletter becomes a media asset.
- ConvertKit: best if the list needs creator-style tagging and sequences.
- Mailchimp: fine for a general newsletter, but heavier than needed at this stage.
- Resend Broadcasts/Audiences: good if you want developer-controlled email flows.

Next implementation step after choosing provider:

1. Add provider env vars.
2. Extend `lib/waitlist.ts` to sync after Supabase insert.
3. Add a `newsletter_provider` and `provider_contact_id` field to the Supabase table.

## Analytics Setup

No analytics package is installed yet.

Recommended:

- Vercel Analytics for fastest deployment-native setup.
- Plausible for lightweight privacy-friendly traffic analytics.
- PostHog if you want event funnels such as hero signup, newsletter signup, prototype click, and source-section scroll depth.

Events worth tracking:

- `waitlist_submitted`
- `prototype_clicked`
- `learn_how_it_works_clicked`
- `newsletter_section_viewed`

## Deployment Notes

Set `NEXT_PUBLIC_SITE_URL` or update `lib/site.ts` once the production domain is known.

Current build validation:

```bash
npm run lint
npm run build
```
