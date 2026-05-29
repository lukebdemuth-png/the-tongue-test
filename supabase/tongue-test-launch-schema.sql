-- Tongue Test TCM launch tables.
-- Run in the Supabase SQL editor for the project connected to Vercel.
-- These tables are written by server-side API routes using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  interest text,
  source text default 'landing-page',
  created_at timestamptz not null default now()
);

alter table public.waitlist_subscribers enable row level security;

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  email text,
  message text not null,
  source text default 'tongue-test',
  created_at timestamptz not null default now()
);

alter table public.app_feedback enable row level security;

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

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  livemode boolean,
  checkout_session_id text,
  customer_email text,
  plan text,
  payment_status text,
  raw_event jsonb,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- No anon/authenticated policies are added yet.
-- Server writes use the service role key from secure Vercel environment variables.
-- Add user-facing read policies later only after auth/user ownership exists.
