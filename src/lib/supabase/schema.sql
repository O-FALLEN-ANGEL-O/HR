-- Drop existing tables and policies to start fresh
drop policy if exists "Allow public insert access for applicants" on public.applicants;
drop policy if exists "Allow public read access" on public.time_off_requests;
drop policy if exists "Allow public read access" on public.performance_reviews;
drop policy if exists "Allow public read access" on public.onboarding_workflows;
drop policy if exists "Allow public read access" on public.interviews;
drop policy if exists "Allow public read access" on public.applicant_notes;
drop policy if exists "Allow public read access" on public.applicants;
drop policy if exists "Allow public read access" on public.colleges;
drop policy if exists "Allow public read access" on public.jobs;
drop policy if exists "Allow public read access" on public.metrics;

drop table if exists public.applicant_notes;
drop table if exists public.time_off_requests;
drop table if exists public.performance_reviews;
drop table if exists public.onboarding_workflows;
drop table if exists public.interviews;
drop table if exists public.applicants;
drop table if exists public.colleges;
drop table if exists public.jobs;
drop table if exists public.metrics;

-- Create tables
create table metrics (
  id serial primary key,
  title text not null,
  value text not null,
  change text,
  change_type text
);

create table jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  department text not null,
  description text,
  status text not null,
  applicants integer not null,
  posted_date timestamptz not null
);

create table colleges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status text not null,
  resumes_received integer not null,
  contact_email text not null,
  last_contacted timestamptz not null
);

create table applicants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  phone text,
  job_id uuid references jobs(id),
  stage text not null,
  applied_date timestamptz not null,
  avatar text,
  source text,
  wpm integer,
  accuracy integer,
  aptitude_score integer,
  college_id uuid references colleges(id),
  resume_data jsonb,
  ai_match_score integer,
  ai_justification text
);

create table interviews (
  id uuid default gen_random_uuid() primary key,
  candidate_name text not null,
  candidate_avatar text,
  job_title text not null,
  interviewer_name text not null,
  interviewer_avatar text,
  date timestamptz not null,
  time text not null,
  type text not null,
  status text not null
);

create table onboarding_workflows (
  id uuid default gen_random_uuid() primary key,
  employee_name text not null,
  employee_avatar text,
  job_title text not null,
  manager_name text not null,
  buddy_name text not null,
  progress integer not null,
  current_step text not null,
  start_date timestamptz not null
);

create table performance_reviews (
  id uuid default gen_random_uuid() primary key,
  employee_name text not null,
  employee_avatar text,
  job_title text not null,
  review_date text not null,
  status text not null
);

create table time_off_requests (
  id uuid default gen_random_uuid() primary key,
  employee_name text not null,
  employee_avatar text,
  type text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null
);

create table applicant_notes (
  id uuid default gen_random_uuid() primary key,
  applicant_id uuid references applicants(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  note text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table metrics enable row level security;
alter table jobs enable row level security;
alter table colleges enable row level security;
alter table applicants enable row level security;
alter table interviews enable row level security;
alter table onboarding_workflows enable row level security;
alter table performance_reviews enable row level security;
alter table time_off_requests enable row level security;
alter table applicant_notes enable row level security;

-- Create RLS Policies
create policy "Allow public read access" on metrics for select using (true);
create policy "Allow public read access" on jobs for select using (true);
create policy "Allow public read access" on colleges for select using (true);
create policy "Allow public read access" on applicants for select using (true);
create policy "Allow public read access" on interviews for select using (true);
create policy "Allow public read access" on onboarding_workflows for select using (true);
create policy "Allow public read access" on performance_reviews for select using (true);
create policy "Allow public read access" on time_off_requests for select using (true);
create policy "Allow public read access" on applicant_notes for select using (true);

-- THIS IS THE FIX: Allow anyone to insert a new applicant record
create policy "Allow public insert for applicants" on applicants for insert with check (true);

-- Policies for Storage
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
