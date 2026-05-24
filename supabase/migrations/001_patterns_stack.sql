-- Patterns / Three Traditions first production schema.
-- Run this in the Supabase SQL editor after creating the Supabase project.
-- It keeps landing-page waitlist data, source chunks, embeddings, intakes,
-- and app outputs in one backend while preserving tradition separation.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table if not exists public.waitlist_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  interest text,
  source text not null default 'landing-page',
  newsletter_provider text,
  provider_contact_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id text primary key,
  title text not null,
  tradition text not null check (tradition in ('Ayurveda', 'Traditional Chinese Medicine', 'Homeopathy', 'Cross-Tradition', 'Integrative')),
  school text,
  source_type text,
  source_category text,
  canonical_layer text,
  author_authors text[] not null default '{}',
  translator_authors text[] not null default '{}',
  editor_commentator text[] not null default '{}',
  edition text,
  source_url text,
  source_access_status text not null,
  license_or_rights_note text not null,
  retrieval_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_chunks (
  id text primary key,
  source_id text not null references public.sources(id) on delete cascade,
  book text not null,
  tradition text not null check (tradition in ('Ayurveda', 'Traditional Chinese Medicine', 'Homeopathy', 'Cross-Tradition', 'Integrative')),
  stable_locator text,
  page_start integer,
  page_end integer,
  section text,
  chapter text,
  sutra_or_aphorism text,
  entry_type text,
  language text,
  text text not null,
  keywords text[] not null default '{}',
  concepts text[] not null default '{}',
  symptoms text[] not null default '{}',
  patterns text[] not null default '{}',
  interventions text[] not null default '{}',
  contraindications text[] not null default '{}',
  citation jsonb not null default '{}'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  raw_chunk jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists source_chunks_source_id_idx on public.source_chunks(source_id);
create index if not exists source_chunks_tradition_idx on public.source_chunks(tradition);
create index if not exists source_chunks_concepts_idx on public.source_chunks using gin(concepts);
create index if not exists source_chunks_symptoms_idx on public.source_chunks using gin(symptoms);
create index if not exists source_chunks_patterns_idx on public.source_chunks using gin(patterns);

create table if not exists public.source_embeddings (
  chunk_id text primary key references public.source_chunks(id) on delete cascade,
  embedding_model text not null,
  embedding vector(1536) not null,
  embedded_at timestamptz not null default now()
);

create index if not exists source_embeddings_vector_idx
  on public.source_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists public.intake_cases (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  intake jsonb not null,
  safety_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pattern_outputs (
  id uuid primary key default gen_random_uuid(),
  intake_case_id uuid references public.intake_cases(id) on delete cascade,
  output jsonb not null,
  model_version text,
  retrieval_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.match_source_chunks(
  query_embedding vector(1536),
  match_count integer default 12,
  tradition_filter text default null
)
returns table (
  chunk_id text,
  source_id text,
  tradition text,
  book text,
  stable_locator text,
  text text,
  citation jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.source_id,
    c.tradition,
    c.book,
    c.stable_locator,
    c.text,
    c.citation,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.source_embeddings e
  join public.source_chunks c on c.id = e.chunk_id
  where tradition_filter is null or c.tradition = tradition_filter
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.waitlist_subscribers enable row level security;
alter table public.sources enable row level security;
alter table public.source_chunks enable row level security;
alter table public.source_embeddings enable row level security;
alter table public.intake_cases enable row level security;
alter table public.pattern_outputs enable row level security;

-- The app currently writes through server routes with SUPABASE_SERVICE_ROLE_KEY.
-- Add anon/auth policies later when public browser access is intentionally designed.
