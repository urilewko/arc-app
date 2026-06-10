-- ================================================
-- ARC App - Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================

-- CONTACTS
create table if not exists contacts (
  id text primary key,
  org_name text default '',
  contact_name text default '',
  role text default '',
  phone text default '',
  email text default '',
  notes text default '',
  created_at text default ''
);

-- LEADS
create table if not exists leads (
  id text primary key,
  contact_id text default '',
  org_name text default '',
  status text default 'שיחה ראשונית',
  source text default '',
  product_type text default 'סדנה חד פעמית',
  deal_value numeric default 0,
  next_action text default '',
  responsible text default '',
  due_date text default '',
  activity_date text default '',
  notes text default '',
  created_at text default ''
);

-- PROJECTS
create table if not exists projects (
  id text primary key,
  lead_id text default '',
  contact_id text default '',
  org_name text default '',
  product_type text default 'סדנה חד פעמית',
  start_date text default '',
  end_date text default '',
  production_status text default 'עוד לא התחלנו',
  price numeric default 0,
  team_members jsonb default '[]',
  tasks jsonb default '[]',
  notes text default '',
  created_at text default ''
);

-- INFRA PROJECTS
create table if not exists infra_projects (
  id text primary key,
  name text default '',
  category text default 'אחר',
  production_status text default 'עוד לא התחלנו',
  owner text default '',
  due_date text default '',
  notes text default '',
  expenses jsonb default '[]',
  created_at text default ''
);

-- BLOCKS
create table if not exists blocks (
  id text primary key,
  name text default '',
  product_type text default 'סדנה חד פעמית',
  tagline text default '',
  description text default '',
  duration text default '',
  group_size text default '',
  price numeric default 0,
  status text default 'רעיון',
  completion_percent numeric default 0,
  content_items jsonb default '[]',
  experience text default '',
  logistics text default '',
  marketing_pitch text default '',
  marketing_audience text default '',
  marketing_links jsonb default '[]',
  expenses jsonb default '[]',
  created_at text default ''
);

-- COLLABORATORS
create table if not exists collaborators (
  id text primary key,
  name text default '',
  domain text default 'אחר',
  specialty text default '',
  phone text default '',
  email text default '',
  availability text default 'פנוי',
  work_terms text default '',
  past_projects text default '',
  notes text default '',
  created_at text default ''
);

-- FINANCE RECORDS
create table if not exists finance_records (
  id text primary key,
  project_id text default '',
  org_name text default '',
  amount numeric default 0,
  payment_status text default 'ממתין',
  invoice_date text default '',
  paid_date text default '',
  notes text default '',
  record_type text default 'income',
  expense_category text default '',
  created_at text default ''
);

-- DEBRIEFS
create table if not exists debriefs (
  id text primary key,
  project_id text default '',
  org_name text default '',
  event_date text default '',
  event_date_end text default '',
  participants_count numeric default 0,
  location text default '',
  block_name text default '',
  schedule_slots jsonb default '[]',
  content_slot_reviews jsonb default '[]',
  content_general_reviews jsonb default '[]',
  content_score numeric default 0,
  logistics_general_reviews jsonb default '[]',
  logistics_score numeric default 0,
  collab_reviews jsonb default '[]',
  org_work_score numeric default 0,
  org_value_score numeric default 0,
  payment_received numeric default 0,
  expenses jsonb default '[]',
  photo_album_link text default '',
  quotes_link text default '',
  notes text default '',
  created_at text default ''
);

-- ================================================
-- ROW LEVEL SECURITY — only logged-in users can access
-- ================================================
alter table contacts enable row level security;
alter table leads enable row level security;
alter table projects enable row level security;
alter table infra_projects enable row level security;
alter table blocks enable row level security;
alter table collaborators enable row level security;
alter table finance_records enable row level security;
alter table debriefs enable row level security;

create policy "auth_all" on contacts for all to authenticated using (true) with check (true);
create policy "auth_all" on leads for all to authenticated using (true) with check (true);
create policy "auth_all" on projects for all to authenticated using (true) with check (true);
create policy "auth_all" on infra_projects for all to authenticated using (true) with check (true);
create policy "auth_all" on blocks for all to authenticated using (true) with check (true);
create policy "auth_all" on collaborators for all to authenticated using (true) with check (true);
create policy "auth_all" on finance_records for all to authenticated using (true) with check (true);
create policy "auth_all" on debriefs for all to authenticated using (true) with check (true);
