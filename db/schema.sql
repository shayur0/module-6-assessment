-- Ledger — personal bookkeeping bot
-- Schema from the final ERD (M10 database assessment)
-- Target: Postgres (Supabase)
--
-- Run in Supabase: Dashboard -> SQL Editor -> paste this file -> Run.

create extension if not exists pgcrypto;

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  date date not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  category text,
  status text not null default 'OK' check (status in ('OK', 'NEEDS_REVIEW')),
  source_file text,
  created_at timestamptz not null default now()
);

-- No foreign key here on purpose: the app matches a correction against a vendor
-- name by substring (see app/lib/learnings.js: findCorrection), not by id.
create table if not exists vendor_corrections (
  id uuid primary key default gen_random_uuid(),
  vendor_pattern text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_vendor_id on expenses(vendor_id);
