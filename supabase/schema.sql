-- Localified · Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  birth_date date,
  phone text,
  role text not null default 'client' check (role in ('client', 'runner')),
  picture text,
  created_at timestamptz not null default now()
);

-- Jobs / errands (compatible with former job-data.json fields)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  address text,
  schedule text,
  payment text,
  budget_type text default 'fixed',
  budget_min text,
  budget_max text,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  owner_id uuid references public.profiles (id) on delete set null,
  contact_no text,
  email text,
  created_at timestamptz not null default now()
);

-- Applications to jobs
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid references public.profiles (id) on delete set null,
  applicant text,
  message text default '',
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Declined')),
  rating integer check (rating is null or (rating between 1 and 5)),
  hidden boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_owner_id_idx on public.jobs (owner_id);
create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists applications_task_id_idx on public.applications (task_id);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, birth_date, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Local'),
    coalesce(new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Profiles policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Jobs policies
drop policy if exists "Jobs are viewable by everyone" on public.jobs;
create policy "Jobs are viewable by everyone"
  on public.jobs for select
  using (true);

drop policy if exists "Authenticated users can create jobs" on public.jobs;
create policy "Authenticated users can create jobs"
  on public.jobs for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their jobs" on public.jobs;
create policy "Owners can update their jobs"
  on public.jobs for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their jobs" on public.jobs;
create policy "Owners can delete their jobs"
  on public.jobs for delete
  using (auth.uid() = owner_id);

-- Applications policies
drop policy if exists "Applications are viewable by everyone" on public.applications;
create policy "Applications are viewable by everyone"
  on public.applications for select
  using (true);

drop policy if exists "Authenticated users can apply" on public.applications;
create policy "Authenticated users can apply"
  on public.applications for insert
  with check (auth.uid() = applicant_id);

drop policy if exists "Applicants and owners can update applications" on public.applications;
create policy "Applicants and owners can update applications"
  on public.applications for update
  using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j
      where j.id = applications.task_id and j.owner_id = auth.uid()
    )
  );

drop policy if exists "Applicants and owners can delete applications" on public.applications;
create policy "Applicants and owners can delete applications"
  on public.applications for delete
  using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j
      where j.id = applications.task_id and j.owner_id = auth.uid()
    )
  );
