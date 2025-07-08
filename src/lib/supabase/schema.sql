-- 1. Create User Roles Enum Type
-- This type defines the available roles a user can have in the system.
drop type if exists public.user_role;
create type public.user_role as enum ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'employee', 'intern', 'guest');

-- 2. Create Users Table
-- This table stores public user information and links to the authentication user.
create table if not exists public.users (
    id uuid not null primary key, -- Corresponds to auth.users.id
    full_name text,
    email text unique,
    avatar_url text,
    role public.user_role not null default 'employee',
    department text,
    created_at timestamp with time zone default now(),
    
    constraint id foreign key(id) references auth.users(id) on delete cascade
);
comment on table public.users is 'Public user profile information.';

-- 3. Create Function to Handle New User
-- This trigger function automatically creates a public user profile
-- when a new user signs up in Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'employee' -- Default role for new sign-ups
  );
  return new;
end;
$$;

-- 4. Create Trigger for New Users
-- This trigger calls the handle_new_user function after a new user is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Set up Storage for Avatars
-- Create a bucket for user avatars with appropriate access policies.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

drop policy if exists "Anyone can update their own avatar." on storage.objects;
create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner) with check (bucket_id = 'avatars');
  
-- 6. Enable Row-Level Security (RLS) for all tables
-- This is a critical security step.
alter table public.users enable row level security;
alter table public.metrics enable row level security;
alter table public.jobs enable row level security;
alter table public.colleges enable row level security;
alter table public.applicants enable row level security;
alter table public.applicant_notes enable row level security;
alter table public.interviews enable row level security;
alter table public.onboarding_workflows enable row level security;
alter table public.performance_reviews enable row level security;
alter table public.time_off_requests enable row level security;


-- 7. Define RLS Policies
-- These policies dictate who can access or modify data in each table.

-- Function to check user role
create or replace function public.get_user_role(user_id uuid)
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.users where id = user_id;
$$;

-- Policy: users
drop policy if exists "Users can view their own profile." on public.users;
create policy "Users can view their own profile." on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile." on public.users;
create policy "Users can update their own profile." on public.users
  for update using (auth.uid() = id);
  
drop policy if exists "Admins can manage all user profiles." on public.users;
create policy "Admins can manage all user profiles." on public.users
  for all using (public.get_user_role(auth.uid()) = 'admin');

-- Policies for HR-related tables (jobs, applicants, etc.)
create or replace function public.is_hr()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.get_user_role(auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter');
$$;

-- Policy: jobs
drop policy if exists "Authenticated users can view jobs." on public.jobs;
create policy "Authenticated users can view jobs." on public.jobs
  for select using (auth.role() = 'authenticated');
  
drop policy if exists "HR roles can manage jobs." on public.jobs;
create policy "HR roles can manage jobs." on public.jobs
  for all using (public.is_hr());

-- Policy: applicants
drop policy if exists "HR roles can manage applicants." on public.applicants;
create policy "HR roles can manage applicants." on public.applicants
  for all using (public.is_hr());

-- Policy: applicant_notes
drop policy if exists "HR roles can manage applicant notes." on public.applicant_notes;
create policy "HR roles can manage applicant notes." on public.applicant_notes
  for all using (public.is_hr());

-- Policy: colleges
drop policy if exists "HR roles can manage colleges." on public.colleges;
create policy "HR roles can manage colleges." on public.colleges
  for all using (public.is_hr());

-- Policy: interviews
drop policy if exists "HR roles can manage interviews." on public.interviews;
create policy "HR roles can manage interviews." on public.interviews
  for all using (public.is_hr());

-- Policy: onboarding_workflows
drop policy if exists "HR roles can manage onboarding workflows." on public.onboarding_workflows;
create policy "HR roles can manage onboarding workflows." on public.onboarding_workflows
  for all using (public.is_hr());

-- Policy: performance_reviews
drop policy if exists "HR roles can manage performance reviews." on public.performance_reviews;
create policy "HR roles can manage performance reviews." on public.performance_reviews
  for all using (public.is_hr());

-- Policy: time_off_requests
drop policy if exists "Users can view their own time off requests." on public.time_off_requests;
create policy "Users can view their own time off requests." on public.time_off_requests
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own time off requests." on public.time_off_requests;
create policy "Users can create their own time off requests." on public.time_off_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "HR can view all time off requests." on public.time_off_requests;
create policy "HR can view all time off requests." on public.time_off_requests
  for select using (public.is_hr());
  
drop policy if exists "HR can approve/reject time off requests." on public.time_off_requests;
create policy "HR can approve/reject time off requests." on public.time_off_requests
  for update using (public.is_hr()) with check (public.is_hr());

-- Policy: metrics
drop policy if exists "Authenticated users can view metrics." on public.metrics;
create policy "Authenticated users can view metrics." on public.metrics
  for select using (auth.role() = 'authenticated');

-- By default, deny all actions that are not explicitly allowed by a policy.
-- This is handled by enabling RLS.
